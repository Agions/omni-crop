const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Building omni-crop unified package...');

// 1. Resolve TypeScript compiler
let tscCmd = 'npx tsc';
if (fs.existsSync(path.join(__dirname, '../node_modules/.bin/tsc'))) {
  tscCmd = `"${path.join(__dirname, '../node_modules/.bin/tsc')}"`;
} else if (process.platform === 'darwin' && fs.existsSync('/opt/homebrew/bin/tsc')) {
  tscCmd = '/opt/homebrew/bin/tsc';
}

// Clean previous dist
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

// 2. Run TypeScript compiler for CJS + .d.ts
try {
  execSync(`${tscCmd} --project tsconfig.json`, { stdio: 'inherit' });
  console.log('✅ CommonJS & TypeScript declarations (.d.ts) compilation finished.');
} catch (e) {
  console.error('❌ TypeScript CJS compilation failed.');
  process.exit(1);
}

// 3. Compile ESM (.mjs)
const esmTempDir = path.join(__dirname, '../dist/_esm_temp');
try {
  fs.rmSync(esmTempDir, { recursive: true, force: true });
  execSync(
    `${tscCmd} --module ESNext --target ES2020 --outDir "${esmTempDir}" --declaration false --declarationMap false --sourceMap false`,
    { stdio: 'inherit' }
  );

  function processEsmDir(srcDir, destDir) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      if (entry.isDirectory()) {
        processEsmDir(srcPath, path.join(destDir, entry.name));
      } else if (entry.name.endsWith('.js')) {
        let code = fs.readFileSync(srcPath, 'utf8');
        // Rewrite relative imports/exports to .mjs
        code = code.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, (match, p1, specifier, p3) => {
          const resolvedPath = path.resolve(srcDir, specifier);
          if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
            return `${p1}${specifier}/index.mjs${p3}`;
          }
          if (fs.existsSync(`${resolvedPath}.js`)) {
            return `${p1}${specifier}.mjs${p3}`;
          }
          return match;
        });
        code = code.replace(
          /(import\s*\(\s*['"])(\.[^'"]+)(['"]\s*\))/g,
          (match, p1, specifier, p3) => {
            const resolvedPath = path.resolve(srcDir, specifier);
            if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
              return `${p1}${specifier}/index.mjs${p3}`;
            }
            if (fs.existsSync(`${resolvedPath}.js`)) {
              return `${p1}${specifier}.mjs${p3}`;
            }
            return match;
          }
        );

        const mjsName = entry.name.replace(/\.js$/, '.mjs');
        const targetPath = path.join(destDir, mjsName);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, code, 'utf8');
      }
    }
  }

  processEsmDir(esmTempDir, distDir);
  fs.rmSync(esmTempDir, { recursive: true, force: true });
  console.log('✅ ESM (.mjs) dual build generation finished.');
} catch (e) {
  console.error('❌ ESM compilation failed:', e);
  process.exit(1);
}

// 4. Generate CJS proxy files for WeChat miniprogram npm resolution
// WeChat WAService require does not automatically resolve directory index.js (e.g. require('../core') fails).
// Generating core.js and exporter.js at the root of dist ensures 100% resolution compatibility.
fs.writeFileSync(path.join(distDir, 'core.js'), '"use strict";\nmodule.exports = require("./core/index.js");\n', 'utf8');
fs.writeFileSync(path.join(distDir, 'core.d.ts'), 'export * from "./core/index";\n', 'utf8');
fs.writeFileSync(path.join(distDir, 'exporter.js'), '"use strict";\nmodule.exports = require("./exporter/index.js");\n', 'utf8');
fs.writeFileSync(path.join(distDir, 'exporter.d.ts'), 'export * from "./exporter/index";\n', 'utf8');

// 5. Copy Weixin component files to dist/weixin and root weixin/
const weixinSrc = path.join(__dirname, '../src/weixin');
const weixinDist = path.join(__dirname, '../dist/weixin');
const weixinRoot = path.join(__dirname, '../weixin');

fs.mkdirSync(weixinDist, { recursive: true });
fs.mkdirSync(weixinRoot, { recursive: true });

const weixinFiles = ['index.wxml', 'index.wxss', 'index.wxs', 'index.json'];
for (const file of weixinFiles) {
  const srcFile = path.join(weixinSrc, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(weixinDist, file));
    fs.copyFileSync(srcFile, path.join(weixinRoot, file));
  }
}

// Copy and patch compiled weixin js and d.ts to root weixin/
if (fs.existsSync(path.join(weixinDist, 'index.js'))) {
  let weixinJs = fs.readFileSync(path.join(weixinDist, 'index.js'), 'utf8');
  // Rewrite any relative require without .js or /index to explicit paths
  weixinJs = weixinJs.replace(/require\(["']\.\.\/core["']\)/g, 'require("../core/index.js")');
  weixinJs = weixinJs.replace(/require\(["']\.\.\/exporter["']\)/g, 'require("../exporter/index.js")');
  fs.writeFileSync(path.join(weixinDist, 'index.js'), weixinJs, 'utf8');
  fs.writeFileSync(path.join(weixinRoot, 'index.js'), weixinJs, 'utf8');
}
if (fs.existsSync(path.join(weixinDist, 'index.d.ts'))) {
  fs.copyFileSync(path.join(weixinDist, 'index.d.ts'), path.join(weixinRoot, 'index.d.ts'));
}

// 6. Copy uni-app OmniCrop.vue
const uniSrc = path.join(__dirname, '../src/uni-app/OmniCrop.vue');
const uniDist = path.join(__dirname, '../dist/uni-app/OmniCrop.vue');
if (fs.existsSync(uniSrc)) {
  fs.mkdirSync(path.dirname(uniDist), { recursive: true });
  fs.copyFileSync(uniSrc, uniDist);
}

// 7. Synchronize to examples/miniprogram-demo/miniprogram_npm/omni-crop
const demoNpmDir = path.join(__dirname, '../examples/miniprogram-demo/miniprogram_npm/omni-crop');
if (fs.existsSync(demoNpmDir)) {
  fs.cpSync(distDir, demoNpmDir, { recursive: true });
  fs.copyFileSync(path.join(__dirname, '../package.json'), path.join(demoNpmDir, 'package.json'));
  console.log('✅ Synchronized dist/ to examples/miniprogram-demo/miniprogram_npm/omni-crop');
}

console.log('✅ Asset copy finished: weixin, uni-app, and demo components ready.');


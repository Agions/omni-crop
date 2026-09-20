const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Building omni-crop unified package...');

// 1. Run TypeScript compiler
try {
  let tscCmd = 'npx tsc';
  if (fs.existsSync(path.join(__dirname, '../node_modules/.bin/tsc'))) {
    tscCmd = `"${path.join(__dirname, '../node_modules/.bin/tsc')}"`;
  } else if (process.platform === 'darwin' && fs.existsSync('/opt/homebrew/bin/tsc')) {
    tscCmd = '/opt/homebrew/bin/tsc';
  }
  execSync(`${tscCmd} --project tsconfig.json`, { stdio: 'inherit' });
  console.log('✅ TypeScript compilation finished.');
} catch (e) {
  console.error('❌ TypeScript compilation failed.');
  process.exit(1);
}

// 2. Copy Weixin component files to dist/weixin
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

// Copy compiled weixin js and d.ts to root weixin/
if (fs.existsSync(path.join(weixinDist, 'index.js'))) {
  fs.copyFileSync(path.join(weixinDist, 'index.js'), path.join(weixinRoot, 'index.js'));
}
if (fs.existsSync(path.join(weixinDist, 'index.d.ts'))) {
  fs.copyFileSync(path.join(weixinDist, 'index.d.ts'), path.join(weixinRoot, 'index.d.ts'));
}

// 3. Copy uni-app OmniCrop.vue
const uniSrc = path.join(__dirname, '../src/uni-app/OmniCrop.vue');
const uniDist = path.join(__dirname, '../dist/uni-app/OmniCrop.vue');
if (fs.existsSync(uniSrc)) {
  fs.mkdirSync(path.dirname(uniDist), { recursive: true });
  fs.copyFileSync(uniSrc, uniDist);
}

console.log('✅ Asset copy finished: weixin and uni-app components ready.');

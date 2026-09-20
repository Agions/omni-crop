import type { App } from 'vue';
import OmniCrop from './OmniCrop.vue';
export * from './useOmniCrop';

export { OmniCrop };

export default {
  install(app: App) {
    app.component('OmniCrop', OmniCrop);
  },
};

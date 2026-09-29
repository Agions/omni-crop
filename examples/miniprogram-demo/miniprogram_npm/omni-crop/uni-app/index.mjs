import OmniCrop from './OmniCrop.vue';
export * from './useOmniCrop.mjs';
export { OmniCrop };
export default {
    install(app) {
        app.component('OmniCrop', OmniCrop);
    },
};

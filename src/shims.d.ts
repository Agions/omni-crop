// Ambient type shims for external framework peer dependencies

declare namespace React {
  export type CSSProperties = Record<string, any>;
  export type SyntheticEvent<T = any> = any;
  export type TouchEvent<T = any> = any;
  export type MouseEvent<T = any> = any;
  export type WheelEvent<T = any> = any;
}

declare module 'react' {
  export function useState<T = any>(initial?: T | (() => T)): [T, (val: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T = any>(initial?: T): { current: T };
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T;
  export function forwardRef<T = any, P = any>(render: (props: P, ref: any) => any): any;
  export function useImperativeHandle<T = any>(ref: any, init: () => T, deps?: any[]): void;
  export type ReactNode = any;
  export type CSSProperties = Record<string, any>;
  export type SyntheticEvent<T = any> = any;
  export type TouchEvent<T = any> = any;
  export type MouseEvent<T = any> = any;
  export type WheelEvent<T = any> = any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'vue' {
  export function ref<T = any>(val?: T): { value: T };
  export function reactive<T extends object>(target: T): T;
  export function computed<T = any>(getter: () => T): { value: T };
  export function watch(source: any, cb: any, options?: any): void;
  export function onMounted(fn: () => void): void;
  export function onUnmounted(fn: () => void): void;
  export type App = any;
  export type Ref<T = any> = { value: T };
}

declare module '*.vue' {
  const component: any;
  export default component;
}

declare module '@tarojs/taro' {
  const Taro: any;
  export default Taro;
}

declare module '@tarojs/components' {
  export const View: any;
  export const Image: any;
  export const Canvas: any;
}

declare module 'react-native' {
  export const StyleSheet: any;
  export const View: any;
  export const Image: any;
  export type LayoutChangeEvent = any;
}

declare module 'react-native-gesture-handler' {
  export const GestureDetector: any;
  export const Gesture: any;
  export const GestureHandlerRootView: any;
}

declare module 'react-native-reanimated' {
  export const useSharedValue: any;
  export const useAnimatedStyle: any;
  export const runOnJS: any;
  const Animated: any;
  export default Animated;
}

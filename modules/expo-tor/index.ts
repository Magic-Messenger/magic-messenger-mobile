// Reexport the native module. On web, it will be resolved to ExpoTorModule.web.ts
// and on native platforms to ExpoTorModule.ts
export * from "./src/ExpoTor.types";
export { default } from "./src/ExpoTorModule";
export { default as ExpoTorView } from "./src/ExpoTorView";

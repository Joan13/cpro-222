// Re-export the native module. On web, it will be resolved to ProximityModule.web.ts
// and on native platforms to ProximityModule.ts
export { default } from './src/ProximityModule';
export * from './src/Proximity.types';

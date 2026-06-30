import { NativeModule, requireNativeModule } from 'expo';

declare class ProximityModule extends NativeModule<{
  onProximityChange: (event: { isNear: boolean }) => void;
}> {
  setProximityMonitoringEnabled(enabled: boolean): void;
}

export default requireNativeModule<ProximityModule>('Proximity');

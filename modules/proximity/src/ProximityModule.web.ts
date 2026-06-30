import { registerWebModule, NativeModule } from 'expo';

// ProximityModule is not available on the web platform.
class ProximityModule extends NativeModule<{}> {}

export default registerWebModule(ProximityModule, 'ProximityModule');

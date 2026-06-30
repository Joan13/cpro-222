import ExpoModulesCore

public class ProximityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Proximity")

    Events("onProximityChange")

    Function("setProximityMonitoringEnabled") { (enabled: Bool) in
      DispatchQueue.main.async {
        UIDevice.current.isProximityMonitoringEnabled = enabled
        
        if enabled {
          NotificationCenter.default.addObserver(
            self,
            selector: #selector(self.proximityStateDidChange),
            name: UIDevice.proximityStateDidChangeNotification,
            object: nil
          )
        } else {
          NotificationCenter.default.removeObserver(
            self,
            name: UIDevice.proximityStateDidChangeNotification,
            object: nil
          )
        }
      }
    }
  }

  @objc private func proximityStateDidChange() {
    let isNear = UIDevice.current.proximityState
    sendEvent("onProximityChange", [
      "isNear": isNear
    ])
  }
}

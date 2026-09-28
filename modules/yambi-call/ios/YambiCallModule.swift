import ExpoModulesCore
import AVFoundation

public class YambiCallModule: Module {
  public func definition() -> ModuleDefinition {
    Name("YambiCall")

    Events(
      "onVoIPTokenReceived",
      "onCallAnswered",
      "onCallRejected",
      "onCallEnded",
      "onCallMuted"
    )

    OnCreate {
      let manager = YambiCallManager.shared

      manager.onVoIPTokenReceived = { [weak self] token in
        self?.sendEvent("onVoIPTokenReceived", [
          "token": token
        ])
      }

      manager.onCallAnswered = { [weak self] callData in
        self?.sendEvent("onCallAnswered", callData)
      }

      manager.onCallRejected = { [weak self] callData in
        self?.sendEvent("onCallRejected", callData)
      }

      manager.onCallEnded = { [weak self] callData in
        self?.sendEvent("onCallEnded", callData)
      }

      manager.onCallMuted = { [weak self] isMuted in
        self?.sendEvent("onCallMuted", [
          "isMuted": isMuted
        ])
      }
    }

    Function("initialize") {
      let manager = YambiCallManager.shared
      if let token = manager.cachedVoIPToken {
        self.sendEvent("onVoIPTokenReceived", ["token": token])
      }
    }

    Function("setUserPhone") { (phone: String) -> Void in
      NativeSignalingManager.shared.connect(userPhone: phone)
    }

    Function("setCallStrings") { (strings: [String: String]) -> Void in
      UserDefaults.standard.set(strings, forKey: "yambi_call_strings")
    }

    AsyncFunction("startOutgoingCall") { (options: [String: Any]) -> String? in
      guard let calleeId = options["calleeId"] as? String else { return nil }
      let callId = "call_\(Int(Date().timeIntervalSince1970 * 1000))_\(Int.random(in: 1000...9999))"
      let calleeName = (options["calleeName"] as? String) ?? calleeId
      let calleeAvatar = (options["calleeAvatar"] as? String) ?? ""
      let callType = (options["callType"] as? String) ?? "audio"
      let callerId = (options["callerId"] as? String) ?? NativeSignalingManager.shared.getUserPhone()
      let callerName = (options["callerName"] as? String) ?? callerId
      let callerAvatar = (options["callerAvatar"] as? String) ?? ""

      DispatchQueue.main.async {
        YambiCallManager.shared.startOutgoingCallNatively(
          callId: callId,
          calleeId: calleeId,
          calleeName: calleeName,
          callType: callType,
          calleeAvatar: calleeAvatar,
          callerId: callerId,
          callerName: callerName,
          callerAvatar: callerAvatar
        )
      }
      return callId
    }

    AsyncFunction("getUnsyncedCallHistory") { () -> [[String: Any]] in
      return CallHistoryDatabase.shared.getUnsynced()
    }

    AsyncFunction("markCallHistorySynced") { (ids: [String]) -> Void in
      CallHistoryDatabase.shared.markSynced(ids: ids)
    }

    AsyncFunction("getPendingCall") { () -> [String: Any]? in
      return YambiCallManager.shared.getPendingCall()
    }

    AsyncFunction("clearPendingCall") { () -> Void in
      YambiCallManager.shared.clearPendingCall()
    }

    AsyncFunction("reportIncomingCall") { (options: [String: Any]) -> Void in
      guard let callId = options["callId"] as? String else { return }
      let callerId = (options["callerId"] as? String) ?? ""
      let callerName = (options["callerName"] as? String) ?? callerId
      let callerAvatar = options["callerAvatar"] as? String
      let callType = (options["callType"] as? String) ?? "audio"
      let hasVideo = (options["hasVideo"] as? Bool) ?? (callType == "video")

      YambiCallManager.shared.reportIncomingCall(
        callId: callId,
        callerId: callerId,
        callerName: callerName,
        callerAvatar: callerAvatar,
        callType: callType,
        hasVideo: hasVideo
      )
    }

    AsyncFunction("reportOutgoingCall") { (callId: String, calleeName: String, hasVideo: Bool) -> Void in
      YambiCallManager.shared.reportOutgoingCall(callId: callId, calleeName: calleeName, hasVideo: hasVideo)
    }

    AsyncFunction("reportCallConnected") { (callId: String) -> Void in
      YambiCallManager.shared.reportCallConnected(callId: callId)
    }

    AsyncFunction("reportCallEnded") { (callId: String, reason: String?) -> Void in
      YambiCallManager.shared.reportCallEnded(callId: callId, reason: reason ?? "USER_ENDED")
    }

    AsyncFunction("setMuted") { (callId: String, muted: Bool) -> Void in
      YambiCallManager.shared.setMuted(callId: callId, muted: muted)
    }

    AsyncFunction("setSpeaker") { (_ callId: String, enabled: Bool) -> Void in
      DispatchQueue.main.async {
        do {
          let session = AVAudioSession.sharedInstance()
          if enabled {
            try session.overrideOutputAudioPort(.speaker)
          } else {
            try session.overrideOutputAudioPort(.none)
          }
        } catch {
          NSLog("[YAMBI_CALL] Failed to toggle speaker: %@", error.localizedDescription)
        }
      }
    }

    AsyncFunction("dismissNotification") { (callId: String) -> Void in
      YambiCallManager.shared.reportCallEnded(callId: callId, reason: "DISMISSED")
    }

    AsyncFunction("startRingtone") { () -> Void in
      // CallKit handles user's base ringtone automatically
    }

    AsyncFunction("stopRingtone") { () -> Void in
      // CallKit handles ringtone stop automatically
    }

    AsyncFunction("wasCallAnswered") { (callId: String) -> Bool in
      return YambiCallManager.shared.wasCallAnswered(callId: callId)
    }
  }
}

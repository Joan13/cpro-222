import Foundation
import CallKit
import PushKit
import AVFoundation

public class YambiCallManager: NSObject, CXProviderDelegate, PKPushRegistryDelegate {
  public static let shared = YambiCallManager()

  private var provider: CXProvider?
  private let callController = CXCallController()
  private var voipRegistry: PKPushRegistry?

  // Mapping between callId (String) and CallKit UUID
  private var callIdToUUID: [String: UUID] = [:]
  private var uuidToCallId: [UUID: String] = [:]
  private var activeCalls: [String: [String: Any]] = [:]

  // Pending call for cold-start delivery
  private var pendingCall: [String: Any]?

  // Callbacks to Expo Module
  public var onVoIPTokenReceived: ((String) -> Void)?
  public var onCallAnswered: (([String: Any]) -> Void)?
  public var onCallRejected: (([String: Any]) -> Void)?
  public var onCallEnded: (([String: Any]) -> Void)?
  public var onCallMuted: ((Bool) -> Void)?

  public var cachedVoIPToken: String?

  private var answeredCallIds: Set<String> = []

  public func markCallAnswered(callId: String) {
    if !callId.isEmpty {
      answeredCallIds.insert(callId)
    }
  }

  public func wasCallAnswered(callId: String) -> Bool {
    return answeredCallIds.contains(callId)
  }

  private let userDefaultsPendingKey = "YAMBI_PENDING_CALL_DATA"

  override private init() {
    super.init()
    setupCallKit()
    setupPushKit()
  }

  // MARK: - Setup

  private func setupCallKit() {
    let config = CXProviderConfiguration(localizedName: "Yambi")
    config.supportsVideo = true
    config.maximumCallsPerCallGroup = 1
    config.maximumCallGroups = 1
    config.supportedHandleTypes = [.phoneNumber, .generic]
    
    if let icon = UIImage(named: "AppIcon") {
      config.iconTemplateImageData = icon.pngData()
    }

    provider = CXProvider(configuration: config)
    provider?.setDelegate(self, queue: DispatchQueue.main)
  }

  private func setupPushKit() {
    DispatchQueue.main.async {
      self.voipRegistry = PKPushRegistry(queue: DispatchQueue.main)
      self.voipRegistry?.delegate = self
      self.voipRegistry?.desiredPushTypes = [.voIP]
    }
  }

  // MARK: - Helpers

  private func getOrCreateUUID(for callId: String) -> UUID {
    if let existingUUID = callIdToUUID[callId] {
      return existingUUID
    }
    // Create deterministic or new UUID
    let uuid = UUID()
    callIdToUUID[callId] = uuid
    uuidToCallId[uuid] = callId
    return uuid
  }

  private func getCallId(for uuid: UUID) -> String? {
    return uuidToCallId[uuid]
  }

  // MARK: - Public Methods

  public func reportIncomingCall(
    callId: String,
    callerId: String,
    callerName: String,
    callerAvatar: String? = nil,
    callType: String = "audio",
    hasVideo: Bool = false,
    completion: ((Error?) -> Void)? = nil
  ) {
    let uuid = getOrCreateUUID(for: callId)
    let callData: [String: Any] = [
      "callId": callId,
      "callerId": callerId,
      "callerName": callerName,
      "callerAvatar": callerAvatar ?? "",
      "callType": callType,
      "hasVideo": hasVideo || (callType == "video")
    ]
    activeCalls[callId] = callData

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callerId.isEmpty ? callerName : callerId)
    update.localizedCallerName = callerName.isEmpty ? callerId : callerName
    update.hasVideo = hasVideo || (callType == "video")
    update.supportsGrouping = false
    update.supportsUngrouping = false
    update.supportsHolding = false
    update.supportsDTMF = false

    NSLog("[YAMBI_CALL] Reporting incoming CallKit call: callId=%@, uuid=%@", callId, uuid.uuidString)

    provider?.reportNewIncomingCall(with: uuid, update: update) { [weak self] error in
      if let error = error {
        NSLog("[YAMBI_CALL] Error reporting incoming call to CallKit: %@", error.localizedDescription)
        self?.activeCalls.removeValue(forKey: callId)
      }
      completion?(error)
    }
  }

  public func reportOutgoingCall(callId: String, calleeName: String, hasVideo: Bool) {
    let uuid = getOrCreateUUID(for: callId)
    let handle = CXHandle(type: .generic, value: calleeName)
    let startAction = CXStartCallAction(call: uuid, handle: handle)
    startAction.isVideo = hasVideo

    let transaction = CXTransaction(action: startAction)
    callController.request(transaction) { [weak self] error in
      if let error = error {
        NSLog("[YAMBI_CALL] Error starting outgoing call: %@", error.localizedDescription)
      } else {
        self?.markCallAnswered(callId: callId)
        NSLog("[YAMBI_CALL] Outgoing call reported: callId=%@", callId)
      }
    }
  }

  public func reportCallConnected(callId: String) {
    markCallAnswered(callId: callId)
    guard let uuid = callIdToUUID[callId] else { return }
    provider?.reportOutgoingCall(with: uuid, connectedAt: Date())
    NSLog("[YAMBI_CALL] Call connected: callId=%@", callId)
  }

  public func reportCallEnded(callId: String, reason: String) {
    guard let uuid = callIdToUUID[callId] else {
      NSLog("[YAMBI_CALL] Cannot end call: UUID not found for callId=%@", callId)
      return
    }

    var cxReason: CXCallEndedReason = .remoteEnded
    if reason == "FAILED" {
      cxReason = .failed
    } else if reason == "UNANSWERED" || reason == "TIMEOUT" || reason == "NO_ANSWER" {
      cxReason = .unanswered
    } else if reason == "ANSWERED_ELSEWHERE" {
      cxReason = .answeredElsewhere
    } else if reason == "DECLINED" || reason == "REJECTED" {
      cxReason = .declinedElsewhere
    }

    provider?.reportCall(with: uuid, endedAt: Date(), reason: cxReason)
    NSLog("[YAMBI_CALL] Reported call ended to CallKit: callId=%@, reason=%@", callId, reason)

    activeCalls.removeValue(forKey: callId)
    callIdToUUID.removeValue(forKey: callId)
    uuidToCallId.removeValue(forKey: uuid)

    if let pending = pendingCall, (pending["callId"] as? String) == callId {
      clearPendingCall()
    }
  }

  public func setMuted(callId: String, muted: Bool) {
    guard let uuid = callIdToUUID[callId] else { return }
    let muteAction = CXSetMutedCallAction(call: uuid, muted: muted)
    let transaction = CXTransaction(action: muteAction)
    callController.request(transaction) { error in
      if let error = error {
        NSLog("[YAMBI_CALL] Error setting muted state: %@", error.localizedDescription)
      }
    }
  }

  public func getPendingCall() -> [String: Any]? {
    if let memoryPending = pendingCall {
      return memoryPending
    }
    if let savedData = UserDefaults.standard.dictionary(forKey: userDefaultsPendingKey) {
      pendingCall = savedData
      return savedData
    }
    return nil
  }

  public func clearPendingCall() {
    pendingCall = nil
    UserDefaults.standard.removeObject(forKey: userDefaultsPendingKey)
    NSLog("[YAMBI_CALL] Pending call cleared")
  }

  private func savePendingCall(_ data: [String: Any]) {
    pendingCall = data
    UserDefaults.standard.set(data, forKey: userDefaultsPendingKey)
    NSLog("[YAMBI_CALL] Pending call saved for cold start: %@", data)
  }

  // MARK: - CXProviderDelegate

  public func providerDidReset(_ provider: CXProvider) {
    NSLog("[YAMBI_CALL] CallKit provider reset")
    activeCalls.removeAll()
    callIdToUUID.removeAll()
    uuidToCallId.removeAll()
    clearPendingCall()
  }

  public func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    NSLog("[YAMBI_CALL] CXAnswerCallAction performed for UUID: %@", action.callUUID.uuidString)
    
    // Configure audio session for VoIP call
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .defaultToSpeaker])
      try audioSession.setActive(true)
    } catch {
      NSLog("[YAMBI_CALL] Error activating AVAudioSession on answer: %@", error.localizedDescription)
    }

    let callId = getCallId(for: action.callUUID) ?? action.callUUID.uuidString
    markCallAnswered(callId: callId)
    let callData = activeCalls[callId] ?? [
      "callId": callId,
      "callerId": "",
      "callerName": "",
      "callType": "audio"
    ]

    savePendingCall(callData)
    presentActiveCallViewController(callId: callId, callData: callData, isCaller: false)
    onCallAnswered?(callData)
    action.fulfill()
  }

  public func presentActiveCallViewController(callId: String, callData: [String: Any], isCaller: Bool) {
    DispatchQueue.main.async {
      let vc = ActiveCallViewController()
      vc.callId = callId
      vc.callerId = callData["callerId"] as? String ?? ""
      vc.calleeId = callData["calleeId"] as? String ?? ""
      vc.callerName = callData["callerName"] as? String ?? ""
      vc.callerAvatar = callData["callerAvatar"] as? String ?? ""
      vc.calleeName = callData["calleeName"] as? String ?? ""
      vc.calleeAvatar = callData["calleeAvatar"] as? String ?? ""
      vc.callType = callData["callType"] as? String ?? "audio"
      vc.isCaller = isCaller
      vc.userPhone = callData["userPhone"] as? String ?? ""
      vc.modalPresentationStyle = .fullScreen

      if let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first,
         var topVC = window.rootViewController {
        while let presented = topVC.presentedViewController {
          topVC = presented
        }
        topVC.present(vc, animated: false)
      }
    }
  }

  public func startOutgoingCallNatively(
    callId: String,
    calleeId: String,
    calleeName: String,
    callType: String,
    calleeAvatar: String,
    callerId: String,
    callerName: String,
    callerAvatar: String
  ) {
    reportOutgoingCall(callId: callId, calleeName: calleeName, hasVideo: callType == "video")
    let callData: [String: Any] = [
      "callId": callId,
      "callerId": callerId,
      "calleeId": calleeId,
      "callerName": callerName,
      "callerAvatar": callerAvatar,
      "calleeName": calleeName,
      "calleeAvatar": calleeAvatar,
      "callType": callType,
      "isCaller": true,
      "userPhone": callerId
    ]
    presentActiveCallViewController(callId: callId, callData: callData, isCaller: true)
  }

  public func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    NSLog("[YAMBI_CALL] CXEndCallAction performed for UUID: %@", action.callUUID.uuidString)

    let callId = getCallId(for: action.callUUID) ?? action.callUUID.uuidString
    let callData = activeCalls[callId] ?? [
      "callId": callId,
      "callerId": "",
      "callerName": "",
      "callType": "audio"
    ]

    // If call was ringing and never connected, it was rejected
    if let existing = activeCalls[callId], (existing["isConnected"] as? Bool) != true {
      onCallRejected?(callData)
    } else {
      onCallEnded?(["callId": callId, "reason": "USER_ENDED"])
    }

    activeCalls.removeValue(forKey: callId)
    callIdToUUID.removeValue(forKey: callId)
    uuidToCallId.removeValue(forKey: action.callUUID)
    clearPendingCall()

    action.fulfill()
  }

  public func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
    NSLog("[YAMBI_CALL] CXSetMutedCallAction: isMuted=%d", action.isMuted)
    onCallMuted?(action.isMuted)
    action.fulfill()
  }

  public func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    NSLog("[YAMBI_CALL] CallKit didActivate audioSession")
  }

  public func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    NSLog("[YAMBI_CALL] CallKit didDeactivate audioSession")
  }

  // MARK: - PKPushRegistryDelegate

  public func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    guard type == .voIP else { return }
    let tokenParts = credentials.token.map { String(format: "%02.2hhx", $0) }
    let token = tokenParts.joined()
    self.cachedVoIPToken = token
    NSLog("[YAMBI_CALL] VoIP token received: %@", token)
    self.onVoIPTokenReceived?(token)
  }

  public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    guard type == .voIP else {
      completion()
      return
    }

    let dict = payload.dictionaryPayload
    NSLog("[YAMBI_CALL] Incoming VoIP push received with payload: %@", dict)

    // Extract call parameters
    let data = (dict["data"] as? [String: Any]) ?? dict
    let callId = (data["callId"] as? String) ?? (dict["callId"] as? String) ?? UUID().uuidString
    let callerId = (data["callerId"] as? String) ?? (data["callerPhone"] as? String) ?? (dict["callerId"] as? String) ?? ""
    let callerName = (data["callerName"] as? String) ?? (dict["callerName"] as? String) ?? callerId
    let callerAvatar = (data["callerAvatar"] as? String) ?? (dict["callerAvatar"] as? String)
    let callType = (data["callType"] as? String) ?? (data["type"] as? String) ?? (dict["callType"] as? String) ?? "audio"
    let hasVideo = (callType == "video")

    // Apple requirement: MUST report to CallKit before calling completion!
    reportIncomingCall(
      callId: callId,
      callerId: callerId,
      callerName: callerName,
      callerAvatar: callerAvatar,
      callType: callType,
      hasVideo: hasVideo
    ) { _ in
      completion()
    }
  }
}

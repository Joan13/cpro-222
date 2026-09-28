import Foundation
import SocketIO

public class NativeSignalingManager {
    public static let shared = NativeSignalingManager()

    private let tag = "[YAMBI_SIGNALING]"
    private let serverURL = URL(string: "https://server.yambi.net")!
    private let serverPath = "/ws"

    private var manager: SocketManager?
    private var socket: SocketIOClient?
    private var userPhone: String = ""
    private var isConnected: Bool = false

    // Callbacks
    public var onCallAccepted: ((String) -> Void)?
    public var onCallRinging: ((String) -> Void)?
    public var onCallRejected: ((String) -> Void)?
    public var onCallCancelled: ((String) -> Void)?
    public var onCallBusy: ((String) -> Void)?
    public var onOffer: ((String, String, String) -> Void)?
    public var onAnswer: ((String, String, String) -> Void)?
    public var onIceCandidate: ((String, String, String?, Int) -> Void)?
    public var onCallEnd: ((String) -> Void)?

    private init() {}

    public func connect(userPhone: String) {
        if self.userPhone == userPhone && socket?.status == .connected {
            NSLog("%@ Already connected for %@ — reassembling", tag, userPhone)
            socket?.emit("assemble", userPhone)
            return
        }
        self.userPhone = userPhone
        disconnectInternal()

        manager = SocketManager(
            socketURL: serverURL,
            config: [
                .path(serverPath),
                .transport([.webSocket]),
                .reconnects(true),
                .reconnectAttempts(15),
                .reconnectWait(1),
                .forceWebsockets(true),
                .log(false)
            ]
        )
        socket = manager?.defaultSocket

        setupSystemListeners()
        setupCallEventListeners()

        socket?.connect()
        NSLog("%@ Connecting to server for user %@", tag, userPhone)
    }

    private func setupSystemListeners() {
        guard let socket = socket else { return }

        socket.on(clientEvent: .connect) { [weak self] _, _ in
            guard let self = self else { return }
            self.isConnected = true
            NSLog("%@ Socket connected — assembling as %@", self.tag, self.userPhone)
            self.socket?.emit("assemble", self.userPhone)
        }

        socket.on(clientEvent: .disconnect) { [weak self] data, _ in
            guard let self = self else { return }
            self.isConnected = false
            NSLog("%@ Socket disconnected: %@", self.tag, String(describing: data))
        }

        socket.on(clientEvent: .error) { [weak self] data, _ in
            guard let self = self else { return }
            NSLog("%@ Socket error: %@", self.tag, String(describing: data))
        }
    }

    private func setupCallEventListeners() {
        guard let socket = socket else { return }

        socket.on("call:ringing") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone,
                  (dict["callerId"] as? String) == self.userPhone,
                  let callId = dict["callId"] as? String else { return }
            NSLog("%@ <- call:ringing callId=%@", self.tag, callId)
            self.onCallRinging?(callId)
        }

        socket.on("call:accept") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone,
                  (dict["callerId"] as? String) == self.userPhone,
                  let callId = dict["callId"] as? String else { return }
            NSLog("%@ <- call:accept callId=%@", self.tag, callId)
            self.onCallAccepted?(callId)
        }

        socket.on("call:reject") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone,
                  (dict["callerId"] as? String) == self.userPhone,
                  let callId = dict["callId"] as? String else { return }
            NSLog("%@ <- call:reject callId=%@", self.tag, callId)
            self.onCallRejected?(callId)
        }

        socket.on("call:cancel") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone,
                  (dict["calleeId"] as? String) == self.userPhone,
                  let callId = dict["callId"] as? String else { return }
            NSLog("%@ <- call:cancel callId=%@", self.tag, callId)
            self.onCallCancelled?(callId)
        }

        socket.on("call:busy") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone,
                  (dict["callerId"] as? String) == self.userPhone,
                  let callId = dict["callId"] as? String else { return }
            NSLog("%@ <- call:busy callId=%@", self.tag, callId)
            self.onCallBusy?(callId)
        }

        socket.on("call:offer") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone,
                  (dict["calleeId"] as? String) == self.userPhone,
                  let callId = dict["callId"] as? String,
                  let offer = dict["offer"] as? [String: Any],
                  let sdp = offer["sdp"] as? String else { return }
            let type = (offer["type"] as? String) ?? "offer"
            NSLog("%@ <- call:offer callId=%@", self.tag, callId)
            self.onOffer?(callId, sdp, type)
        }

        socket.on("call:answer") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone,
                  (dict["callerId"] as? String) == self.userPhone,
                  let callId = dict["callId"] as? String,
                  let answer = dict["answer"] as? [String: Any],
                  let sdp = answer["sdp"] as? String else { return }
            let type = (answer["type"] as? String) ?? "answer"
            NSLog("%@ <- call:answer callId=%@", self.tag, callId)
            self.onAnswer?(callId, sdp, type)
        }

        socket.on("call:ice-candidate") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone else { return }
            let callerId = (dict["callerId"] as? String) ?? ""
            let calleeId = (dict["calleeId"] as? String) ?? ""
            if callerId != self.userPhone && calleeId != self.userPhone { return }

            guard let callId = dict["callId"] as? String,
                  let c = dict["candidate"] as? [String: Any],
                  let candidate = c["candidate"] as? String else { return }
            let sdpMid = c["sdpMid"] as? String
            let sdpMLineIndex = (c["sdpMLineIndex"] as? Int) ?? 0

            self.onIceCandidate?(callId, candidate, sdpMid, sdpMLineIndex)
        }

        socket.on("call:end") { [weak self] data, _ in
            guard let self = self,
                  let dict = data.first as? [String: Any],
                  (dict["senderId"] as? String) != self.userPhone else { return }
            let callerId = (dict["callerId"] as? String) ?? ""
            let calleeId = (dict["calleeId"] as? String) ?? ""
            if callerId != self.userPhone && calleeId != self.userPhone { return }

            guard let callId = dict["callId"] as? String else { return }
            NSLog("%@ <- call:end callId=%@", self.tag, callId)
            self.onCallEnd?(callId)
        }
    }

    // MARK: - Emission Methods

    public func sendInvite(callId: String, callerId: String, calleeId: String, callerName: String, callerAvatar: String, callType: String) {
        emitSafely(event: "call:invite", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "callerName": callerName,
            "callerAvatar": callerAvatar,
            "type": callType,
            "timestamp": Int64(Date().timeIntervalSince1970 * 1000),
            "senderId": userPhone
        ])
    }

    public func sendRinging(callId: String, callerId: String, calleeId: String) {
        emitSafely(event: "call:ringing", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "senderId": userPhone
        ])
    }

    public func sendAccept(callId: String, callerId: String, calleeId: String) {
        emitSafely(event: "call:accept", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "senderId": userPhone
        ])
    }

    public func sendReject(callId: String, callerId: String, calleeId: String) {
        emitSafely(event: "call:reject", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "senderId": userPhone
        ])
    }

    public func sendCancel(callId: String, callerId: String, calleeId: String) {
        emitSafely(event: "call:cancel", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "senderId": userPhone
        ])
    }

    public func sendBusy(callId: String, callerId: String, calleeId: String) {
        emitSafely(event: "call:busy", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "senderId": userPhone
        ])
    }

    public func sendOffer(callId: String, callerId: String, calleeId: String, sdp: String, sdpType: String = "offer") {
        emitSafely(event: "call:offer", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "offer": [
                "type": sdpType,
                "sdp": sdp
            ],
            "senderId": userPhone
        ])
    }

    public func sendAnswer(callId: String, callerId: String, calleeId: String, sdp: String, sdpType: String = "answer") {
        emitSafely(event: "call:answer", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "answer": [
                "type": sdpType,
                "sdp": sdp
            ],
            "senderId": userPhone
        ])
    }

    public func sendIceCandidate(callId: String, callerId: String, calleeId: String, candidate: String, sdpMid: String?, sdpMLineIndex: Int) {
        emitSafely(event: "call:ice-candidate", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "candidate": [
                "candidate": candidate,
                "sdpMid": sdpMid ?? "",
                "sdpMLineIndex": sdpMLineIndex
            ],
            "senderId": userPhone
        ])
    }

    public func sendEnd(callId: String, callerId: String, calleeId: String, duration: Int) {
        emitSafely(event: "call:end", payload: [
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "duration": duration,
            "senderId": userPhone
        ])
    }

    private func emitSafely(event: String, payload: [String: Any]) {
        guard let socket = socket, socket.status == .connected else {
            NSLog("%@ Cannot emit %@ — socket not connected, attempting reconnect", tag, event)
            socket?.connect()
            return
        }
        socket.emit(event, payload)
        NSLog("%@ -> %@", tag, event)
    }

    public func clearCallbacks() {
        onCallAccepted = nil
        onCallRinging = nil
        onCallRejected = nil
        onCallCancelled = nil
        onCallBusy = nil
        onOffer = nil
        onAnswer = nil
        onIceCandidate = nil
        onCallEnd = nil
    }

    public func getUserPhone() -> String {
        return userPhone
    }

    private func disconnectInternal() {
        socket?.removeAllHandlers()
        socket?.disconnect()
        socket = nil
        manager = nil
        isConnected = false
    }

    public func disconnect() {
        disconnectInternal()
        clearCallbacks()
        NSLog("%@ Disconnected and callbacks cleared", tag)
    }
}

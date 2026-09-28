import Foundation
import WebRTC

public class NativeWebRTCManager: NSObject {
    public static let shared = NativeWebRTCManager()

    private let tag = "[YAMBI_WEBRTC]"

    private var factory: RTCPeerConnectionFactory?
    private var peerConnection: RTCPeerConnection?
    private var localStream: RTCMediaStream?
    private var localVideoTrack: RTCVideoTrack?
    private var localAudioTrack: RTCAudioTrack?
    private var videoCapturer: RTCCameraVideoCapturer?

    private var iceCandidateQueue: [RTCIceCandidate] = []
    private var remoteDescriptionSet: Bool = false

    // Callbacks
    public var onLocalVideoTrack: ((RTCVideoTrack?) -> Void)?
    public var onRemoteVideoTrack: ((RTCVideoTrack?) -> Void)?
    public var onIceCandidate: ((RTCIceCandidate) -> Void)?
    public var onConnectionStateChange: ((RTCPeerConnectionState) -> Void)?
    public var onIceConnectionStateChange: ((RTCIceConnectionState) -> Void)?

    private override init() {
        super.init()
    }

    public func initialize() {
        guard factory == nil else {
            NSLog("%@ Already initialized", tag)
            return
        }

        RTCInitializeSSL()
        let videoEncoderFactory = RTCDefaultVideoEncoderFactory()
        let videoDecoderFactory = RTCDefaultVideoDecoderFactory()

        factory = RTCPeerConnectionFactory(
            encoderFactory: videoEncoderFactory,
            decoderFactory: videoDecoderFactory
        )
        NSLog("%@ NativeWebRTCManager initialized", tag)
    }

    private func getIceServers() -> [RTCIceServer] {
        return [
            RTCIceServer(urlStrings: ["stun:stun.l.google.com:19302"]),
            RTCIceServer(urlStrings: ["stun:stun1.l.google.com:19302"]),
            RTCIceServer(
                urlStrings: ["turn:server.yambi.net:3478"],
                username: "yambi",
                credential: "yambipassword"
            ),
            RTCIceServer(
                urlStrings: ["turn:server.yambi.net:3478?transport=udp"],
                username: "yambi",
                credential: "yambipassword"
            ),
            RTCIceServer(
                urlStrings: ["turn:server.yambi.net:3478?transport=tcp"],
                username: "yambi",
                credential: "yambipassword"
            )
        ]
    }

    public func getLocalStream(isVideo: Bool) -> RTCMediaStream? {
        guard let factory = factory else {
            initialize()
            return getLocalStream(isVideo: isVideo)
        }

        let audioConstraints = RTCMediaConstraints(
            mandatoryConstraints: [
                "googEchoCancellation": "true",
                "googAutoGainControl": "true",
                "googNoiseSuppression": "true",
                "googHighpassFilter": "true"
            ],
            optionalConstraints: nil
        )

        let audioSource = factory.audioSource(with: audioConstraints)
        let audioTrack = factory.audioTrack(with: audioSource, trackId: "ARDAMSa0")
        self.localAudioTrack = audioTrack

        let stream = factory.mediaStream(withStreamId: "ARDAMS")
        stream.addAudioTrack(audioTrack)

        if isVideo {
            let videoSource = factory.videoSource()
            let capturer = RTCCameraVideoCapturer(delegate: videoSource)
            self.videoCapturer = capturer

            if let device = RTCCameraVideoCapturer.captureDevices().first(where: { $0.position == .front }) ?? RTCCameraVideoCapturer.captureDevices().first,
               let format = RTCCameraVideoCapturer.supportedFormats(for: device).last,
               let fps = format.videoSupportedFrameRateRanges.first?.maxFrameRate {
                capturer.startCapture(with: device, format: format, fps: Int(fps))
            }

            let videoTrack = factory.videoTrack(with: videoSource, trackId: "ARDAMSv0")
            self.localVideoTrack = videoTrack
            stream.addVideoTrack(videoTrack)
            self.onLocalVideoTrack?(videoTrack)
        }

        self.localStream = stream
        return stream
    }

    public func createPeerConnection() -> RTCPeerConnection? {
        guard let factory = factory else {
            initialize()
            return createPeerConnection()
        }

        cleanupPeerConnection()

        let config = RTCConfiguration()
        config.iceServers = getIceServers()
        config.sdpSemantics = .unifiedPlan
        config.continualGatheringPolicy = .gatherContinually

        let constraints = RTCMediaConstraints(
            mandatoryConstraints: [
                "OfferToReceiveAudio": "true",
                "OfferToReceiveVideo": "true"
            ],
            optionalConstraints: nil
        )

        guard let pc = factory.peerConnection(with: config, constraints: constraints, delegate: self) else {
            NSLog("%@ Failed to create PeerConnection", tag)
            return nil
        }

        if let stream = localStream {
            for audioTrack in stream.audioTracks {
                pc.add(audioTrack, streamIds: ["ARDAMS"])
            }
            for videoTrack in stream.videoTracks {
                pc.add(videoTrack, streamIds: ["ARDAMS"])
            }
        }

        self.peerConnection = pc
        self.remoteDescriptionSet = false
        self.iceCandidateQueue.removeAll()

        NSLog("%@ PeerConnection created with local tracks", tag)
        return pc
    }

    public func createOffer(completion: @escaping (Result<RTCSessionDescription, Error>) -> Void) {
        guard let pc = peerConnection else {
            completion(.failure(NSError(domain: "WebRTC", code: -1, userInfo: [NSLocalizedDescriptionKey: "No PeerConnection"])))
            return
        }

        let constraints = RTCMediaConstraints(
            mandatoryConstraints: [
                "OfferToReceiveAudio": "true",
                "OfferToReceiveVideo": "true"
            ],
            optionalConstraints: nil
        )

        pc.offer(for: constraints) { [weak self] sdp, error in
            guard let self = self else { return }
            if let error = error {
                NSLog("%@ createOffer error: %@", self.tag, error.localizedDescription)
                completion(.failure(error))
                return
            }
            guard let sdp = sdp else {
                completion(.failure(NSError(domain: "WebRTC", code: -2, userInfo: [NSLocalizedDescriptionKey: "No SDP generated"])))
                return
            }

            pc.setLocalDescription(sdp) { error in
                if let error = error {
                    NSLog("%@ setLocalDescription error: %@", self.tag, error.localizedDescription)
                    completion(.failure(error))
                } else {
                    NSLog("%@ Local offer set successfully", self.tag)
                    completion(.success(sdp))
                }
            }
        }
    }

    public func handleOfferAndCreateAnswer(
        offerSdp: String,
        completion: @escaping (Result<RTCSessionDescription, Error>) -> Void
    ) {
        guard let pc = peerConnection else {
            completion(.failure(NSError(domain: "WebRTC", code: -1, userInfo: [NSLocalizedDescriptionKey: "No PeerConnection"])))
            return
        }

        let remoteOffer = RTCSessionDescription(type: .offer, sdp: offerSdp)
        pc.setRemoteDescription(remoteOffer) { [weak self] error in
            guard let self = self else { return }
            if let error = error {
                NSLog("%@ setRemoteDescription (offer) error: %@", self.tag, error.localizedDescription)
                completion(.failure(error))
                return
            }

            self.remoteDescriptionSet = true
            self.flushIceCandidates()

            let constraints = RTCMediaConstraints(
                mandatoryConstraints: [
                    "OfferToReceiveAudio": "true",
                    "OfferToReceiveVideo": "true"
                ],
                optionalConstraints: nil
            )

            pc.answer(for: constraints) { answerSdp, error in
                if let error = error {
                    NSLog("%@ createAnswer error: %@", self.tag, error.localizedDescription)
                    completion(.failure(error))
                    return
                }
                guard let answerSdp = answerSdp else {
                    completion(.failure(NSError(domain: "WebRTC", code: -3, userInfo: [NSLocalizedDescriptionKey: "No answer SDP"])))
                    return
                }

                pc.setLocalDescription(answerSdp) { error in
                    if let error = error {
                        NSLog("%@ setLocalDescription (answer) error: %@", self.tag, error.localizedDescription)
                        completion(.failure(error))
                    } else {
                        NSLog("%@ Local answer set successfully", self.tag)
                        completion(.success(answerSdp))
                    }
                }
            }
        }
    }

    public func handleAnswer(answerSdp: String, completion: @escaping (Error?) -> Void) {
        guard let pc = peerConnection else {
            completion(NSError(domain: "WebRTC", code: -1, userInfo: [NSLocalizedDescriptionKey: "No PeerConnection"]))
            return
        }

        let remoteAnswer = RTCSessionDescription(type: .answer, sdp: answerSdp)
        pc.setRemoteDescription(remoteAnswer) { [weak self] error in
            guard let self = self else { return }
            if let error = error {
                NSLog("%@ setRemoteDescription (answer) error: %@", self.tag, error.localizedDescription)
                completion(error)
                return
            }

            self.remoteDescriptionSet = true
            self.flushIceCandidates()
            NSLog("%@ Remote answer set successfully", self.tag)
            completion(nil)
        }
    }

    public func addIceCandidate(candidate: String, sdpMid: String?, sdpMLineIndex: Int) {
        let rtcCandidate = RTCIceCandidate(
            sdp: candidate,
            sdpMLineIndex: Int32(sdpMLineIndex),
            sdpMid: sdpMid
        )

        if remoteDescriptionSet, let pc = peerConnection {
            pc.add(rtcCandidate)
            NSLog("%@ Added ICE candidate immediately", tag)
        } else {
            iceCandidateQueue.append(rtcCandidate)
            NSLog("%@ Queued ICE candidate (waiting for remote description)", tag)
        }
    }

    private func flushIceCandidates() {
        guard let pc = peerConnection else { return }
        for candidate in iceCandidateQueue {
            pc.add(candidate)
        }
        NSLog("%@ Flushed %d queued ICE candidates", tag, iceCandidateQueue.count)
        iceCandidateQueue.removeAll()
    }

    public func toggleMute(_ muted: Bool) {
        localAudioTrack?.isEnabled = !muted
        NSLog("%@ Mute toggled: %d", tag, muted ? 1 : 0)
    }

    public func toggleCamera(_ disabled: Bool) {
        localVideoTrack?.isEnabled = !disabled
        NSLog("%@ Camera enabled toggled: %d", tag, !disabled ? 1 : 0)
    }

    public func switchCamera() {
        guard let capturer = videoCapturer else { return }
        let currentPosition = (capturer.captureSession.inputs.first as? AVCaptureDeviceInput)?.device.position
        let newPosition: AVCaptureDevice.Position = (currentPosition == .front) ? .back : .front

        if let device = RTCCameraVideoCapturer.captureDevices().first(where: { $0.position == newPosition }),
           let format = RTCCameraVideoCapturer.supportedFormats(for: device).last,
           let fps = format.videoSupportedFrameRateRanges.first?.maxFrameRate {
            capturer.stopCapture {
                capturer.startCapture(with: device, format: format, fps: Int(fps))
            }
            NSLog("%@ Camera switched to %@", tag, newPosition == .front ? "front" : "back")
        }
    }

    private func cleanupPeerConnection() {
        peerConnection?.close()
        peerConnection = nil
        remoteDescriptionSet = false
        iceCandidateQueue.removeAll()
    }

    public func cleanup() {
        cleanupPeerConnection()

        videoCapturer?.stopCapture()
        videoCapturer = nil

        localStream = nil
        localVideoTrack = nil
        localAudioTrack = nil

        onLocalVideoTrack = nil
        onRemoteVideoTrack = nil
        onIceCandidate = nil
        onConnectionStateChange = nil
        onIceConnectionStateChange = nil

        NSLog("%@ WebRTC cleanup complete", tag)
    }
}

// MARK: - RTCPeerConnectionDelegate

extension NativeWebRTCManager: RTCPeerConnectionDelegate {
    public func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {}

    public func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {
        NSLog("%@ Stream added from remote peer", tag)
        if let videoTrack = stream.videoTracks.first {
            DispatchQueue.main.async {
                self.onRemoteVideoTrack?(videoTrack)
            }
        }
    }

    public func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {}

    public func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {}

    public func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {
        NSLog("%@ ICE connection state changed: %d", tag, newState.rawValue)
        DispatchQueue.main.async {
            self.onIceConnectionStateChange?(newState)
        }
    }

    public func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCPeerConnectionState) {
        NSLog("%@ Peer connection state changed: %d", tag, newState.rawValue)
        DispatchQueue.main.async {
            self.onConnectionStateChange?(newState)
        }
    }

    public func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {}

    public func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
        NSLog("%@ Generated local ICE candidate", tag)
        DispatchQueue.main.async {
            self.onIceCandidate?(candidate)
        }
    }

    public func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {}

    public func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {}
}

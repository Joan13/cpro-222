import UIKit
import AVFoundation
import WebRTC

public class ActiveCallViewController: UIViewController {
    public var callId: String = ""
    public var callerId: String = ""
    public var calleeId: String = ""
    public var callerName: String = ""
    public var callerAvatar: String = ""
    public var calleeName: String = ""
    public var calleeAvatar: String = ""
    public var callType: String = "audio"
    public var isCaller: Bool = false
    public var userPhone: String = ""

    private let signaling = NativeSignalingManager.shared
    private let webRTC = NativeWebRTCManager.shared
    private let db = CallHistoryDatabase.shared

    private var durationSeconds: Int = 0
    private var durationTimer: Timer?
    private var isMuted: Bool = false
    private var isSpeaker: Bool = false
    private var isCameraOff: Bool = false

    // UI Elements
    private let backgroundView = UIView()
    private let callerNameLabel = UILabel()
    private let statusLabel = UILabel()
    private let avatarImageView = UIImageView()
    private let durationLabel = UILabel()

    // Controls
    private let controlsStack = UIStackView()
    private let muteButton = UIButton(type: .system)
    private let speakerButton = UIButton(type: .system)
    private let endCallButton = UIButton(type: .system)
    private let cameraSwitchButton = UIButton(type: .system)
    private let cameraToggleButton = UIButton(type: .system)
    private let minimizeButton = UIButton(type: .system)

    // Video Views
    private var remoteVideoView: RTCMTLVideoView?
    private var localVideoView: RTCCameraPreviewView?

    public override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupSignalingListeners()
        setupWebRTCListeners()
        startCallFlow()
    }

    public override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    // MARK: - UI Setup

    private func setupUI() {
        view.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)

        // Minimize / Open App button
        minimizeButton.translatesAutoresizingMaskIntoConstraints = false
        minimizeButton.setTitle("▼ Réduire", for: .normal)
        minimizeButton.setTitleColor(.white, for: .normal)
        minimizeButton.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .semibold)
        minimizeButton.backgroundColor = UIColor.white.withAlphaComponent(0.15)
        minimizeButton.layer.cornerRadius = 16
        minimizeButton.addTarget(self, action: #selector(handleMinimize), for: .touchUpInside)
        view.addSubview(minimizeButton)

        if callType == "video" {
            setupVideoUI()
        } else {
            setupAudioUI()
        }

        setupControls()

        NSLayoutConstraint.activate([
            minimizeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            minimizeButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            minimizeButton.widthAnchor.constraint(equalToConstant: 100),
            minimizeButton.heightAnchor.constraint(equalToConstant: 34),
        ])
    }

    private func setupAudioUI() {
        avatarImageView.translatesAutoresizingMaskIntoConstraints = false
        avatarImageView.contentMode = .scaleAspectFill
        avatarImageView.layer.cornerRadius = 65
        avatarImageView.clipsToBounds = true
        avatarImageView.backgroundColor = UIColor.white.withAlphaComponent(0.1)
        view.addSubview(avatarImageView)

        loadAvatarImage()

        callerNameLabel.translatesAutoresizingMaskIntoConstraints = false
        callerNameLabel.text = callerName.isEmpty ? callerId : callerName
        callerNameLabel.textColor = .white
        callerNameLabel.font = UIFont.systemFont(ofSize: 26, weight: .bold)
        callerNameLabel.textAlignment = .center
        view.addSubview(callerNameLabel)

        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.text = isCaller ? "Appel en cours..." : "Connexion..."
        statusLabel.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        statusLabel.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        statusLabel.textAlignment = .center
        view.addSubview(statusLabel)

        durationLabel.translatesAutoresizingMaskIntoConstraints = false
        durationLabel.text = "00:00"
        durationLabel.textColor = UIColor(red: 52/255, green: 211/255, blue: 153/255, alpha: 1.0)
        durationLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 18, weight: .semibold)
        durationLabel.textAlignment = .center
        durationLabel.isHidden = true
        view.addSubview(durationLabel)

        NSLayoutConstraint.activate([
            avatarImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            avatarImageView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -90),
            avatarImageView.widthAnchor.constraint(equalToConstant: 130),
            avatarImageView.heightAnchor.constraint(equalToConstant: 130),

            callerNameLabel.topAnchor.constraint(equalTo: avatarImageView.bottomAnchor, constant: 24),
            callerNameLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            callerNameLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),

            statusLabel.topAnchor.constraint(equalTo: callerNameLabel.bottomAnchor, constant: 8),
            statusLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),

            durationLabel.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 8),
            durationLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor)
        ])
    }

    private func setupVideoUI() {
        let remote = RTCMTLVideoView(frame: view.bounds)
        remote.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        remote.videoContentMode = .scaleAspectFill
        view.insertSubview(remote, at: 0)
        self.remoteVideoView = remote

        let local = RTCCameraPreviewView(frame: .zero)
        local.translatesAutoresizingMaskIntoConstraints = false
        local.layer.cornerRadius = 12
        local.clipsToBounds = true
        local.layer.borderColor = UIColor.white.withAlphaComponent(0.4).cgColor
        local.layer.borderWidth = 1.5
        view.addSubview(local)
        self.localVideoView = local

        callerNameLabel.translatesAutoresizingMaskIntoConstraints = false
        callerNameLabel.text = callerName.isEmpty ? callerId : callerName
        callerNameLabel.textColor = .white
        callerNameLabel.font = UIFont.systemFont(ofSize: 20, weight: .bold)
        callerNameLabel.layer.shadowColor = UIColor.black.cgColor
        callerNameLabel.layer.shadowRadius = 4
        callerNameLabel.layer.shadowOpacity = 0.8
        callerNameLabel.layer.shadowOffset = CGSize(width: 0, height: 1)
        view.addSubview(callerNameLabel)

        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.text = isCaller ? "Appel vidéo en cours..." : "Connexion vidéo..."
        statusLabel.textColor = .white
        statusLabel.font = UIFont.systemFont(ofSize: 14, weight: .medium)
        statusLabel.layer.shadowColor = UIColor.black.cgColor
        statusLabel.layer.shadowRadius = 4
        statusLabel.layer.shadowOpacity = 0.8
        statusLabel.layer.shadowOffset = CGSize(width: 0, height: 1)
        view.addSubview(statusLabel)

        durationLabel.translatesAutoresizingMaskIntoConstraints = false
        durationLabel.text = "00:00"
        durationLabel.textColor = UIColor(red: 52/255, green: 211/255, blue: 153/255, alpha: 1.0)
        durationLabel.font = UIFont.monospacedDigitSystemFont(ofSize: 16, weight: .bold)
        durationLabel.isHidden = true
        view.addSubview(durationLabel)

        NSLayoutConstraint.activate([
            callerNameLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            callerNameLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),

            statusLabel.topAnchor.constraint(equalTo: callerNameLabel.bottomAnchor, constant: 4),
            statusLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),

            durationLabel.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 4),
            durationLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),

            local.topAnchor.constraint(equalTo: durationLabel.bottomAnchor, constant: 16),
            local.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            local.widthAnchor.constraint(equalToConstant: 100),
            local.heightAnchor.constraint(equalToConstant: 140),
        ])
    }

    private func setupControls() {
        controlsStack.translatesAutoresizingMaskIntoConstraints = false
        controlsStack.axis = .horizontal
        controlsStack.alignment = .center
        controlsStack.distribution = .equalSpacing
        controlsStack.spacing = 16
        view.addSubview(controlsStack)

        styleRoundButton(muteButton, title: "Mute", bg: UIColor.white.withAlphaComponent(0.2))
        muteButton.addTarget(self, action: #selector(toggleMute), for: .touchUpInside)
        controlsStack.addArrangedSubview(muteButton)

        if callType == "video" {
            styleRoundButton(cameraToggleButton, title: "Cam", bg: UIColor.white.withAlphaComponent(0.2))
            cameraToggleButton.addTarget(self, action: #selector(toggleCamera), for: .touchUpInside)
            controlsStack.addArrangedSubview(cameraToggleButton)

            styleRoundButton(cameraSwitchButton, title: "Flip", bg: UIColor.white.withAlphaComponent(0.2))
            cameraSwitchButton.addTarget(self, action: #selector(switchCamera), for: .touchUpInside)
            controlsStack.addArrangedSubview(cameraSwitchButton)
        }

        styleRoundButton(speakerButton, title: "Speaker", bg: UIColor.white.withAlphaComponent(0.2))
        speakerButton.addTarget(self, action: #selector(toggleSpeaker), for: .touchUpInside)
        controlsStack.addArrangedSubview(speakerButton)

        styleRoundButton(endCallButton, title: "Fin", bg: UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0))
        endCallButton.addTarget(self, action: #selector(handleEndCall), for: .touchUpInside)
        controlsStack.addArrangedSubview(endCallButton)

        NSLayoutConstraint.activate([
            controlsStack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -36),
            controlsStack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            controlsStack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),
            controlsStack.heightAnchor.constraint(equalToConstant: 64)
        ])
    }

    private func styleRoundButton(_ button: UIButton, title: String, bg: UIColor) {
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setTitle(title, for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.titleLabel?.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        button.backgroundColor = bg
        button.layer.cornerRadius = 28
        NSLayoutConstraint.activate([
            button.widthAnchor.constraint(equalToConstant: 56),
            button.heightAnchor.constraint(equalToConstant: 56)
        ])
    }

    private func loadAvatarImage() {
        guard let url = URL(string: callerAvatar), !callerAvatar.isEmpty else { return }
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            guard let data = data, let img = UIImage(data: data) else { return }
            DispatchQueue.main.async {
                self?.avatarImageView.image = img
            }
        }.resume()
    }

    // MARK: - Call Flow

    private func startCallFlow() {
        signaling.connect(userPhone: userPhone.isEmpty ? (isCaller ? callerId : calleeId) : userPhone)

        _ = webRTC.getLocalStream(isVideo: callType == "video")
        _ = webRTC.createPeerConnection()

        if isCaller {
            statusLabel.text = "Appel en cours..."
            signaling.sendInvite(
                callId: callId,
                callerId: callerId,
                calleeId: calleeId,
                callerName: callerName,
                callerAvatar: callerAvatar,
                callType: callType
            )
        } else {
            statusLabel.text = "Connexion..."
            signaling.sendAccept(callId: callId, callerId: callerId, calleeId: calleeId)
        }
    }

    private func setupSignalingListeners() {
        signaling.onCallRinging = { [weak self] _ in
            DispatchQueue.main.async {
                self?.statusLabel.text = "Sonnerie..."
            }
        }

        signaling.onCallAccepted = { [weak self] _ in
            guard let self = self, self.isCaller else { return }
            self.webRTC.createOffer { result in
                switch result {
                case .success(let sdp):
                    self.signaling.sendOffer(
                        callId: self.callId,
                        callerId: self.callerId,
                        calleeId: self.calleeId,
                        sdp: sdp.sdp
                    )
                case .failure(let error):
                    NSLog("[YAMBI_ACTIVE_VC] createOffer failure: %@", error.localizedDescription)
                }
            }
        }

        signaling.onOffer = { [weak self] callId, sdp, type in
            guard let self = self, !self.isCaller else { return }
            self.webRTC.handleOfferAndCreateAnswer(offerSdp: sdp) { result in
                switch result {
                case .success(let answerSdp):
                    self.signaling.sendAnswer(
                        callId: self.callId,
                        callerId: self.callerId,
                        calleeId: self.calleeId,
                        sdp: answerSdp.sdp
                    )
                    self.handleCallConnected()
                case .failure(let error):
                    NSLog("[YAMBI_ACTIVE_VC] handleOffer failure: %@", error.localizedDescription)
                }
            }
        }

        signaling.onAnswer = { [weak self] callId, sdp, type in
            guard let self = self, self.isCaller else { return }
            self.webRTC.handleAnswer(answerSdp: sdp) { error in
                if error == nil {
                    self.handleCallConnected()
                }
            }
        }

        signaling.onIceCandidate = { [weak self] callId, candidate, sdpMid, sdpMLineIndex in
            self?.webRTC.addIceCandidate(candidate: candidate, sdpMid: sdpMid, sdpMLineIndex: sdpMLineIndex)
        }

        signaling.onCallEnd = { [weak self] _ in
            self?.finishCall(reason: "REMOTE_ENDED")
        }

        signaling.onCallCancelled = { [weak self] _ in
            self?.finishCall(reason: "CANCELLED")
        }

        signaling.onCallRejected = { [weak self] _ in
            self?.finishCall(reason: "REJECTED")
        }

        signaling.onCallBusy = { [weak self] _ in
            self?.finishCall(reason: "BUSY")
        }
    }

    private func setupWebRTCListeners() {
        webRTC.onIceCandidate = { [weak self] candidate in
            guard let self = self else { return }
            self.signaling.sendIceCandidate(
                callId: self.callId,
                callerId: self.callerId,
                calleeId: self.calleeId,
                candidate: candidate.sdp,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: Int(candidate.sdpMLineIndex)
            )
        }

        webRTC.onRemoteVideoTrack = { [weak self] track in
            guard let self = self, let track = track, let remoteView = self.remoteVideoView else { return }
            track.add(remoteView)
            NSLog("[YAMBI_ACTIVE_VC] Remote video track attached")
        }

        webRTC.onConnectionStateChange = { [weak self] state in
            if state == .connected {
                self?.handleCallConnected()
            } else if state == .failed || state == .disconnected {
                self?.finishCall(reason: "DISCONNECTED")
            }
        }
    }

    private func handleCallConnected() {
        DispatchQueue.main.async {
            guard self.durationTimer == nil else { return }
            self.statusLabel.text = "Connecté"
            self.durationLabel.isHidden = false
            self.durationTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
                guard let self = self else { return }
                self.durationSeconds += 1
                let m = self.durationSeconds / 60
                let s = self.durationSeconds % 60
                self.durationLabel.text = String(format: "%02d:%02d", m, s)
            }
        }
    }

    // MARK: - Actions

    @objc private func toggleMute() {
        isMuted.toggle()
        webRTC.toggleMute(isMuted)
        muteButton.backgroundColor = isMuted ? UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0) : UIColor.white.withAlphaComponent(0.2)
    }

    @objc private func toggleCamera() {
        isCameraOff.toggle()
        webRTC.toggleCamera(isCameraOff)
        cameraToggleButton.backgroundColor = isCameraOff ? UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0) : UIColor.white.withAlphaComponent(0.2)
    }

    @objc private func switchCamera() {
        webRTC.switchCamera()
    }

    @objc private func toggleSpeaker() {
        isSpeaker.toggle()
        do {
            let session = AVAudioSession.sharedInstance()
            try session.overrideOutputAudioPort(isSpeaker ? .speaker : .none)
            speakerButton.backgroundColor = isSpeaker ? UIColor(red: 59/255, green: 130/255, blue: 246/255, alpha: 1.0) : UIColor.white.withAlphaComponent(0.2)
        } catch {
            NSLog("[YAMBI_ACTIVE_VC] Failed to set speaker: %@", error.localizedDescription)
        }
    }

    @objc private func handleMinimize() {
        // Dismiss view controller visually — call continues in background
        dismiss(animated: true)
    }

    @objc private func handleEndCall() {
        signaling.sendEnd(callId: callId, callerId: callerId, calleeId: calleeId, duration: durationSeconds)
        finishCall(reason: "USER_ENDED")
    }

    private func finishCall(reason: String) {
        DispatchQueue.main.async {
            self.durationTimer?.invalidate()
            self.durationTimer = nil

            self.webRTC.cleanup()

            // Save history to SQLite
            let direction: String
            if self.isCaller {
                direction = "outgoing"
            } else if self.durationSeconds > 0 {
                direction = "incoming"
            } else if reason == "REJECTED" {
                direction = "rejected"
            } else {
                direction = "missed"
            }

            let formatter = ISO8601DateFormatter()
            let record = CallHistoryRecord(
                id: "hist_\(self.callId)",
                callId: self.callId,
                callerId: self.callerId,
                calleeId: self.calleeId,
                callerName: self.callerName.isEmpty ? self.callerId : self.callerName,
                callerAvatar: self.callerAvatar,
                calleeName: self.calleeName.isEmpty ? self.calleeId : self.calleeName,
                calleeAvatar: self.calleeAvatar,
                type: self.callType,
                direction: direction,
                status: self.durationSeconds > 0 ? "CONNECTED" : reason,
                durationSeconds: self.durationSeconds,
                createdAt: formatter.string(from: Date()),
                timestamp: Int64(Date().timeIntervalSince1970 * 1000),
                syncedToRealm: 0
            )
            self.db.save(record)

            YambiCallManager.shared.reportCallEnded(callId: self.callId, reason: reason)
            self.dismiss(animated: true)
        }
    }
}

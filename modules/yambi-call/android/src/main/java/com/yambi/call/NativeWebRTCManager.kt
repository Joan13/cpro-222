package com.yambi.call

import android.content.Context
import android.util.Log
import org.webrtc.*
import java.lang.ref.WeakReference
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

/**
 * NativeWebRTCManager — Port de WebRTCManager.ts en Kotlin natif.
 *
 * Utilise la librairie stream-webrtc-android (org.webrtc.*).
 * Singleton — une seule instance de PeerConnection à la fois.
 *
 * Configuration ICE identique à WebRTCManager.ts :
 *   STUN: stun.l.google.com, stun1.l.google.com
 *   TURN: server.yambi.net:3478 (udp + tcp)
 */
class NativeWebRTCManager private constructor() {

    companion object {
        private const val TAG = "[YAMBI_WEBRTC]"

        @Volatile private var INSTANCE: NativeWebRTCManager? = null
        fun getInstance(): NativeWebRTCManager =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: NativeWebRTCManager().also { INSTANCE = it }
            }

        private val ICE_SERVERS = listOf(
            PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer(),
            PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer(),
            PeerConnection.IceServer.builder("turn:server.yambi.net:3478")
                .setUsername("yambi").setPassword("yambipassword").createIceServer(),
            PeerConnection.IceServer.builder("turn:server.yambi.net:3478?transport=udp")
                .setUsername("yambi").setPassword("yambipassword").createIceServer(),
            PeerConnection.IceServer.builder("turn:server.yambi.net:3478?transport=tcp")
                .setUsername("yambi").setPassword("yambipassword").createIceServer()
        )
    }

    // Core WebRTC objects
    private var factory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var localStream: MediaStream? = null
    private var localVideoTrack: VideoTrack? = null
    private var localAudioTrack: AudioTrack? = null
    private var videoCapturer: VideoCapturer? = null
    private var surfaceTextureHelper: SurfaceTextureHelper? = null
    var eglBase: EglBase? = null
        private set

    // Référence vers le renderer local (PIP) pour garantir la liaison sans race condition
    private var localRendererRef: WeakReference<SurfaceViewRenderer>? = null

    // ICE candidate queue — même logique que WebRTCManager.ts
    private val iceCandidateQueue = mutableListOf<IceCandidate>()
    private var remoteDescriptionSet = false

    // Callbacks vers ActiveCallActivity
    var remoteVideoTrack:         VideoTrack?                                    = null
        private set
    var onLocalVideoTrack:        ((VideoTrack?) -> Unit)?                       = null
    var onRemoteVideoTrack:       ((VideoTrack?) -> Unit)?                       = null
    var onRemoteAudioReady:       (() -> Unit)?                                  = null
    var onIceCandidate:           ((IceCandidate) -> Unit)?                      = null
    var onConnectionStateChange:  ((PeerConnection.PeerConnectionState) -> Unit)? = null
    var onIceConnectionStateChange: ((PeerConnection.IceConnectionState) -> Unit)? = null

    // ─── Initialisation ──────────────────────────────────────────────────────

    fun initialize(context: Context) {
        if (factory != null) {
            Log.d(TAG, "Already initialized")
            return
        }

        eglBase = EglBase.create()

        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(context.applicationContext)
                .setEnableInternalTracer(false)
                .createInitializationOptions()
        )

        val encoderFactory = DefaultVideoEncoderFactory(eglBase!!.eglBaseContext, true, true)
        val decoderFactory = DefaultVideoDecoderFactory(eglBase!!.eglBaseContext)

        factory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(encoderFactory)
            .setVideoDecoderFactory(decoderFactory)
            .createPeerConnectionFactory()

        Log.d(TAG, "NativeWebRTCManager initialized")
    }

    // ─── Stream local ─────────────────────────────────────────────────────────

    fun getLocalStream(context: Context, isVideo: Boolean): MediaStream {
        val f = factory ?: throw IllegalStateException("WebRTC not initialized — call initialize() first")

        // Audio track avec echo cancellation
        val audioConstraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl",  "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("googHighpassFilter",   "true"))
        }
        val audioSource = f.createAudioSource(audioConstraints)
        val audioTrack  = f.createAudioTrack("audio_yambi_0", audioSource)
        audioTrack.setEnabled(true)
        localAudioTrack = audioTrack

        val stream = f.createLocalMediaStream("local_stream_yambi")
        stream.addTrack(audioTrack)

        if (isVideo) {
            val capturer = createCameraCapturer(context)
            if (capturer != null) {
                try {
                    val helper = SurfaceTextureHelper.create("CaptureThread", eglBase!!.eglBaseContext)
                    val videoSource = f.createVideoSource(capturer.isScreencast)
                    capturer.initialize(helper, context.applicationContext, videoSource.capturerObserver)

                    // Sur émulateur, 640x480 peut échouer selon la config de caméra virtuelle : fallback 320x240
                    try {
                        capturer.startCapture(640, 480, 30)
                        Log.d(TAG, "Camera capture started at 640x480@30fps")
                    } catch (e: Exception) {
                        Log.w(TAG, "startCapture 640x480 failed, retrying 320x240: ${e.message}")
                        try {
                            capturer.startCapture(320, 240, 15)
                            Log.d(TAG, "Camera capture started at 320x240@15fps")
                        } catch (e2: Exception) {
                            Log.e(TAG, "All startCapture attempts failed: ${e2.message}")
                        }
                    }

                    val videoTrack = f.createVideoTrack("video_yambi_0", videoSource)
                    videoTrack.setEnabled(true)
                    stream.addTrack(videoTrack)

                    localVideoTrack = videoTrack
                    videoCapturer = capturer
                    surfaceTextureHelper = helper

                    // Si le renderer local est déjà attaché, lier le track immédiatement !
                    localRendererRef?.get()?.let { r ->
                        try {
                            videoTrack.addSink(r)
                            Log.d(TAG, "Bound localVideoTrack to already attached localRenderer")
                        } catch (e: Exception) {
                            Log.w(TAG, "Error binding localVideoTrack to renderer: ${e.message}")
                        }
                    }

                    onLocalVideoTrack?.invoke(videoTrack)
                    Log.d(TAG, "Local video track acquired successfully")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to initialize video capturer: ${e.message}", e)
                }
            } else {
                Log.w(TAG, "No camera capturer found — continuing call without local camera")
            }
        }

        localStream = stream
        Log.d(TAG, "Local stream ready. Video: $isVideo")
        return stream
    }

    private fun createCameraCapturer(context: Context): VideoCapturer? {
        // 1. Essayer Camera2 si supporté par le matériel
        try {
            if (Camera2Enumerator.isSupported(context)) {
                val enumerator = Camera2Enumerator(context)
                val capturer = findCameraCapturer(enumerator)
                if (capturer != null) {
                    Log.d(TAG, "Using Camera2 capturer")
                    return capturer
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Camera2Enumerator failed: ${e.message}, falling back to Camera1")
        }

        // 2. Fallback robuste sur Camera1 (crucial pour les émulateurs Android)
        try {
            val enumerator = Camera1Enumerator(true) // captureToTexture = true
            val capturer = findCameraCapturer(enumerator)
            if (capturer != null) {
                Log.d(TAG, "Using Camera1 capturer (emulator/legacy fallback)")
                return capturer
            }
        } catch (e: Exception) {
            Log.w(TAG, "Camera1Enumerator failed: ${e.message}")
        }

        Log.w(TAG, "No camera capturer available on this device/emulator")
        return null
    }

    private fun findCameraCapturer(enumerator: CameraEnumerator): VideoCapturer? {
        val deviceNames = try { enumerator.deviceNames } catch (e: Exception) { return null }
        if (deviceNames.isNullOrEmpty()) return null

        // 1. Caméra frontale en priorité
        for (name in deviceNames) {
            try {
                if (enumerator.isFrontFacing(name)) {
                    val c = enumerator.createCapturer(name, object : CameraVideoCapturer.CameraEventsHandler {
                        override fun onCameraError(p0: String?) { Log.e(TAG, "Camera error: $p0") }
                        override fun onCameraDisconnected() { Log.w(TAG, "Camera disconnected") }
                        override fun onCameraFreezed(p0: String?) { Log.w(TAG, "Camera freezed: $p0") }
                        override fun onCameraOpening(p0: String?) { Log.d(TAG, "Camera opening: $p0") }
                        override fun onFirstFrameAvailable() { Log.d(TAG, "Camera first frame available!") }
                        override fun onCameraClosed() { Log.d(TAG, "Camera closed") }
                    })
                    if (c != null) return c
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to create front capturer for $name: ${e.message}")
            }
        }

        // 2. Caméra arrière ou virtuelle (émulateur virtual-scene, etc.)
        for (name in deviceNames) {
            try {
                val c = enumerator.createCapturer(name, object : CameraVideoCapturer.CameraEventsHandler {
                    override fun onCameraError(p0: String?) { Log.e(TAG, "Camera error: $p0") }
                    override fun onCameraDisconnected() { Log.w(TAG, "Camera disconnected") }
                    override fun onCameraFreezed(p0: String?) { Log.w(TAG, "Camera freezed: $p0") }
                    override fun onCameraOpening(p0: String?) { Log.d(TAG, "Camera opening: $p0") }
                    override fun onFirstFrameAvailable() { Log.d(TAG, "Camera first frame available!") }
                    override fun onCameraClosed() { Log.d(TAG, "Camera closed") }
                })
                if (c != null) return c
            } catch (e: Exception) {
                Log.w(TAG, "Failed to create fallback capturer for $name: ${e.message}")
            }
        }
        return null
    }

    // ─── PeerConnection ──────────────────────────────────────────────────────

    fun createPeerConnection(): PeerConnection {
        val f = factory ?: throw IllegalStateException("WebRTC not initialized")

        // Nettoyage de l'ancienne connexion
        peerConnection?.close()
        peerConnection = null
        iceCandidateQueue.clear()
        remoteDescriptionSet = false

        val rtcConfig = PeerConnection.RTCConfiguration(ICE_SERVERS).apply {
            sdpSemantics          = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
            iceTransportsType     = PeerConnection.IceTransportsType.ALL
        }

        val pc = f.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onIceCandidate(candidate: IceCandidate) {
                Log.d(TAG, "ICE candidate generated: ${candidate.sdp.take(50)}...")
                onIceCandidate?.invoke(candidate)
            }

            override fun onTrack(transceiver: RtpTransceiver) {
                val track = transceiver.receiver.track() ?: return
                Log.d(TAG, "Remote track received: ${track.kind()}")
                when (track) {
                    is VideoTrack -> {
                        remoteVideoTrack = track
                        onRemoteVideoTrack?.invoke(track)
                    }
                    is AudioTrack -> onRemoteAudioReady?.invoke()
                }
            }

            override fun onConnectionChange(newState: PeerConnection.PeerConnectionState) {
                Log.d(TAG, "PeerConnection state: $newState")
                onConnectionStateChange?.invoke(newState)
            }

            override fun onIceConnectionChange(newState: PeerConnection.IceConnectionState) {
                Log.d(TAG, "ICE connection state: $newState")
                onIceConnectionStateChange?.invoke(newState)
            }

            override fun onSignalingChange(p0: PeerConnection.SignalingState?)    {}
            override fun onIceGatheringChange(p0: PeerConnection.IceGatheringState?) {}
            override fun onIceCandidatesRemoved(p0: Array<out IceCandidate>?)     {}
            override fun onIceConnectionReceivingChange(p0: Boolean)               {}
            override fun onRemoveStream(p0: MediaStream?)                         {}
            override fun onAddStream(p0: MediaStream?) {
                Log.d(TAG, "onAddStream: audioTracks=${p0?.audioTracks?.size} videoTracks=${p0?.videoTracks?.size}")
                p0?.videoTracks?.firstOrNull()?.let {
                    remoteVideoTrack = it
                    onRemoteVideoTrack?.invoke(it)
                }
                if (!p0?.audioTracks.isNullOrEmpty()) {
                    onRemoteAudioReady?.invoke()
                }
            }
            override fun onDataChannel(p0: DataChannel?)                          {}
            override fun onRenegotiationNeeded()                                  {}
            override fun onAddTrack(p0: RtpReceiver?, p1: Array<out MediaStream>?) {}
        }) ?: throw RuntimeException("Failed to create PeerConnection")

        // Ajouter les tracks locaux avec le stream ID pour que l'offre/réponse SDP soit complète
        localStream?.audioTracks?.forEach { track ->
            pc.addTrack(track, listOf("local_stream_yambi"))
            Log.d(TAG, "Added track for audio: ${track.id()}")
        }
        localStream?.videoTracks?.forEach { track ->
            pc.addTrack(track, listOf("local_stream_yambi"))
            Log.d(TAG, "Added track for video: ${track.id()}")
        }

        peerConnection = pc
        Log.d(TAG, "PeerConnection created")
        return pc
    }

    // ─── Négociation SDP ─────────────────────────────────────────────────────

    suspend fun createOffer(): SessionDescription = suspendCoroutine { cont ->
        val pc = peerConnection ?: run {
            cont.resumeWithException(IllegalStateException("No active PeerConnection"))
            return@suspendCoroutine
        }
        val hasVideo = localVideoTrack != null
        val constraints = MediaConstraints().apply {
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
            mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", if (hasVideo) "true" else "false"))
        }
        pc.createOffer(sdpObserver(
            onSuccess = { sdp ->
                pc.setLocalDescription(sdpObserver(
                    onSetSuccess = { cont.resume(sdp) },
                    onSetFailure = { cont.resumeWithException(Exception("setLocalDescription failed: $it")) }
                ), sdp)
            },
            onCreateFailure = { cont.resumeWithException(Exception("createOffer failed: $it")) }
        ), constraints)
    }

    suspend fun handleOfferAndCreateAnswer(sdp: String, sdpType: String): SessionDescription = suspendCoroutine { cont ->
        val pc = peerConnection ?: run {
            cont.resumeWithException(IllegalStateException("No active PeerConnection"))
            return@suspendCoroutine
        }
        val offerSdp = SessionDescription(SessionDescription.Type.fromCanonicalForm(sdpType), sdp)
        pc.setRemoteDescription(sdpObserver(
            onSetSuccess = {
                remoteDescriptionSet = true
                processIceCandidateQueue(pc)
                val hasVideo = localVideoTrack != null || sdp.contains("m=video")
                val constraints = MediaConstraints().apply {
                    mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"))
                    mandatory.add(MediaConstraints.KeyValuePair("OfferToReceiveVideo", if (hasVideo) "true" else "false"))
                }
                pc.createAnswer(sdpObserver(
                    onSuccess = { answerSdp ->
                        pc.setLocalDescription(sdpObserver(
                            onSetSuccess = { cont.resume(answerSdp) },
                            onSetFailure = { cont.resumeWithException(Exception("setLocalDescription(answer) failed: $it")) }
                        ), answerSdp)
                    },
                    onCreateFailure = { cont.resumeWithException(Exception("createAnswer failed: $it")) }
                ), constraints)
            },
            onSetFailure = { cont.resumeWithException(Exception("setRemoteDescription(offer) failed: $it")) }
        ), offerSdp)
    }

    suspend fun handleAnswer(sdp: String, sdpType: String) = suspendCoroutine<Unit> { cont ->
        val pc = peerConnection ?: run {
            cont.resumeWithException(IllegalStateException("No active PeerConnection"))
            return@suspendCoroutine
        }
        val answerSdp = SessionDescription(SessionDescription.Type.fromCanonicalForm(sdpType), sdp)
        pc.setRemoteDescription(sdpObserver(
            onSetSuccess = {
                remoteDescriptionSet = true
                processIceCandidateQueue(pc)
                cont.resume(Unit)
            },
            onSetFailure = { cont.resumeWithException(Exception("setRemoteDescription(answer) failed: $it")) }
        ), answerSdp)
    }

    fun addIceCandidate(candidate: String, sdpMid: String?, sdpMLineIndex: Int) {
        val pc = peerConnection ?: return
        val iceCandidate = IceCandidate(sdpMid ?: "", sdpMLineIndex, candidate)
        if (!remoteDescriptionSet) {
            Log.d(TAG, "Queuing ICE candidate (remote description not set)")
            iceCandidateQueue.add(iceCandidate)
        } else {
            pc.addIceCandidate(iceCandidate)
        }
    }

    private fun processIceCandidateQueue(pc: PeerConnection) {
        if (iceCandidateQueue.isNotEmpty()) {
            Log.d(TAG, "Processing ${iceCandidateQueue.size} queued ICE candidates")
            iceCandidateQueue.forEach { pc.addIceCandidate(it) }
            iceCandidateQueue.clear()
        }
    }

    // ─── Contrôles média ──────────────────────────────────────────────────────

    fun toggleMute(muted: Boolean) {
        localAudioTrack?.setEnabled(!muted)
        Log.d(TAG, "Audio muted: $muted")
    }

    fun toggleCamera(disabled: Boolean) {
        localVideoTrack?.setEnabled(!disabled)
        Log.d(TAG, "Camera disabled: $disabled")
    }

    fun switchCamera() {
        (videoCapturer as? CameraVideoCapturer)?.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
            override fun onCameraSwitchDone(isFrontFacing: Boolean) {
                Log.d(TAG, "Camera switched. Front facing: $isFrontFacing")
                try {
                    localRendererRef?.get()?.setMirror(isFrontFacing)
                } catch (_: Exception) {}
            }
            override fun onCameraSwitchError(errorDescription: String?) {
                Log.e(TAG, "Camera switch error: $errorDescription")
            }
        })
    }

    // ─── Renderers vidéo ──────────────────────────────────────────────────────

    fun attachLocalRenderer(renderer: SurfaceViewRenderer) {
        try {
            renderer.init(eglBase?.eglBaseContext, null)
            renderer.setEnableHardwareScaler(true)
            renderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
            renderer.setMirror(true)
            renderer.setZOrderMediaOverlay(true)
        } catch (e: Exception) {
            Log.w(TAG, "Local renderer init ignored: ${e.message}")
        }
        localRendererRef = WeakReference(renderer)
        // Si le track local existe déjà, lui ajouter le sink immédiatement !
        localVideoTrack?.let { track ->
            try {
                track.addSink(renderer)
                Log.d(TAG, "Added sink to existing localVideoTrack")
            } catch (e: Exception) {
                Log.w(TAG, "Error adding sink: ${e.message}")
            }
        }
        Log.d(TAG, "Local renderer attached")
    }

    fun detachLocalRenderer(renderer: SurfaceViewRenderer) {
        try { localVideoTrack?.removeSink(renderer) } catch (_: Exception) {}
        try {
            renderer.clearImage()
            renderer.release()
        } catch (_: Exception) {}
        localRendererRef = null
    }

    fun attachRemoteRenderer(renderer: SurfaceViewRenderer) {
        try {
            renderer.init(eglBase?.eglBaseContext, null)
            renderer.setEnableHardwareScaler(true)
            renderer.setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
            renderer.setMirror(false)
            Log.d(TAG, "Remote renderer initialized, waiting for remote track")
        } catch (e: Exception) {
            Log.w(TAG, "Remote renderer init ignored: ${e.message}")
        }
    }

    fun addRemoteRendererSink(renderer: SurfaceViewRenderer, track: VideoTrack) {
        try {
            track.addSink(renderer)
            Log.d(TAG, "Remote renderer sink attached")
        } catch (e: Exception) {
            Log.w(TAG, "Error adding remote renderer sink: ${e.message}")
        }
    }

    fun detachRemoteRenderer(renderer: SurfaceViewRenderer, track: VideoTrack?) {
        try { track?.removeSink(renderer) } catch (_: Exception) {}
        try {
            renderer.clearImage()
            renderer.release()
        } catch (_: Exception) {}
    }

    // ─── Nettoyage ────────────────────────────────────────────────────────────

    fun cleanup() {
        Log.d(TAG, "Cleaning up WebRTC resources")
        try { videoCapturer?.stopCapture() } catch (_: Exception) {}
        try { videoCapturer?.dispose()     } catch (_: Exception) {}
        videoCapturer = null

        surfaceTextureHelper?.dispose()
        surfaceTextureHelper = null

        try { localStream?.dispose() } catch (_: Exception) {}
        localStream         = null
        localVideoTrack     = null
        localAudioTrack     = null

        try { peerConnection?.close() } catch (_: Exception) {}
        peerConnection      = null

        iceCandidateQueue.clear()
        remoteDescriptionSet = false

        remoteVideoTrack         = null
        onLocalVideoTrack        = null
        onRemoteVideoTrack       = null
        onRemoteAudioReady       = null
        onIceCandidate           = null
        onConnectionStateChange  = null
        onIceConnectionStateChange = null

        localRendererRef = null
        Log.d(TAG, "Cleanup complete")
    }

    fun fullReset(context: Context) {
        cleanup()
        factory?.dispose()
        factory = null
        eglBase?.release()
        eglBase = null
        initialize(context)
    }

    // ─── Utilitaire SdpObserver ───────────────────────────────────────────────

    private fun sdpObserver(
        onSuccess:       ((SessionDescription) -> Unit)? = null,
        onCreateFailure: ((String) -> Unit)? = null,
        onSetSuccess:    (() -> Unit)? = null,
        onSetFailure:    ((String) -> Unit)? = null
    ): SdpObserver = object : SdpObserver {
        override fun onCreateSuccess(sdp: SessionDescription) { onSuccess?.invoke(sdp) }
        override fun onCreateFailure(error: String?)          { onCreateFailure?.invoke(error ?: "unknown") }
        override fun onSetSuccess()                            { onSetSuccess?.invoke() }
        override fun onSetFailure(error: String?)              { onSetFailure?.invoke(error ?: "unknown") }
    }
}

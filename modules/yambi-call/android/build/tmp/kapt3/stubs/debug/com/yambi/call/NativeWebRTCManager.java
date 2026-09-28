package com.yambi.call;

/**
 * NativeWebRTCManager — Port de WebRTCManager.ts en Kotlin natif.
 *
 * Utilise la librairie stream-webrtc-android (org.webrtc.*).
 * Singleton — une seule instance de PeerConnection à la fois.
 *
 * Configuration ICE identique à WebRTCManager.ts :
 *  STUN: stun.l.google.com, stun1.l.google.com
 *  TURN: server.yambi.net:3478 (udp + tcp)
 */
@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\u00a2\u0001\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010!\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u0002\n\u0002\b\b\n\u0002\u0018\u0002\n\u0002\b\b\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0007\n\u0002\u0010\b\n\u0002\b\t\n\u0002\u0018\u0002\n\u0002\b\b\n\u0002\u0018\u0002\n\u0002\b\u0006\u0018\u0000 c2\u00020\u0001:\u0001cB\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u000e\u00107\u001a\u00020\u001e2\u0006\u00108\u001a\u000209J\u0016\u0010:\u001a\u00020\t2\u0006\u00108\u001a\u0002092\u0006\u0010;\u001a\u00020\u001bJ\u0010\u0010<\u001a\u00020\u000f2\u0006\u00108\u001a\u000209H\u0002J\u0006\u0010=\u001a\u00020\u0007J\u000e\u0010>\u001a\u00020?H\u0086@\u00a2\u0006\u0002\u0010@J\u001e\u0010A\u001a\u00020?2\u0006\u0010B\u001a\u00020C2\u0006\u0010D\u001a\u00020CH\u0086@\u00a2\u0006\u0002\u0010EJ\u001e\u0010F\u001a\u00020\u001e2\u0006\u0010B\u001a\u00020C2\u0006\u0010D\u001a\u00020CH\u0086@\u00a2\u0006\u0002\u0010EJ \u0010G\u001a\u00020\u001e2\u0006\u0010H\u001a\u00020C2\b\u0010I\u001a\u0004\u0018\u00010C2\u0006\u0010J\u001a\u00020KJ\u0010\u0010L\u001a\u00020\u001e2\u0006\u0010M\u001a\u00020\u0007H\u0002J\u000e\u0010N\u001a\u00020\u001e2\u0006\u0010O\u001a\u00020\u001bJ\u000e\u0010P\u001a\u00020\u001e2\u0006\u0010Q\u001a\u00020\u001bJ\u0006\u0010R\u001a\u00020\u001eJ\u000e\u0010S\u001a\u00020\u001e2\u0006\u0010T\u001a\u00020UJ\u000e\u0010V\u001a\u00020\u001e2\u0006\u0010T\u001a\u00020UJ\u000e\u0010W\u001a\u00020\u001e2\u0006\u0010T\u001a\u00020UJ\u0016\u0010X\u001a\u00020\u001e2\u0006\u0010T\u001a\u00020U2\u0006\u0010Y\u001a\u00020\u000bJ\u0018\u0010Z\u001a\u00020\u001e2\u0006\u0010T\u001a\u00020U2\b\u0010Y\u001a\u0004\u0018\u00010\u000bJ\u0006\u0010[\u001a\u00020\u001eJ\u000e\u0010\\\u001a\u00020\u001e2\u0006\u00108\u001a\u000209Jb\u0010]\u001a\u00020^2\u0016\b\u0002\u0010_\u001a\u0010\u0012\u0004\u0012\u00020?\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001d2\u0016\b\u0002\u0010`\u001a\u0010\u0012\u0004\u0012\u00020C\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001d2\u0010\b\u0002\u0010a\u001a\n\u0012\u0004\u0012\u00020\u001e\u0018\u00010\'2\u0016\b\u0002\u0010b\u001a\u0010\u0012\u0004\u0012\u00020C\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001dH\u0002R\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0006\u001a\u0004\u0018\u00010\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\b\u001a\u0004\u0018\u00010\tX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\n\u001a\u0004\u0018\u00010\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\f\u001a\u0004\u0018\u00010\rX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000e\u001a\u0004\u0018\u00010\u000fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0010\u001a\u0004\u0018\u00010\u0011X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\"\u0010\u0014\u001a\u0004\u0018\u00010\u00132\b\u0010\u0012\u001a\u0004\u0018\u00010\u0013@BX\u0086\u000e\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0016R\u0014\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00190\u0018X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001a\u001a\u00020\u001bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R*\u0010\u001c\u001a\u0012\u0012\u0006\u0012\u0004\u0018\u00010\u000b\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001dX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u001f\u0010 \"\u0004\b!\u0010\"R*\u0010#\u001a\u0012\u0012\u0006\u0012\u0004\u0018\u00010\u000b\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001dX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b$\u0010 \"\u0004\b%\u0010\"R\"\u0010&\u001a\n\u0012\u0004\u0012\u00020\u001e\u0018\u00010\'X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b(\u0010)\"\u0004\b*\u0010+R(\u0010,\u001a\u0010\u0012\u0004\u0012\u00020\u0019\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001dX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b-\u0010 \"\u0004\b.\u0010\"R(\u0010/\u001a\u0010\u0012\u0004\u0012\u000200\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001dX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b1\u0010 \"\u0004\b2\u0010\"R(\u00103\u001a\u0010\u0012\u0004\u0012\u000204\u0012\u0004\u0012\u00020\u001e\u0018\u00010\u001dX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b5\u0010 \"\u0004\b6\u0010\"\u00a8\u0006d"}, d2 = {"Lcom/yambi/call/NativeWebRTCManager;", "", "<init>", "()V", "factory", "Lorg/webrtc/PeerConnectionFactory;", "peerConnection", "Lorg/webrtc/PeerConnection;", "localStream", "Lorg/webrtc/MediaStream;", "localVideoTrack", "Lorg/webrtc/VideoTrack;", "localAudioTrack", "Lorg/webrtc/AudioTrack;", "videoCapturer", "Lorg/webrtc/VideoCapturer;", "surfaceTextureHelper", "Lorg/webrtc/SurfaceTextureHelper;", "value", "Lorg/webrtc/EglBase;", "eglBase", "getEglBase", "()Lorg/webrtc/EglBase;", "iceCandidateQueue", "", "Lorg/webrtc/IceCandidate;", "remoteDescriptionSet", "", "onLocalVideoTrack", "Lkotlin/Function1;", "", "getOnLocalVideoTrack", "()Lkotlin/jvm/functions/Function1;", "setOnLocalVideoTrack", "(Lkotlin/jvm/functions/Function1;)V", "onRemoteVideoTrack", "getOnRemoteVideoTrack", "setOnRemoteVideoTrack", "onRemoteAudioReady", "Lkotlin/Function0;", "getOnRemoteAudioReady", "()Lkotlin/jvm/functions/Function0;", "setOnRemoteAudioReady", "(Lkotlin/jvm/functions/Function0;)V", "onIceCandidate", "getOnIceCandidate", "setOnIceCandidate", "onConnectionStateChange", "Lorg/webrtc/PeerConnection$PeerConnectionState;", "getOnConnectionStateChange", "setOnConnectionStateChange", "onIceConnectionStateChange", "Lorg/webrtc/PeerConnection$IceConnectionState;", "getOnIceConnectionStateChange", "setOnIceConnectionStateChange", "initialize", "context", "Landroid/content/Context;", "getLocalStream", "isVideo", "createCameraCapturer", "createPeerConnection", "createOffer", "Lorg/webrtc/SessionDescription;", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "handleOfferAndCreateAnswer", "sdp", "", "sdpType", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "handleAnswer", "addIceCandidate", "candidate", "sdpMid", "sdpMLineIndex", "", "processIceCandidateQueue", "pc", "toggleMute", "muted", "toggleCamera", "disabled", "switchCamera", "attachLocalRenderer", "renderer", "Lorg/webrtc/SurfaceViewRenderer;", "detachLocalRenderer", "attachRemoteRenderer", "addRemoteRendererSink", "track", "detachRemoteRenderer", "cleanup", "fullReset", "sdpObserver", "Lorg/webrtc/SdpObserver;", "onSuccess", "onCreateFailure", "onSetSuccess", "onSetFailure", "Companion", "yambi-call_debug"})
public final class NativeWebRTCManager {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "[YAMBI_WEBRTC]";
    @kotlin.jvm.Volatile()
    @org.jetbrains.annotations.Nullable()
    private static volatile com.yambi.call.NativeWebRTCManager INSTANCE;
    @org.jetbrains.annotations.NotNull()
    private static final java.util.List<org.webrtc.PeerConnection.IceServer> ICE_SERVERS = null;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.PeerConnectionFactory factory;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.PeerConnection peerConnection;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.MediaStream localStream;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.VideoTrack localVideoTrack;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.AudioTrack localAudioTrack;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.VideoCapturer videoCapturer;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.SurfaceTextureHelper surfaceTextureHelper;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.EglBase eglBase;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<org.webrtc.IceCandidate> iceCandidateQueue = null;
    private boolean remoteDescriptionSet = false;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super org.webrtc.VideoTrack, kotlin.Unit> onLocalVideoTrack;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super org.webrtc.VideoTrack, kotlin.Unit> onRemoteVideoTrack;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function0<kotlin.Unit> onRemoteAudioReady;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super org.webrtc.IceCandidate, kotlin.Unit> onIceCandidate;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super org.webrtc.PeerConnection.PeerConnectionState, kotlin.Unit> onConnectionStateChange;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super org.webrtc.PeerConnection.IceConnectionState, kotlin.Unit> onIceConnectionStateChange;
    @org.jetbrains.annotations.NotNull()
    public static final com.yambi.call.NativeWebRTCManager.Companion Companion = null;
    
    private NativeWebRTCManager() {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final org.webrtc.EglBase getEglBase() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<org.webrtc.VideoTrack, kotlin.Unit> getOnLocalVideoTrack() {
        return null;
    }
    
    public final void setOnLocalVideoTrack(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super org.webrtc.VideoTrack, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<org.webrtc.VideoTrack, kotlin.Unit> getOnRemoteVideoTrack() {
        return null;
    }
    
    public final void setOnRemoteVideoTrack(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super org.webrtc.VideoTrack, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function0<kotlin.Unit> getOnRemoteAudioReady() {
        return null;
    }
    
    public final void setOnRemoteAudioReady(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function0<kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<org.webrtc.IceCandidate, kotlin.Unit> getOnIceCandidate() {
        return null;
    }
    
    public final void setOnIceCandidate(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super org.webrtc.IceCandidate, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<org.webrtc.PeerConnection.PeerConnectionState, kotlin.Unit> getOnConnectionStateChange() {
        return null;
    }
    
    public final void setOnConnectionStateChange(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super org.webrtc.PeerConnection.PeerConnectionState, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<org.webrtc.PeerConnection.IceConnectionState, kotlin.Unit> getOnIceConnectionStateChange() {
        return null;
    }
    
    public final void setOnIceConnectionStateChange(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super org.webrtc.PeerConnection.IceConnectionState, kotlin.Unit> p0) {
    }
    
    public final void initialize(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final org.webrtc.MediaStream getLocalStream(@org.jetbrains.annotations.NotNull()
    android.content.Context context, boolean isVideo) {
        return null;
    }
    
    private final org.webrtc.VideoCapturer createCameraCapturer(android.content.Context context) {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final org.webrtc.PeerConnection createPeerConnection() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object createOffer(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super org.webrtc.SessionDescription> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object handleOfferAndCreateAnswer(@org.jetbrains.annotations.NotNull()
    java.lang.String sdp, @org.jetbrains.annotations.NotNull()
    java.lang.String sdpType, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super org.webrtc.SessionDescription> $completion) {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.Object handleAnswer(@org.jetbrains.annotations.NotNull()
    java.lang.String sdp, @org.jetbrains.annotations.NotNull()
    java.lang.String sdpType, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    public final void addIceCandidate(@org.jetbrains.annotations.NotNull()
    java.lang.String candidate, @org.jetbrains.annotations.Nullable()
    java.lang.String sdpMid, int sdpMLineIndex) {
    }
    
    private final void processIceCandidateQueue(org.webrtc.PeerConnection pc) {
    }
    
    public final void toggleMute(boolean muted) {
    }
    
    public final void toggleCamera(boolean disabled) {
    }
    
    public final void switchCamera() {
    }
    
    public final void attachLocalRenderer(@org.jetbrains.annotations.NotNull()
    org.webrtc.SurfaceViewRenderer renderer) {
    }
    
    public final void detachLocalRenderer(@org.jetbrains.annotations.NotNull()
    org.webrtc.SurfaceViewRenderer renderer) {
    }
    
    public final void attachRemoteRenderer(@org.jetbrains.annotations.NotNull()
    org.webrtc.SurfaceViewRenderer renderer) {
    }
    
    public final void addRemoteRendererSink(@org.jetbrains.annotations.NotNull()
    org.webrtc.SurfaceViewRenderer renderer, @org.jetbrains.annotations.NotNull()
    org.webrtc.VideoTrack track) {
    }
    
    public final void detachRemoteRenderer(@org.jetbrains.annotations.NotNull()
    org.webrtc.SurfaceViewRenderer renderer, @org.jetbrains.annotations.Nullable()
    org.webrtc.VideoTrack track) {
    }
    
    public final void cleanup() {
    }
    
    public final void fullReset(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
    }
    
    private final org.webrtc.SdpObserver sdpObserver(kotlin.jvm.functions.Function1<? super org.webrtc.SessionDescription, kotlin.Unit> onSuccess, kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCreateFailure, kotlin.jvm.functions.Function0<kotlin.Unit> onSetSuccess, kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onSetFailure) {
        return null;
    }
    
    @kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u0006\u0010\b\u001a\u00020\u0007R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0006\u001a\u0004\u0018\u00010\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u001c\u0010\t\u001a\u0010\u0012\f\u0012\n \f*\u0004\u0018\u00010\u000b0\u000b0\nX\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006\r"}, d2 = {"Lcom/yambi/call/NativeWebRTCManager$Companion;", "", "<init>", "()V", "TAG", "", "INSTANCE", "Lcom/yambi/call/NativeWebRTCManager;", "getInstance", "ICE_SERVERS", "", "Lorg/webrtc/PeerConnection$IceServer;", "kotlin.jvm.PlatformType", "yambi-call_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.yambi.call.NativeWebRTCManager getInstance() {
            return null;
        }
    }
}
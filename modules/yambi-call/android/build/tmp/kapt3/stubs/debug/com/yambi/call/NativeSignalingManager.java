package com.yambi.call;

/**
 * NativeSignalingManager — Port de CallSignaling.ts en Kotlin natif.
 *
 * Gère la connexion Socket.IO vers server.yambi.net/ws et tous les événements
 * de signaling d'appel. Singleton utilisé par IncomingCallActivity et ActiveCallActivity.
 *
 * Serveur : https://server.yambi.net
 * Path    : /ws
 */
@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000Z\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0002\b\u0011\n\u0002\u0018\u0002\n\u0002\b\n\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b \n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0006\u0018\u0000 X2\u00020\u0001:\u0001XB\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u000e\u00108\u001a\u00020\u000f2\u0006\u0010\u0006\u001a\u00020\u0007J\u0010\u00109\u001a\u00020\u000f2\u0006\u0010:\u001a\u00020\u0005H\u0002J\u0010\u0010;\u001a\u00020\u000f2\u0006\u0010:\u001a\u00020\u0005H\u0002J6\u0010<\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u00072\u0006\u0010?\u001a\u00020\u00072\u0006\u0010@\u001a\u00020\u00072\u0006\u0010A\u001a\u00020\u0007J\u001e\u0010B\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u0007J\u001e\u0010C\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u0007J\u001e\u0010D\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u0007J\u001e\u0010E\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u0007J\u001e\u0010F\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u0007J.\u0010G\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u00072\u0006\u0010\"\u001a\u00020\u00072\u0006\u0010H\u001a\u00020\u0007J.\u0010I\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u00072\u0006\u0010\"\u001a\u00020\u00072\u0006\u0010H\u001a\u00020\u0007J8\u0010J\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u00072\u0006\u0010-\u001a\u00020\u00072\b\u0010.\u001a\u0004\u0018\u00010\u00072\u0006\u00100\u001a\u00020/J&\u0010K\u001a\u00020\u000f2\u0006\u0010\u000e\u001a\u00020\u00072\u0006\u0010=\u001a\u00020\u00072\u0006\u0010>\u001a\u00020\u00072\u0006\u0010L\u001a\u00020/J\u0018\u0010M\u001a\u00020\u000f2\u0006\u0010N\u001a\u00020\u00072\u0006\u0010O\u001a\u00020PH\u0002J\"\u0010Q\u001a\u00020P2\u0017\u0010R\u001a\u0013\u0012\u0004\u0012\u00020P\u0012\u0004\u0012\u00020\u000f0\u000b\u00a2\u0006\u0002\bSH\u0082\bJ\u0006\u0010T\u001a\u00020\u000fJ\u0006\u0010U\u001a\u00020\u0007J\u0006\u0010\b\u001a\u00020\tJ\b\u0010V\u001a\u00020\u000fH\u0002J\u0006\u0010W\u001a\u00020\u000fR\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082\u000e\u00a2\u0006\u0002\n\u0000R7\u0010\n\u001a\u001f\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0004\u0012\u00020\u000f\u0018\u00010\u000bX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0010\u0010\u0011\"\u0004\b\u0012\u0010\u0013R7\u0010\u0014\u001a\u001f\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0004\u0012\u00020\u000f\u0018\u00010\u000bX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0015\u0010\u0011\"\u0004\b\u0016\u0010\u0013R7\u0010\u0017\u001a\u001f\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0004\u0012\u00020\u000f\u0018\u00010\u000bX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0018\u0010\u0011\"\u0004\b\u0019\u0010\u0013R7\u0010\u001a\u001a\u001f\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0004\u0012\u00020\u000f\u0018\u00010\u000bX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u001b\u0010\u0011\"\u0004\b\u001c\u0010\u0013R7\u0010\u001d\u001a\u001f\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0004\u0012\u00020\u000f\u0018\u00010\u000bX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u001e\u0010\u0011\"\u0004\b\u001f\u0010\u0013Ra\u0010 \u001aI\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\"\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(#\u0012\u0004\u0012\u00020\u000f\u0018\u00010!X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b$\u0010%\"\u0004\b&\u0010\'Ra\u0010(\u001aI\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\"\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(#\u0012\u0004\u0012\u00020\u000f\u0018\u00010!X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b)\u0010%\"\u0004\b*\u0010\'Rx\u0010+\u001a`\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(-\u0012\u0015\u0012\u0013\u0018\u00010\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(.\u0012\u0013\u0012\u00110/\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(0\u0012\u0004\u0012\u00020\u000f\u0018\u00010,X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b1\u00102\"\u0004\b3\u00104R7\u00105\u001a\u001f\u0012\u0013\u0012\u00110\u0007\u00a2\u0006\f\b\f\u0012\b\b\r\u0012\u0004\b\b(\u000e\u0012\u0004\u0012\u00020\u000f\u0018\u00010\u000bX\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b6\u0010\u0011\"\u0004\b7\u0010\u0013\u00a8\u0006Y"}, d2 = {"Lcom/yambi/call/NativeSignalingManager;", "", "<init>", "()V", "socket", "Lio/socket/client/Socket;", "userPhone", "", "isConnected", "", "onCallAccepted", "Lkotlin/Function1;", "Lkotlin/ParameterName;", "name", "callId", "", "getOnCallAccepted", "()Lkotlin/jvm/functions/Function1;", "setOnCallAccepted", "(Lkotlin/jvm/functions/Function1;)V", "onCallRinging", "getOnCallRinging", "setOnCallRinging", "onCallRejected", "getOnCallRejected", "setOnCallRejected", "onCallCancelled", "getOnCallCancelled", "setOnCallCancelled", "onCallBusy", "getOnCallBusy", "setOnCallBusy", "onOffer", "Lkotlin/Function3;", "sdp", "type", "getOnOffer", "()Lkotlin/jvm/functions/Function3;", "setOnOffer", "(Lkotlin/jvm/functions/Function3;)V", "onAnswer", "getOnAnswer", "setOnAnswer", "onIceCandidate", "Lkotlin/Function4;", "candidate", "sdpMid", "", "sdpMLineIndex", "getOnIceCandidate", "()Lkotlin/jvm/functions/Function4;", "setOnIceCandidate", "(Lkotlin/jvm/functions/Function4;)V", "onCallEnd", "getOnCallEnd", "setOnCallEnd", "connect", "setupSystemListeners", "s", "setupCallEventListeners", "sendInvite", "callerId", "calleeId", "callerName", "callerAvatar", "callType", "sendRinging", "sendAccept", "sendReject", "sendCancel", "sendBusy", "sendOffer", "sdpType", "sendAnswer", "sendIceCandidate", "sendEnd", "duration", "emitSafely", "event", "payload", "Lorg/json/JSONObject;", "buildJson", "block", "Lkotlin/ExtensionFunctionType;", "clearCallbacks", "getUserPhone", "disconnectInternal", "disconnect", "Companion", "yambi-call_debug"})
public final class NativeSignalingManager {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "[YAMBI_SIGNALING]";
    @org.jetbrains.annotations.NotNull()
    private static final com.yambi.call.NativeSignalingManager instance = null;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_ASSEMBLE = "assemble";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_INVITE = "call:invite";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_RINGING = "call:ringing";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_ACCEPT = "call:accept";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_REJECT = "call:reject";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_CANCEL = "call:cancel";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_BUSY = "call:busy";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_OFFER = "call:offer";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_ANSWER = "call:answer";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_ICE = "call:ice-candidate";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EV_END = "call:end";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String SERVER_URL = "https://server.yambi.net";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String SERVER_PATH = "/ws";
    @org.jetbrains.annotations.Nullable()
    private io.socket.client.Socket socket;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String userPhone = "";
    private boolean isConnected = false;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCallAccepted;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCallRinging;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCallRejected;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCallCancelled;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCallBusy;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function3<? super java.lang.String, ? super java.lang.String, ? super java.lang.String, kotlin.Unit> onOffer;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function3<? super java.lang.String, ? super java.lang.String, ? super java.lang.String, kotlin.Unit> onAnswer;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function4<? super java.lang.String, ? super java.lang.String, ? super java.lang.String, ? super java.lang.Integer, kotlin.Unit> onIceCandidate;
    @org.jetbrains.annotations.Nullable()
    private kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCallEnd;
    @org.jetbrains.annotations.NotNull()
    public static final com.yambi.call.NativeSignalingManager.Companion Companion = null;
    
    private NativeSignalingManager() {
        super();
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<java.lang.String, kotlin.Unit> getOnCallAccepted() {
        return null;
    }
    
    public final void setOnCallAccepted(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<java.lang.String, kotlin.Unit> getOnCallRinging() {
        return null;
    }
    
    public final void setOnCallRinging(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<java.lang.String, kotlin.Unit> getOnCallRejected() {
        return null;
    }
    
    public final void setOnCallRejected(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<java.lang.String, kotlin.Unit> getOnCallCancelled() {
        return null;
    }
    
    public final void setOnCallCancelled(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<java.lang.String, kotlin.Unit> getOnCallBusy() {
        return null;
    }
    
    public final void setOnCallBusy(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function3<java.lang.String, java.lang.String, java.lang.String, kotlin.Unit> getOnOffer() {
        return null;
    }
    
    public final void setOnOffer(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function3<? super java.lang.String, ? super java.lang.String, ? super java.lang.String, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function3<java.lang.String, java.lang.String, java.lang.String, kotlin.Unit> getOnAnswer() {
        return null;
    }
    
    public final void setOnAnswer(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function3<? super java.lang.String, ? super java.lang.String, ? super java.lang.String, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function4<java.lang.String, java.lang.String, java.lang.String, java.lang.Integer, kotlin.Unit> getOnIceCandidate() {
        return null;
    }
    
    public final void setOnIceCandidate(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function4<? super java.lang.String, ? super java.lang.String, ? super java.lang.String, ? super java.lang.Integer, kotlin.Unit> p0) {
    }
    
    @org.jetbrains.annotations.Nullable()
    public final kotlin.jvm.functions.Function1<java.lang.String, kotlin.Unit> getOnCallEnd() {
        return null;
    }
    
    public final void setOnCallEnd(@org.jetbrains.annotations.Nullable()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> p0) {
    }
    
    public final void connect(@org.jetbrains.annotations.NotNull()
    java.lang.String userPhone) {
    }
    
    private final void setupSystemListeners(io.socket.client.Socket s) {
    }
    
    private final void setupCallEventListeners(io.socket.client.Socket s) {
    }
    
    public final void sendInvite(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerName, @org.jetbrains.annotations.NotNull()
    java.lang.String callerAvatar, @org.jetbrains.annotations.NotNull()
    java.lang.String callType) {
    }
    
    public final void sendRinging(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId) {
    }
    
    public final void sendAccept(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId) {
    }
    
    public final void sendReject(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId) {
    }
    
    public final void sendCancel(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId) {
    }
    
    public final void sendBusy(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId) {
    }
    
    public final void sendOffer(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId, @org.jetbrains.annotations.NotNull()
    java.lang.String sdp, @org.jetbrains.annotations.NotNull()
    java.lang.String sdpType) {
    }
    
    public final void sendAnswer(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId, @org.jetbrains.annotations.NotNull()
    java.lang.String sdp, @org.jetbrains.annotations.NotNull()
    java.lang.String sdpType) {
    }
    
    public final void sendIceCandidate(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId, @org.jetbrains.annotations.NotNull()
    java.lang.String candidate, @org.jetbrains.annotations.Nullable()
    java.lang.String sdpMid, int sdpMLineIndex) {
    }
    
    public final void sendEnd(@org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId, int duration) {
    }
    
    private final void emitSafely(java.lang.String event, org.json.JSONObject payload) {
    }
    
    private final org.json.JSONObject buildJson(kotlin.jvm.functions.Function1<? super org.json.JSONObject, kotlin.Unit> block) {
        return null;
    }
    
    public final void clearCallbacks() {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getUserPhone() {
        return null;
    }
    
    public final boolean isConnected() {
        return false;
    }
    
    private final void disconnectInternal() {
    }
    
    public final void disconnect() {
    }
    
    @kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0010\b\u0086\u0003\u0018\u00002\u00020\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\b\u0010\tR\u000e\u0010\n\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0011\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0013\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0014\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0015\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0016\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0017"}, d2 = {"Lcom/yambi/call/NativeSignalingManager$Companion;", "", "<init>", "()V", "TAG", "", "instance", "Lcom/yambi/call/NativeSignalingManager;", "getInstance", "()Lcom/yambi/call/NativeSignalingManager;", "EV_ASSEMBLE", "EV_INVITE", "EV_RINGING", "EV_ACCEPT", "EV_REJECT", "EV_CANCEL", "EV_BUSY", "EV_OFFER", "EV_ANSWER", "EV_ICE", "EV_END", "SERVER_URL", "SERVER_PATH", "yambi-call_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.yambi.call.NativeSignalingManager getInstance() {
            return null;
        }
    }
}
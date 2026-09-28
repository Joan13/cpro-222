package com.yambi.call;

/**
 * ActiveCallActivity — Écran d'appel actif natif (audio + vidéo).
 *
 * Remplace AudioCallScreen.tsx et VideoCallScreen.tsx de l'app React Native.
 * Utilisé pour TOUS les appels, app ouverte ou fermée.
 *
 * Flux appel entrant (isCaller=false) :
 *  connect() → sendAccept → attendreOffer → createAnswer → sendAnswer → WebRTC actif
 *
 * Flux appel sortant (isCaller=true) :
 *  connect() → sendInvite → attendreAccept → createOffer → sendOffer → attendreAnswer → WebRTC actif
 */
@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\u00ae\u0001\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\b\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\t\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0013\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0007\n\u0002\b\b\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\b\u0018\u0000 g2\u00020\u0001:\u0002ghB\u0007\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u0012\u00103\u001a\u0002042\b\u00105\u001a\u0004\u0018\u000106H\u0014J\b\u00107\u001a\u000204H\u0014J\b\u00108\u001a\u000204H\u0014J\b\u00109\u001a\u000204H\u0003J\u0012\u0010:\u001a\u0002042\b\u0010;\u001a\u0004\u0018\u00010<H\u0002J\b\u0010=\u001a\u000204H\u0002J\b\u0010>\u001a\u000204H\u0002J\b\u0010?\u001a\u000204H\u0002J\u0018\u0010@\u001a\u0002042\u0006\u0010A\u001a\u00020\u00052\u0006\u0010B\u001a\u00020\u000eH\u0002J\u0010\u0010C\u001a\u0002042\u0006\u0010A\u001a\u00020\u0005H\u0002J\u0010\u0010D\u001a\u0002042\u0006\u0010A\u001a\u00020\u0005H\u0002J\b\u0010E\u001a\u000204H\u0002J\b\u0010F\u001a\u000204H\u0002J\b\u0010G\u001a\u000204H\u0002J\b\u0010H\u001a\u000204H\u0002J\b\u0010I\u001a\u000204H\u0002J\b\u0010J\u001a\u000204H\u0002J\b\u0010K\u001a\u000204H\u0002J\b\u0010L\u001a\u000204H\u0002J\b\u0010M\u001a\u000204H\u0002J\u0010\u0010N\u001a\u0002042\u0006\u0010O\u001a\u00020PH\u0002J\b\u0010Q\u001a\u000204H\u0002J\b\u0010R\u001a\u000204H\u0002J\u0010\u0010S\u001a\u00020T2\u0006\u0010U\u001a\u00020VH\u0002J\b\u0010W\u001a\u000204H\u0002J\u0010\u0010X\u001a\u00020T2\u0006\u0010U\u001a\u00020VH\u0002J@\u0010Y\u001a\u00020T2\u0006\u0010Z\u001a\u00020\u00132\u0006\u0010[\u001a\u00020\u00052\u0006\u0010\\\u001a\u00020\u00052\u0006\u0010U\u001a\u00020V2\b\b\u0002\u0010]\u001a\u00020\u00132\f\u0010^\u001a\b\u0012\u0004\u0012\u0002040_H\u0002J\u0010\u0010`\u001a\u00020a2\u0006\u0010b\u001a\u00020\u0013H\u0002J\u0010\u0010c\u001a\u0002042\u0006\u0010d\u001a\u00020\u0005H\u0002J\u0010\u0010e\u001a\u00020\u00052\u0006\u0010f\u001a\u00020\u0013H\u0002R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0011X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0013X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0014\u001a\u00020\u0015X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0016\u001a\u00020\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0017\u001a\u00020\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0018\u001a\u00020\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0019\u001a\u00020\u001aX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u001b\u001a\u00020\u001cX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u001d\u001a\u00020\u001eX\u0082\u0004\u00a2\u0006\u0004\n\u0002\u0010\u001fR\u0012\u0010 \u001a\u00060\u001ej\u0002`!X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\"\u001a\u00020#X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010$\u001a\u00020%X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010&\u001a\u0004\u0018\u00010\'X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010(\u001a\u0004\u0018\u00010)X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010*\u001a\u0004\u0018\u00010)X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010+\u001a\u0004\u0018\u00010,X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010-\u001a\u0004\u0018\u00010,X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010.\u001a\u0004\u0018\u00010,X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010/\u001a\u0004\u0018\u00010,X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u00100\u001a\u0004\u0018\u000101X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u00102\u001a\u0004\u0018\u000101X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006i"}, d2 = {"Lcom/yambi/call/ActiveCallActivity;", "Landroid/app/Activity;", "<init>", "()V", "callId", "", "callerId", "calleeId", "callerName", "callerAvatar", "calleeName", "calleeAvatar", "callType", "isCaller", "", "userPhone", "callState", "Lcom/yambi/call/ActiveCallActivity$CallState;", "durationSeconds", "", "callStartTime", "", "isMuted", "isSpeakerOn", "isCameraOff", "scope", "Lkotlinx/coroutines/CoroutineScope;", "mainHandler", "Landroid/os/Handler;", "durationTick", "Ljava/lang/Runnable;", "Ljava/lang/Runnable;", "timeoutRunnable", "Lkotlinx/coroutines/Runnable;", "webRTC", "Lcom/yambi/call/NativeWebRTCManager;", "signaling", "Lcom/yambi/call/NativeSignalingManager;", "remoteVideoTrack", "Lorg/webrtc/VideoTrack;", "statusLabel", "Landroid/widget/TextView;", "nameLabel", "avatarView", "Landroid/widget/ImageView;", "muteIcon", "speakerIcon", "camIcon", "remoteRenderer", "Lorg/webrtc/SurfaceViewRenderer;", "localRenderer", "onCreate", "", "savedInstanceState", "Landroid/os/Bundle;", "onDestroy", "onUserLeaveHint", "enterPiP", "extractIntentData", "intent", "Landroid/content/Intent;", "startCall", "setupSignalingCallbacks", "setupWebRTCCallbacks", "handleCallEnd", "reason", "remote", "saveCallHistory", "notifyRNCallEnded", "toggleMute", "toggleSpeaker", "toggleCamera", "switchCamera", "onEndCallPressed", "openMainApp", "showOngoingCallNotification", "updateOngoingNotification", "cancelOngoingNotification", "createOngoingChannel", "nm", "Landroid/app/NotificationManager;", "setupWindowFlags", "setupAudioUI", "buildAudioControls", "Landroid/widget/LinearLayout;", "density", "", "setupVideoUI", "buildVideoControls", "buildControlButton", "iconResId", "bgColor", "label", "size", "onClick", "Lkotlin/Function0;", "spacer", "Landroid/view/View;", "width", "updateStatusLabel", "text", "formatDuration", "seconds", "Companion", "CallState", "yambi-call_debug"})
public final class ActiveCallActivity extends android.app.Activity {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String TAG = "[YAMBI_ACTIVE_CALL]";
    private static final int ONGOING_NOTIF_ID = 9002;
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String ONGOING_CHANNEL_ID = "yambi_ongoing_call";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALL_ID = "callId";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALLER_ID = "callerId";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALLEE_ID = "calleeId";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALLER_NAME = "callerName";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALLER_AVATAR = "callerAvatar";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALLEE_NAME = "calleeName";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALLEE_AVATAR = "calleeAvatar";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_CALL_TYPE = "callType";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_IS_CALLER = "isCaller";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String EXTRA_USER_PHONE = "userPhone";
    private static final long CALL_TIMEOUT_MS = 45000L;
    @org.jetbrains.annotations.Nullable()
    private static java.lang.ref.WeakReference<com.yambi.call.ActiveCallActivity> currentInstance;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callId = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callerId = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String calleeId = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callerName = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callerAvatar = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String calleeName = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String calleeAvatar = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callType = "audio";
    private boolean isCaller = false;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String userPhone = "";
    @org.jetbrains.annotations.NotNull()
    private com.yambi.call.ActiveCallActivity.CallState callState = com.yambi.call.ActiveCallActivity.CallState.CONNECTING;
    private int durationSeconds = 0;
    private long callStartTime = 0L;
    private boolean isMuted = false;
    private boolean isSpeakerOn = false;
    private boolean isCameraOff = false;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.CoroutineScope scope = null;
    @org.jetbrains.annotations.NotNull()
    private final android.os.Handler mainHandler = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.Runnable durationTick = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.Runnable timeoutRunnable = null;
    @org.jetbrains.annotations.NotNull()
    private final com.yambi.call.NativeWebRTCManager webRTC = null;
    @org.jetbrains.annotations.NotNull()
    private final com.yambi.call.NativeSignalingManager signaling = null;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.VideoTrack remoteVideoTrack;
    @org.jetbrains.annotations.Nullable()
    private android.widget.TextView statusLabel;
    @org.jetbrains.annotations.Nullable()
    private android.widget.TextView nameLabel;
    @org.jetbrains.annotations.Nullable()
    private android.widget.ImageView avatarView;
    @org.jetbrains.annotations.Nullable()
    private android.widget.ImageView muteIcon;
    @org.jetbrains.annotations.Nullable()
    private android.widget.ImageView speakerIcon;
    @org.jetbrains.annotations.Nullable()
    private android.widget.ImageView camIcon;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.SurfaceViewRenderer remoteRenderer;
    @org.jetbrains.annotations.Nullable()
    private org.webrtc.SurfaceViewRenderer localRenderer;
    @org.jetbrains.annotations.NotNull()
    public static final com.yambi.call.ActiveCallActivity.Companion Companion = null;
    
    public ActiveCallActivity() {
        super();
    }
    
    @java.lang.Override()
    protected void onCreate(@org.jetbrains.annotations.Nullable()
    android.os.Bundle savedInstanceState) {
    }
    
    @java.lang.Override()
    protected void onDestroy() {
    }
    
    @java.lang.Override()
    protected void onUserLeaveHint() {
    }
    
    @androidx.annotation.RequiresApi(value = android.os.Build.VERSION_CODES.O)
    private final void enterPiP() {
    }
    
    private final void extractIntentData(android.content.Intent intent) {
    }
    
    private final void startCall() {
    }
    
    private final void setupSignalingCallbacks() {
    }
    
    private final void setupWebRTCCallbacks() {
    }
    
    private final void handleCallEnd(java.lang.String reason, boolean remote) {
    }
    
    private final void saveCallHistory(java.lang.String reason) {
    }
    
    private final void notifyRNCallEnded(java.lang.String reason) {
    }
    
    private final void toggleMute() {
    }
    
    private final void toggleSpeaker() {
    }
    
    private final void toggleCamera() {
    }
    
    private final void switchCamera() {
    }
    
    private final void onEndCallPressed() {
    }
    
    private final void openMainApp() {
    }
    
    private final void showOngoingCallNotification() {
    }
    
    private final void updateOngoingNotification() {
    }
    
    private final void cancelOngoingNotification() {
    }
    
    private final void createOngoingChannel(android.app.NotificationManager nm) {
    }
    
    private final void setupWindowFlags() {
    }
    
    private final void setupAudioUI() {
    }
    
    private final android.widget.LinearLayout buildAudioControls(float density) {
        return null;
    }
    
    private final void setupVideoUI() {
    }
    
    private final android.widget.LinearLayout buildVideoControls(float density) {
        return null;
    }
    
    private final android.widget.LinearLayout buildControlButton(int iconResId, java.lang.String bgColor, java.lang.String label, float density, int size, kotlin.jvm.functions.Function0<kotlin.Unit> onClick) {
        return null;
    }
    
    private final android.view.View spacer(int width) {
        return null;
    }
    
    private final void updateStatusLabel(java.lang.String text) {
    }
    
    private final java.lang.String formatDuration(int seconds) {
        return null;
    }
    
    @kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0010\u0010\n\u0002\b\u0007\b\u0082\u0081\u0002\u0018\u00002\b\u0012\u0004\u0012\u00020\u00000\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003j\u0002\b\u0004j\u0002\b\u0005j\u0002\b\u0006j\u0002\b\u0007\u00a8\u0006\b"}, d2 = {"Lcom/yambi/call/ActiveCallActivity$CallState;", "", "<init>", "(Ljava/lang/String;I)V", "CONNECTING", "CONNECTED", "RECONNECTING", "ENDED", "yambi-call_debug"})
    static enum CallState {
        /*public static final*/ CONNECTING /* = new CONNECTING() */,
        /*public static final*/ CONNECTED /* = new CONNECTED() */,
        /*public static final*/ RECONNECTING /* = new RECONNECTING() */,
        /*public static final*/ ENDED /* = new ENDED() */;
        
        CallState() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public static kotlin.enums.EnumEntries<com.yambi.call.ActiveCallActivity.CallState> getEntries() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0002\b\f\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0010\u000b\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u0006\u0010\u0018\u001a\u00020\u0019J^\u0010\u001a\u001a\u00020\u001b2\u0006\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u00052\u0006\u0010\u001f\u001a\u00020\u00052\u0006\u0010 \u001a\u00020\u00052\u0006\u0010!\u001a\u00020\u00052\u0006\u0010\"\u001a\u00020\u00052\u0006\u0010#\u001a\u00020\u00052\u0006\u0010$\u001a\u00020\u00052\u0006\u0010%\u001a\u00020\u00052\u0006\u0010&\u001a\u00020\'2\u0006\u0010(\u001a\u00020\u0005R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0007X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0011\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0013\u001a\u00020\u0014X\u0082T\u00a2\u0006\u0002\n\u0000R\u0016\u0010\u0015\u001a\n\u0012\u0004\u0012\u00020\u0017\u0018\u00010\u0016X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006)"}, d2 = {"Lcom/yambi/call/ActiveCallActivity$Companion;", "", "<init>", "()V", "TAG", "", "ONGOING_NOTIF_ID", "", "ONGOING_CHANNEL_ID", "EXTRA_CALL_ID", "EXTRA_CALLER_ID", "EXTRA_CALLEE_ID", "EXTRA_CALLER_NAME", "EXTRA_CALLER_AVATAR", "EXTRA_CALLEE_NAME", "EXTRA_CALLEE_AVATAR", "EXTRA_CALL_TYPE", "EXTRA_IS_CALLER", "EXTRA_USER_PHONE", "CALL_TIMEOUT_MS", "", "currentInstance", "Ljava/lang/ref/WeakReference;", "Lcom/yambi/call/ActiveCallActivity;", "finishCurrent", "", "buildLaunchIntent", "Landroid/content/Intent;", "context", "Landroid/content/Context;", "callId", "callerId", "calleeId", "callerName", "callerAvatar", "calleeName", "calleeAvatar", "callType", "isCaller", "", "userPhone", "yambi-call_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        public final void finishCurrent() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final android.content.Intent buildLaunchIntent(@org.jetbrains.annotations.NotNull()
        android.content.Context context, @org.jetbrains.annotations.NotNull()
        java.lang.String callId, @org.jetbrains.annotations.NotNull()
        java.lang.String callerId, @org.jetbrains.annotations.NotNull()
        java.lang.String calleeId, @org.jetbrains.annotations.NotNull()
        java.lang.String callerName, @org.jetbrains.annotations.NotNull()
        java.lang.String callerAvatar, @org.jetbrains.annotations.NotNull()
        java.lang.String calleeName, @org.jetbrains.annotations.NotNull()
        java.lang.String calleeAvatar, @org.jetbrains.annotations.NotNull()
        java.lang.String callType, boolean isCaller, @org.jetbrains.annotations.NotNull()
        java.lang.String userPhone) {
            return null;
        }
    }
}
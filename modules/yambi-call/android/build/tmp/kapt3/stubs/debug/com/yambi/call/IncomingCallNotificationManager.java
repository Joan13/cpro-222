package com.yambi.call;

@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000H\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0010\u000b\n\u0002\b\u0005\b\u00c6\u0002\u0018\u00002\u00020\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u000e\u0010\r\u001a\u00020\u000e2\u0006\u0010\u000f\u001a\u00020\u0010J\u000e\u0010\u0011\u001a\u00020\u00122\u0006\u0010\u000f\u001a\u00020\u0010JL\u0010\u0013\u001a\u00020\u00142\u0006\u0010\u000f\u001a\u00020\u00102\u0006\u0010\u0015\u001a\u00020\u00052\u0006\u0010\u0016\u001a\u00020\u00052\u0006\u0010\u0017\u001a\u00020\u00052\b\u0010\u0018\u001a\u0004\u0018\u00010\u00052\u0006\u0010\u0019\u001a\u00020\u00052\b\b\u0002\u0010\u001a\u001a\u00020\u001b2\b\b\u0002\u0010\u001c\u001a\u00020\u0005J\u001a\u0010\u001d\u001a\u00020\u00122\u0006\u0010\u000f\u001a\u00020\u00102\n\b\u0002\u0010\u0015\u001a\u0004\u0018\u00010\u0005J\u000e\u0010\u001e\u001a\u00020\u00122\u0006\u0010\u000f\u001a\u00020\u0010J\u0006\u0010\u001f\u001a\u00020\u0012R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0005X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0086T\u00a2\u0006\u0002\n\u0000R\u0010\u0010\t\u001a\u0004\u0018\u00010\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000b\u001a\u0004\u0018\u00010\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006 "}, d2 = {"Lcom/yambi/call/IncomingCallNotificationManager;", "", "<init>", "()V", "CHANNEL_ID", "", "CHANNEL_NAME", "NOTIFICATION_ID", "", "ringtone", "Landroid/media/Ringtone;", "vibrator", "Landroid/os/Vibrator;", "getSystemRingtoneUri", "Landroid/net/Uri;", "context", "Landroid/content/Context;", "createNotificationChannel", "", "showIncomingCallNotification", "Landroid/app/Notification;", "callId", "callerId", "callerName", "callerAvatar", "callType", "isVerified", "", "calleeId", "dismissNotification", "startRinging", "stopRinging", "yambi-call_debug"})
public final class IncomingCallNotificationManager {
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String CHANNEL_ID = "yambi_incoming_calls_channel_v2";
    @org.jetbrains.annotations.NotNull()
    private static final java.lang.String CHANNEL_NAME = "Appels entrants Yambi";
    public static final int NOTIFICATION_ID = 998822;
    @org.jetbrains.annotations.Nullable()
    private static android.media.Ringtone ringtone;
    @org.jetbrains.annotations.Nullable()
    private static android.os.Vibrator vibrator;
    @org.jetbrains.annotations.NotNull()
    public static final com.yambi.call.IncomingCallNotificationManager INSTANCE = null;
    
    private IncomingCallNotificationManager() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final android.net.Uri getSystemRingtoneUri(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        return null;
    }
    
    public final void createNotificationChannel(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
    }
    
    @org.jetbrains.annotations.NotNull()
    public final android.app.Notification showIncomingCallNotification(@org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    java.lang.String callId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerId, @org.jetbrains.annotations.NotNull()
    java.lang.String callerName, @org.jetbrains.annotations.Nullable()
    java.lang.String callerAvatar, @org.jetbrains.annotations.NotNull()
    java.lang.String callType, boolean isVerified, @org.jetbrains.annotations.NotNull()
    java.lang.String calleeId) {
        return null;
    }
    
    public final void dismissNotification(@org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.Nullable()
    java.lang.String callId) {
    }
    
    public final void startRinging(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
    }
    
    public final void stopRinging() {
    }
}
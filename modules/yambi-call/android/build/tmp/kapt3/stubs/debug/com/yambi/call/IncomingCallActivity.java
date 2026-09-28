package com.yambi.call;

@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\\\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0005\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\u0006\u0018\u0000 +2\u00020\u0001:\u0001+B\u0007\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u0012\u0010\u0019\u001a\u00020\u001a2\b\u0010\u001b\u001a\u0004\u0018\u00010\u001cH\u0014J\u0010\u0010\u001d\u001a\u00020\u001a2\u0006\u0010\u001e\u001a\u00020\u001fH\u0014J\u0012\u0010 \u001a\u00020\u001a2\b\u0010\u001e\u001a\u0004\u0018\u00010\u001fH\u0002J\b\u0010!\u001a\u00020\u001aH\u0002J\b\u0010\"\u001a\u00020\u001aH\u0002J\u0010\u0010#\u001a\u00020\u001a2\u0006\u0010$\u001a\u00020\u0005H\u0002J\u0010\u0010%\u001a\u00020&2\u0006\u0010\'\u001a\u00020&H\u0002J\b\u0010(\u001a\u00020\u001aH\u0002J\b\u0010)\u001a\u00020\u001aH\u0002J\b\u0010*\u001a\u00020\u001aH\u0014R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\u000bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\r\u001a\u0004\u0018\u00010\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000f\u001a\u0004\u0018\u00010\u0010X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0011\u001a\u0004\u0018\u00010\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0013X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0014\u001a\u00020\u0015X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0016\u001a\u00020\u0017X\u0082\u0004\u00a2\u0006\u0004\n\u0002\u0010\u0018\u00a8\u0006,"}, d2 = {"Lcom/yambi/call/IncomingCallActivity;", "Landroid/app/Activity;", "<init>", "()V", "callId", "", "callerId", "callerName", "callerAvatar", "callType", "isVerified", "", "calleeId", "backgroundImageView", "Landroid/widget/ImageView;", "backgroundOverlayView", "Landroid/view/View;", "avatarImageView", "timeoutHandler", "Landroid/os/Handler;", "timeoutRunnable", "Ljava/lang/Runnable;", "dismissReceiver", "Landroid/content/BroadcastReceiver;", "Landroid/content/BroadcastReceiver;", "onCreate", "", "savedInstanceState", "Landroid/os/Bundle;", "onNewIntent", "intent", "Landroid/content/Intent;", "extractIntentData", "setupWindowFlags", "setupUI", "loadCallerAvatar", "avatarUrl", "getCircularBitmap", "Landroid/graphics/Bitmap;", "src", "handleAccept", "handleReject", "onDestroy", "Companion", "yambi-call_debug"})
public final class IncomingCallActivity extends android.app.Activity {
    @org.jetbrains.annotations.NotNull()
    public static final java.lang.String ACTION_DISMISS_INCOMING_CALL = "com.yambi.call.ACTION_DISMISS_INCOMING_CALL";
    @org.jetbrains.annotations.Nullable()
    private static java.lang.ref.WeakReference<com.yambi.call.IncomingCallActivity> activeActivityRef;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callId = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callerId = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callerName = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callerAvatar = "";
    @org.jetbrains.annotations.NotNull()
    private java.lang.String callType = "audio";
    private boolean isVerified = false;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String calleeId = "";
    @org.jetbrains.annotations.Nullable()
    private android.widget.ImageView backgroundImageView;
    @org.jetbrains.annotations.Nullable()
    private android.view.View backgroundOverlayView;
    @org.jetbrains.annotations.Nullable()
    private android.widget.ImageView avatarImageView;
    @org.jetbrains.annotations.NotNull()
    private final android.os.Handler timeoutHandler = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.Runnable timeoutRunnable = null;
    @org.jetbrains.annotations.NotNull()
    private final android.content.BroadcastReceiver dismissReceiver = null;
    @org.jetbrains.annotations.NotNull()
    public static final com.yambi.call.IncomingCallActivity.Companion Companion = null;
    
    public IncomingCallActivity() {
        super();
    }
    
    @java.lang.Override()
    protected void onCreate(@org.jetbrains.annotations.Nullable()
    android.os.Bundle savedInstanceState) {
    }
    
    @java.lang.Override()
    protected void onNewIntent(@org.jetbrains.annotations.NotNull()
    android.content.Intent intent) {
    }
    
    private final void extractIntentData(android.content.Intent intent) {
    }
    
    private final void setupWindowFlags() {
    }
    
    private final void setupUI() {
    }
    
    private final void loadCallerAvatar(java.lang.String avatarUrl) {
    }
    
    private final android.graphics.Bitmap getCircularBitmap(android.graphics.Bitmap src) {
        return null;
    }
    
    private final void handleAccept() {
    }
    
    private final void handleReject() {
    }
    
    @java.lang.Override()
    protected void onDestroy() {
    }
    
    @kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000$\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u0012\u0010\t\u001a\u00020\n2\n\b\u0002\u0010\u000b\u001a\u0004\u0018\u00010\u0005R\u000e\u0010\u0004\u001a\u00020\u0005X\u0086T\u00a2\u0006\u0002\n\u0000R\u0016\u0010\u0006\u001a\n\u0012\u0004\u0012\u00020\b\u0018\u00010\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006\f"}, d2 = {"Lcom/yambi/call/IncomingCallActivity$Companion;", "", "<init>", "()V", "ACTION_DISMISS_INCOMING_CALL", "", "activeActivityRef", "Ljava/lang/ref/WeakReference;", "Lcom/yambi/call/IncomingCallActivity;", "finishCurrent", "", "targetCallId", "yambi-call_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        public final void finishCurrent(@org.jetbrains.annotations.Nullable()
        java.lang.String targetCallId) {
        }
    }
}
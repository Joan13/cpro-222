package com.yambi.call;

@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\u0018\u0000 \u00062\u00020\u0001:\u0001\u0006B\u0007\u00a2\u0006\u0004\b\u0002\u0010\u0003J\b\u0010\u0004\u001a\u00020\u0005H\u0016\u00a8\u0006\u0007"}, d2 = {"Lcom/yambi/call/YambiCallModule;", "Lexpo/modules/kotlin/modules/Module;", "<init>", "()V", "definition", "Lexpo/modules/kotlin/modules/ModuleDefinitionData;", "Companion", "yambi-call_debug"})
public final class YambiCallModule extends expo.modules.kotlin.modules.Module {
    @org.jetbrains.annotations.Nullable()
    private static com.yambi.call.YambiCallModule instance;
    @org.jetbrains.annotations.Nullable()
    private static java.util.Map<java.lang.String, ? extends java.lang.Object> pendingCallData;
    @org.jetbrains.annotations.NotNull()
    private static java.lang.String localUserPhone = "";
    @org.jetbrains.annotations.NotNull()
    public static final com.yambi.call.YambiCallModule.Companion Companion = null;
    
    public YambiCallModule() {
        super();
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public expo.modules.kotlin.modules.ModuleDefinitionData definition() {
        return null;
    }
    
    @kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010$\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0002\b\b\b\u0086\u0003\u0018\u00002\u00020\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u001c\u0010\n\u001a\u00020\u000b2\u0014\u0010\f\u001a\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010\u0007J\u0006\u0010\r\u001a\u00020\u000bJ\u001c\u0010\u000e\u001a\u00020\u000b2\u0014\u0010\f\u001a\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010\u0007J\u001c\u0010\u000f\u001a\u00020\u000b2\u0014\u0010\f\u001a\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010\u0007J\u001c\u0010\u0010\u001a\u00020\u000b2\u0014\u0010\f\u001a\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010\u0007J$\u0010\u0011\u001a\u00020\u000b2\u0006\u0010\u0012\u001a\u00020\b2\u0014\u0010\f\u001a\u0010\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u00010\u0007R\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u001e\u0010\u0006\u001a\u0012\u0012\u0004\u0012\u00020\b\u0012\u0006\u0012\u0004\u0018\u00010\u0001\u0018\u00010\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\t\u001a\u00020\bX\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0013"}, d2 = {"Lcom/yambi/call/YambiCallModule$Companion;", "", "<init>", "()V", "instance", "Lcom/yambi/call/YambiCallModule;", "pendingCallData", "", "", "localUserPhone", "setPendingCallData", "", "data", "clearPendingCallData", "emitCallAnswered", "emitCallRejected", "emitCallEnded", "emitToJS", "event", "yambi-call_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        public final void setPendingCallData(@org.jetbrains.annotations.NotNull()
        java.util.Map<java.lang.String, ? extends java.lang.Object> data) {
        }
        
        public final void clearPendingCallData() {
        }
        
        public final void emitCallAnswered(@org.jetbrains.annotations.NotNull()
        java.util.Map<java.lang.String, ? extends java.lang.Object> data) {
        }
        
        public final void emitCallRejected(@org.jetbrains.annotations.NotNull()
        java.util.Map<java.lang.String, ? extends java.lang.Object> data) {
        }
        
        public final void emitCallEnded(@org.jetbrains.annotations.NotNull()
        java.util.Map<java.lang.String, ? extends java.lang.Object> data) {
        }
        
        /**
         * Méthode générique d'émission vers JS — utilisée par ActiveCallActivity
         * pour notifier la fin d'appel sans passer par le bridge Expo.
         */
        public final void emitToJS(@org.jetbrains.annotations.NotNull()
        java.lang.String event, @org.jetbrains.annotations.NotNull()
        java.util.Map<java.lang.String, ? extends java.lang.Object> data) {
        }
    }
}
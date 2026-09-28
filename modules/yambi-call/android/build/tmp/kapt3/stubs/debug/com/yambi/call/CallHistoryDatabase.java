package com.yambi.call;

@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\b\'\u0018\u0000 \u00062\u00020\u0001:\u0001\u0006B\u0007\u00a2\u0006\u0004\b\u0002\u0010\u0003J\b\u0010\u0004\u001a\u00020\u0005H&\u00a8\u0006\u0007"}, d2 = {"Lcom/yambi/call/CallHistoryDatabase;", "Landroidx/room/RoomDatabase;", "<init>", "()V", "dao", "Lcom/yambi/call/CallHistoryDao;", "Companion", "yambi-call_debug"})
@androidx.room.Database(entities = {com.yambi.call.CallHistoryEntity.class}, version = 1, exportSchema = false)
public abstract class CallHistoryDatabase extends androidx.room.RoomDatabase {
    @kotlin.jvm.Volatile()
    @org.jetbrains.annotations.Nullable()
    private static volatile com.yambi.call.CallHistoryDatabase INSTANCE;
    @org.jetbrains.annotations.NotNull()
    public static final com.yambi.call.CallHistoryDatabase.Companion Companion = null;
    
    public CallHistoryDatabase() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public abstract com.yambi.call.CallHistoryDao dao();
    
    @kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\t\b\u0002\u00a2\u0006\u0004\b\u0002\u0010\u0003J\u000e\u0010\u0006\u001a\u00020\u00052\u0006\u0010\u0007\u001a\u00020\bR\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006\t"}, d2 = {"Lcom/yambi/call/CallHistoryDatabase$Companion;", "", "<init>", "()V", "INSTANCE", "Lcom/yambi/call/CallHistoryDatabase;", "getInstance", "context", "Landroid/content/Context;", "yambi-call_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.yambi.call.CallHistoryDatabase getInstance(@org.jetbrains.annotations.NotNull()
        android.content.Context context) {
            return null;
        }
    }
}
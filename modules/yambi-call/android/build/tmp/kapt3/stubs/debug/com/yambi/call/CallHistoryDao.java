package com.yambi.call;

@kotlin.Metadata(mv = {2, 1, 0}, k = 1, xi = 48, d1 = {"\u00000\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\t\n\u0002\b\u0002\bg\u0018\u00002\u00020\u0001J\u0016\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u0005H\u00a7@\u00a2\u0006\u0002\u0010\u0006J\u0014\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\u00050\bH\u00a7@\u00a2\u0006\u0002\u0010\tJ\u001c\u0010\n\u001a\u00020\u00032\f\u0010\u000b\u001a\b\u0012\u0004\u0012\u00020\f0\bH\u00a7@\u00a2\u0006\u0002\u0010\rJ\u0014\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00050\bH\u00a7@\u00a2\u0006\u0002\u0010\tJ\u0016\u0010\u000f\u001a\u00020\u00032\u0006\u0010\u0010\u001a\u00020\u0011H\u00a7@\u00a2\u0006\u0002\u0010\u0012\u00a8\u0006\u0013"}, d2 = {"Lcom/yambi/call/CallHistoryDao;", "", "insert", "", "entry", "Lcom/yambi/call/CallHistoryEntity;", "(Lcom/yambi/call/CallHistoryEntity;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getUnsynced", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "markSynced", "ids", "", "(Ljava/util/List;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getAll", "pruneOldSynced", "cutoff", "", "(JLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "yambi-call_debug"})
@androidx.room.Dao()
public abstract interface CallHistoryDao {
    
    @androidx.room.Insert(onConflict = 1)
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object insert(@org.jetbrains.annotations.NotNull()
    com.yambi.call.CallHistoryEntity entry, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    /**
     * Retourne toutes les entrées non encore synchronisées avec Realm
     */
    @androidx.room.Query(value = "SELECT * FROM call_history WHERE syncedToRealm = 0 ORDER BY timestamp ASC")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getUnsynced(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.util.List<com.yambi.call.CallHistoryEntity>> $completion);
    
    /**
     * Marque les entrées comme synchronisées (appelé par CallManager.ts après sync Realm)
     */
    @androidx.room.Query(value = "UPDATE call_history SET syncedToRealm = 1 WHERE id IN (:ids)")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object markSynced(@org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> ids, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    /**
     * Toutes les entrées, pour debug
     */
    @androidx.room.Query(value = "SELECT * FROM call_history ORDER BY timestamp DESC LIMIT 200")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getAll(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super java.util.List<com.yambi.call.CallHistoryEntity>> $completion);
    
    /**
     * Supprime les entrées déjà synchronisées de plus de 30 jours
     */
    @androidx.room.Query(value = "DELETE FROM call_history WHERE syncedToRealm = 1 AND timestamp < :cutoff")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object pruneOldSynced(long cutoff, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
}
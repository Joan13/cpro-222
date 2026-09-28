package com.yambi.call

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

// ──────────────────────────────────────────────────────────────────────────────
// Entité — miroir du schéma Realm CallHistory côté JS
// ──────────────────────────────────────────────────────────────────────────────

data class CallHistoryEntity(
    val id: String,                 // "hist_${callId}"
    val callId: String,
    val callerId: String,
    val calleeId: String,
    val callerName: String,
    val callerAvatar: String,
    val calleeName: String,
    val calleeAvatar: String,
    val type: String,               // "audio" | "video"
    val direction: String,          // "incoming" | "outgoing" | "missed" | "rejected"
    val status: String,
    val durationSeconds: Int,
    val createdAt: String,          // ISO 8601
    val timestamp: Long,
    val syncedToRealm: Int = 0      // 0 = en attente, 1 = synchronisé
) {
    /** Convertit en Map compatible avec l'interface TypeScript NativeCallHistoryEntry */
    fun toMap(): Map<String, Any?> = mapOf(
        "id"              to id,
        "callId"          to callId,
        "callerId"        to callerId,
        "calleeId"        to calleeId,
        "callerName"      to callerName,
        "callerAvatar"    to callerAvatar,
        "calleeName"      to calleeName,
        "calleeAvatar"    to calleeAvatar,
        "type"            to type,
        "direction"       to direction,
        "status"          to status,
        "durationSeconds" to durationSeconds,
        "createdAt"       to createdAt,
        "timestamp"       to timestamp
    )
}

// ──────────────────────────────────────────────────────────────────────────────
// DAO interface compatible
// ──────────────────────────────────────────────────────────────────────────────

interface CallHistoryDao {
    fun insert(entry: CallHistoryEntity)
    fun getUnsynced(): List<CallHistoryEntity>
    fun markSynced(ids: List<String>)
    fun getById(id: String): CallHistoryEntity?
}

// ──────────────────────────────────────────────────────────────────────────────
// Implémentation SQLite native via SQLiteOpenHelper (100% stable avec Kotlin 2.1+)
// ──────────────────────────────────────────────────────────────────────────────

class CallHistoryDatabase private constructor(context: Context) :
    SQLiteOpenHelper(context.applicationContext, DB_NAME, null, DB_VERSION) {

    companion object {
        private const val DB_NAME = "yambi_call_history.db"
        private const val DB_VERSION = 1
        private const val TABLE_NAME = "call_history"

        @Volatile
        private var INSTANCE: CallHistoryDatabase? = null

        fun getInstance(context: Context): CallHistoryDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: CallHistoryDatabase(context.applicationContext).also { INSTANCE = it }
            }
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS $TABLE_NAME (
                id TEXT PRIMARY KEY NOT NULL,
                callId TEXT NOT NULL,
                callerId TEXT NOT NULL,
                calleeId TEXT NOT NULL,
                callerName TEXT NOT NULL,
                callerAvatar TEXT NOT NULL,
                calleeName TEXT NOT NULL,
                calleeAvatar TEXT NOT NULL,
                type TEXT NOT NULL,
                direction TEXT NOT NULL,
                status TEXT NOT NULL,
                durationSeconds INTEGER NOT NULL,
                createdAt TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                syncedToRealm INTEGER NOT NULL DEFAULT 0
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Migration future si nécessaire
    }

    private val daoImpl = object : CallHistoryDao {
        override fun insert(entry: CallHistoryEntity) {
            val db = writableDatabase
            val values = ContentValues().apply {
                put("id", entry.id)
                put("callId", entry.callId)
                put("callerId", entry.callerId)
                put("calleeId", entry.calleeId)
                put("callerName", entry.callerName)
                put("callerAvatar", entry.callerAvatar)
                put("calleeName", entry.calleeName)
                put("calleeAvatar", entry.calleeAvatar)
                put("type", entry.type)
                put("direction", entry.direction)
                put("status", entry.status)
                put("durationSeconds", entry.durationSeconds)
                put("createdAt", entry.createdAt)
                put("timestamp", entry.timestamp)
                put("syncedToRealm", entry.syncedToRealm)
            }
            db.insertWithOnConflict(TABLE_NAME, null, values, SQLiteDatabase.CONFLICT_REPLACE)
        }

        override fun getUnsynced(): List<CallHistoryEntity> {
            val db = readableDatabase
            val cursor = db.query(
                TABLE_NAME,
                null,
                "syncedToRealm = 0",
                null,
                null,
                null,
                "timestamp ASC"
            )
            val list = mutableListOf<CallHistoryEntity>()
            cursor.use { c ->
                val idIdx = c.getColumnIndexOrThrow("id")
                val callIdIdx = c.getColumnIndexOrThrow("callId")
                val callerIdIdx = c.getColumnIndexOrThrow("callerId")
                val calleeIdIdx = c.getColumnIndexOrThrow("calleeId")
                val callerNameIdx = c.getColumnIndexOrThrow("callerName")
                val callerAvatarIdx = c.getColumnIndexOrThrow("callerAvatar")
                val calleeNameIdx = c.getColumnIndexOrThrow("calleeName")
                val calleeAvatarIdx = c.getColumnIndexOrThrow("calleeAvatar")
                val typeIdx = c.getColumnIndexOrThrow("type")
                val directionIdx = c.getColumnIndexOrThrow("direction")
                val statusIdx = c.getColumnIndexOrThrow("status")
                val durIdx = c.getColumnIndexOrThrow("durationSeconds")
                val createdIdx = c.getColumnIndexOrThrow("createdAt")
                val timeIdx = c.getColumnIndexOrThrow("timestamp")
                val syncIdx = c.getColumnIndexOrThrow("syncedToRealm")

                while (c.moveToNext()) {
                    list.add(
                        CallHistoryEntity(
                            id = c.getString(idIdx),
                            callId = c.getString(callIdIdx),
                            callerId = c.getString(callerIdIdx),
                            calleeId = c.getString(calleeIdIdx),
                            callerName = c.getString(callerNameIdx),
                            callerAvatar = c.getString(callerAvatarIdx),
                            calleeName = c.getString(calleeNameIdx),
                            calleeAvatar = c.getString(calleeAvatarIdx),
                            type = c.getString(typeIdx),
                            direction = c.getString(directionIdx),
                            status = c.getString(statusIdx),
                            durationSeconds = c.getInt(durIdx),
                            createdAt = c.getString(createdIdx),
                            timestamp = c.getLong(timeIdx),
                            syncedToRealm = c.getInt(syncIdx)
                        )
                    )
                }
            }
            return list
        }

        override fun markSynced(ids: List<String>) {
            if (ids.isEmpty()) return
            val db = writableDatabase
            val placeholders = ids.joinToString(",") { "?" }
            val values = ContentValues().apply {
                put("syncedToRealm", 1)
            }
            db.update(TABLE_NAME, values, "id IN ($placeholders)", ids.toTypedArray())
        }

        override fun getById(id: String): CallHistoryEntity? {
            val db = readableDatabase
            val cursor = db.query(TABLE_NAME, null, "id = ?", arrayOf(id), null, null, null)
            return cursor.use { c ->
                if (c.moveToFirst()) {
                    CallHistoryEntity(
                        id = c.getString(c.getColumnIndexOrThrow("id")),
                        callId = c.getString(c.getColumnIndexOrThrow("callId")),
                        callerId = c.getString(c.getColumnIndexOrThrow("callerId")),
                        calleeId = c.getString(c.getColumnIndexOrThrow("calleeId")),
                        callerName = c.getString(c.getColumnIndexOrThrow("callerName")),
                        callerAvatar = c.getString(c.getColumnIndexOrThrow("callerAvatar")),
                        calleeName = c.getString(c.getColumnIndexOrThrow("calleeName")),
                        calleeAvatar = c.getString(c.getColumnIndexOrThrow("calleeAvatar")),
                        type = c.getString(c.getColumnIndexOrThrow("type")),
                        direction = c.getString(c.getColumnIndexOrThrow("direction")),
                        status = c.getString(c.getColumnIndexOrThrow("status")),
                        durationSeconds = c.getInt(c.getColumnIndexOrThrow("durationSeconds")),
                        createdAt = c.getString(c.getColumnIndexOrThrow("createdAt")),
                        timestamp = c.getLong(c.getColumnIndexOrThrow("timestamp")),
                        syncedToRealm = c.getInt(c.getColumnIndexOrThrow("syncedToRealm"))
                    )
                } else null
            }
        }
    }

    fun dao(): CallHistoryDao = daoImpl
}

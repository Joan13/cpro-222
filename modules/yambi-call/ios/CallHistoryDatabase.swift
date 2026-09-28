import Foundation
import GRDB

public struct CallHistoryRecord: Codable, FetchableRecord, PersistableRecord {
    public static let databaseTableName = "call_history"

    public var id: String
    public var callId: String
    public var callerId: String
    public var calleeId: String
    public var callerName: String
    public var callerAvatar: String
    public var calleeName: String
    public var calleeAvatar: String
    public var type: String
    public var direction: String
    public var status: String
    public var durationSeconds: Int
    public var createdAt: String
    public var timestamp: Int64
    public var syncedToRealm: Int

    public init(
        id: String,
        callId: String,
        callerId: String,
        calleeId: String,
        callerName: String,
        callerAvatar: String,
        calleeName: String,
        calleeAvatar: String,
        type: String,
        direction: String,
        status: String,
        durationSeconds: Int,
        createdAt: String,
        timestamp: Int64,
        syncedToRealm: Int = 0
    ) {
        self.id = id
        self.callId = callId
        self.callerId = callerId
        self.calleeId = calleeId
        self.callerName = callerName
        self.callerAvatar = callerAvatar
        self.calleeName = calleeName
        self.calleeAvatar = calleeAvatar
        self.type = type
        self.direction = direction
        self.status = status
        self.durationSeconds = durationSeconds
        self.createdAt = createdAt
        self.timestamp = timestamp
        self.syncedToRealm = syncedToRealm
    }

    public func toDictionary() -> [String: Any] {
        return [
            "id": id,
            "callId": callId,
            "callerId": callerId,
            "calleeId": calleeId,
            "callerName": callerName,
            "callerAvatar": callerAvatar,
            "calleeName": calleeName,
            "calleeAvatar": calleeAvatar,
            "type": type,
            "direction": direction,
            "status": status,
            "durationSeconds": durationSeconds,
            "createdAt": createdAt,
            "timestamp": timestamp,
            "syncedToRealm": syncedToRealm
        ]
    }
}

public class CallHistoryDatabase {
    public static let shared = CallHistoryDatabase()

    private var dbQueue: DatabaseQueue?

    private init() {
        setupDatabase()
    }

    private func setupDatabase() {
        do {
            let fileManager = FileManager.default
            let documentsURL = try fileManager.url(
                for: .documentDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: true
            )
            let databaseURL = documentsURL.appendingPathComponent("yambi_call_history.sqlite")

            dbQueue = try DatabaseQueue(path: databaseURL.path)

            try dbQueue?.write { db in
                try db.create(table: "call_history", ifNotExists: true) { t in
                    t.column("id", .text).primaryKey()
                    t.column("callId", .text).notNull()
                    t.column("callerId", .text).notNull()
                    t.column("calleeId", .text).notNull()
                    t.column("callerName", .text).notNull()
                    t.column("callerAvatar", .text).notNull()
                    t.column("calleeName", .text).notNull()
                    t.column("calleeAvatar", .text).notNull()
                    t.column("type", .text).notNull()
                    t.column("direction", .text).notNull()
                    t.column("status", .text).notNull()
                    t.column("durationSeconds", .integer).notNull()
                    t.column("createdAt", .text).notNull()
                    t.column("timestamp", .integer).notNull()
                    t.column("syncedToRealm", .integer).notNull().defaults(to: 0)
                }
            }
            NSLog("[YAMBI_CALL_DB] Initialized database at %@", databaseURL.path)
        } catch {
            NSLog("[YAMBI_CALL_DB] Error initializing database: %@", error.localizedDescription)
        }
    }

    public func save(_ record: CallHistoryRecord) {
        do {
            try dbQueue?.write { db in
                try record.save(db)
            }
            NSLog("[YAMBI_CALL_DB] Saved call record %@", record.id)
        } catch {
            NSLog("[YAMBI_CALL_DB] Error saving call record: %@", error.localizedDescription)
        }
    }

    public func getUnsynced() -> [[String: Any]] {
        do {
            return try dbQueue?.read { db in
                let records = try CallHistoryRecord
                    .filter(Column("syncedToRealm") == 0)
                    .order(Column("timestamp").asc)
                    .fetchAll(db)
                return records.map { $0.toDictionary() }
            } ?? []
        } catch {
            NSLog("[YAMBI_CALL_DB] Error getting unsynced records: %@", error.localizedDescription)
            return []
        }
    }

    public func markSynced(ids: [String]) {
        guard !ids.isEmpty else { return }
        do {
            try dbQueue?.write { db in
                try db.execute(
                    sql: "UPDATE call_history SET syncedToRealm = 1 WHERE id IN (\(ids.map { "'\($0)'" }.joined(separator: ",")))"
                )
            }
            NSLog("[YAMBI_CALL_DB] Marked %d records as synced", ids.count)
        } catch {
            NSLog("[YAMBI_CALL_DB] Error marking records synced: %@", error.localizedDescription)
        }
    }
}

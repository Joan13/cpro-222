package com.yambi.call

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.util.Collections

/**
 * NativeSignalingManager — Gestionnaire de signalisation Socket.IO pour les appels Yambi.
 *
 * Gère la connexion Socket.IO vers https://server.yambi.net/ws et tous les événements
 * de signaling d'appel (écoute globale + ciblée par numéro de téléphone).
 *
 * Inclut une file d'attente (pendingEmitQueue) pour garantir qu'aucun message (notamment
 * call:accept, call:offer, call:answer) n'est perdu si la connexion socket est en cours d'établissement.
 */
class NativeSignalingManager private constructor() {

    companion object {
        private const val TAG = "[YAMBI_SIGNALING]"
        val instance = NativeSignalingManager()

        private const val EV_ASSEMBLE = "assemble"
        private const val EV_INVITE   = "call:invite"
        private const val EV_RINGING  = "call:ringing"
        private const val EV_ACCEPT   = "call:accept"
        private const val EV_REJECT   = "call:reject"
        private const val EV_CANCEL   = "call:cancel"
        private const val EV_BUSY     = "call:busy"
        private const val EV_OFFER    = "call:offer"
        private const val EV_ANSWER   = "call:answer"
        private const val EV_ICE      = "call:ice-candidate"
        private const val EV_END      = "call:end"
        private const val EV_VIDEO_STATE = "call:video-state"
        private const val SERVER_URL  = "https://server.yambi.net"
        private const val SERVER_PATH = "/ws"

        fun cleanPhone(phone: String?): String =
            phone?.replace("\\D".toRegex(), "") ?: ""

        fun phoneMatches(p1: String?, p2: String?): Boolean {
            val c1 = cleanPhone(p1)
            val c2 = cleanPhone(p2)
            if (c1.isEmpty() || c2.isEmpty()) return false
            return c1 == c2 || c1.endsWith(c2) || c2.endsWith(c1)
        }
    }

    private var socket: Socket? = null
    private var userPhone: String = ""
    private var isConnected: Boolean = false

    // File d'attente thread-safe pour les messages émis avant la fin du handshake Socket.IO
    private val pendingEmitQueue = Collections.synchronizedList(mutableListOf<Pair<String, JSONObject>>())

    // Déduplication des événements reçus (pour éviter le double traitement accept/offer/answer/ice)
    private val handledSignalingEvents = Collections.synchronizedSet(LinkedHashSet<String>())

    private fun isDuplicateEvent(key: String): Boolean {
        synchronized(handledSignalingEvents) {
            if (handledSignalingEvents.contains(key)) return true
            if (handledSignalingEvents.size > 300) {
                val iter = handledSignalingEvents.iterator()
                if (iter.hasNext()) { iter.next(); iter.remove() }
            }
            handledSignalingEvents.add(key)
            return false
        }
    }

    // Callbacks vers l'Activity
    var onCallAccepted:  ((callId: String) -> Unit)? = null
    var onCallRinging:   ((callId: String) -> Unit)? = null
    var onCallRejected:  ((callId: String) -> Unit)? = null
    var onCallCancelled: ((callId: String) -> Unit)? = null
    var onCallBusy:      ((callId: String) -> Unit)? = null
    var onOffer:         ((callId: String, sdp: String, type: String) -> Unit)? = null
    var onAnswer:        ((callId: String, sdp: String, type: String) -> Unit)? = null
    var onIceCandidate:  ((callId: String, candidate: String, sdpMid: String?, sdpMLineIndex: Int) -> Unit)? = null
    var onCallEnd:       ((callId: String) -> Unit)? = null
    var onVideoStateChanged: ((callId: String, enabled: Boolean) -> Unit)? = null

    fun connect(userPhone: String) {
        val clean = cleanPhone(userPhone)
        if (this.userPhone.isNotBlank() && phoneMatches(this.userPhone, userPhone) && socket?.connected() == true) {
            Log.d(TAG, "Already connected for $userPhone — reassembling")
            emitAssemble(userPhone)
            return
        }
        this.userPhone = userPhone
        disconnectInternal()
        try {
            val options = IO.Options().apply {
                path = SERVER_PATH
                transports = arrayOf("websocket")
                reconnection = true
                reconnectionAttempts = 30
                reconnectionDelay = 1000
                timeout = 15_000
            }
            val newSocket = IO.socket(SERVER_URL, options)
            setupSystemListeners(newSocket)
            setupCallEventListeners(newSocket)
            socket = newSocket
            newSocket.connect()
            Log.d(TAG, "Connecting to $SERVER_URL for user $userPhone (clean: $clean)")
        } catch (e: Exception) {
            Log.e(TAG, "Error connecting socket: ${e.message}")
        }
    }

    private fun emitAssemble(phone: String) {
        val s = socket ?: return
        val clean = cleanPhone(phone)
        s.emit(EV_ASSEMBLE, phone)
        if (clean.isNotBlank() && clean != phone) {
            s.emit(EV_ASSEMBLE, clean)
        }
        s.emit(EV_ASSEMBLE, "room$phone")
        if (clean.isNotBlank() && clean != phone) {
            s.emit(EV_ASSEMBLE, "room$clean")
        }
        Log.d(TAG, "Assembled as $phone (and clean: $clean, room: room$clean)")
    }

    private fun setupSystemListeners(s: Socket) {
        s.on(Socket.EVENT_CONNECT) {
            isConnected = true
            Log.d(TAG, "Socket CONNECTED — assembling")
            emitAssemble(userPhone)
            flushPendingEmits(s)
        }
        s.on(Socket.EVENT_DISCONNECT) { args ->
            isConnected = false
            Log.d(TAG, "Socket disconnected: ${args.getOrNull(0)}")
        }
        s.on(Socket.EVENT_CONNECT_ERROR) { args ->
            Log.e(TAG, "Socket connection error: ${args.getOrNull(0)}")
        }
    }

    private fun flushPendingEmits(s: Socket) {
        synchronized(pendingEmitQueue) {
            while (pendingEmitQueue.isNotEmpty()) {
                val (event, payload) = pendingEmitQueue.removeAt(0)
                try {
                    s.emit(event, payload)
                    Log.d(TAG, "Flushed queued emit -> $event")
                } catch (e: Exception) {
                    Log.e(TAG, "Error flushing emit $event: ${e.message}")
                }
            }
        }
    }

    private fun setupCallEventListeners(s: Socket) {
        val handleRinging = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                if (!isDuplicateEvent("ringing:$callId")) {
                    Log.d(TAG, "<- call:ringing callId=$callId")
                    onCallRinging?.invoke(callId)
                }
            }
        }

        val handleAccept = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                if (!isDuplicateEvent("accept:$callId")) {
                    Log.d(TAG, "<- call:accept callId=$callId")
                    onCallAccepted?.invoke(callId)
                }
            }
        }

        val handleReject = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                if (!isDuplicateEvent("reject:$callId")) {
                    Log.d(TAG, "<- call:reject callId=$callId")
                    onCallRejected?.invoke(callId)
                }
            }
        }

        val handleCancel = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                if (!isDuplicateEvent("cancel:$callId")) {
                    Log.d(TAG, "<- call:cancel callId=$callId")
                    onCallCancelled?.invoke(callId)
                }
            }
        }

        val handleBusy = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                if (!isDuplicateEvent("busy:$callId")) {
                    Log.d(TAG, "<- call:busy callId=$callId")
                    onCallBusy?.invoke(callId)
                }
            }
        }

        val handleOffer = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                val offerObj = data.optJSONObject("offer")
                    ?: try { data.optString("offer").takeIf { it.startsWith("{") }?.let { JSONObject(it) } } catch (_: Exception) { null }
                val sdp = offerObj?.optString("sdp") ?: data.optString("sdp")
                val type = offerObj?.optString("type") ?: data.optString("type", "offer")
                if (sdp.isNotBlank() && !isDuplicateEvent("offer:$callId:${sdp.hashCode()}")) {
                    Log.d(TAG, "<- call:offer callId=$callId (type=$type)")
                    onOffer?.invoke(callId, sdp, type)
                }
            }
        }

        val handleAnswer = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                val answerObj = data.optJSONObject("answer")
                    ?: try { data.optString("answer").takeIf { it.startsWith("{") }?.let { JSONObject(it) } } catch (_: Exception) { null }
                val sdp = answerObj?.optString("sdp") ?: data.optString("sdp")
                val type = answerObj?.optString("type") ?: data.optString("type", "answer")
                if (sdp.isNotBlank() && !isDuplicateEvent("answer:$callId:${sdp.hashCode()}")) {
                    Log.d(TAG, "<- call:answer callId=$callId (type=$type)")
                    onAnswer?.invoke(callId, sdp, type)
                }
            }
        }

        val handleIce = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                val c = data.optJSONObject("candidate")
                    ?: try { data.optString("candidate").takeIf { it.startsWith("{") }?.let { JSONObject(it) } } catch (_: Exception) { null }
                val candStr = c?.optString("candidate") ?: data.optString("candidate")
                val sdpMid = c?.optString("sdpMid") ?: data.optString("sdpMid")
                val sdpMLineIndex = c?.optInt("sdpMLineIndex", 0) ?: data.optInt("sdpMLineIndex", 0)
                if (candStr.isNotBlank() && !isDuplicateEvent("ice:$callId:$candStr")) {
                    onIceCandidate?.invoke(callId, candStr, sdpMid.takeIf { it.isNotBlank() }, sdpMLineIndex)
                }
            }
        }

        val handleEnd = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                if (!isDuplicateEvent("end:$callId")) {
                    Log.d(TAG, "<- call:end callId=$callId")
                    onCallEnd?.invoke(callId)
                }
            }
        }

        val handleVideoState = { data: JSONObject ->
            val senderId = data.optString("senderId")
            if (!phoneMatches(senderId, userPhone)) {
                val callId = data.optString("callId")
                val enabled = if (data.has("enabled")) data.optBoolean("enabled", true) else !data.optBoolean("disabled", false)
                Log.d(TAG, "<- call:video-state callId=$callId enabled=$enabled sender=$senderId")
                onVideoStateChanged?.invoke(callId, enabled)
            }
        }

        // Generic event listeners
        s.on(EV_RINGING) { args -> (args.getOrNull(0) as? JSONObject)?.let(handleRinging) }
        s.on(EV_ACCEPT)  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleAccept) }
        s.on(EV_REJECT)  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleReject) }
        s.on(EV_CANCEL)  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleCancel) }
        s.on(EV_BUSY)    { args -> (args.getOrNull(0) as? JSONObject)?.let(handleBusy) }
        s.on(EV_OFFER)   { args -> (args.getOrNull(0) as? JSONObject)?.let(handleOffer) }
        s.on(EV_ANSWER)  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleAnswer) }
        s.on(EV_ICE)     { args -> (args.getOrNull(0) as? JSONObject)?.let(handleIce) }
        s.on(EV_END)     { args -> (args.getOrNull(0) as? JSONObject)?.let(handleEnd) }
        s.on(EV_VIDEO_STATE) { args -> (args.getOrNull(0) as? JSONObject)?.let(handleVideoState) }
        s.on("call:toggle-camera") { args -> (args.getOrNull(0) as? JSONObject)?.let(handleVideoState) }

        // Specific targeted event listeners
        val phoneVariants = listOf(userPhone, cleanPhone(userPhone)).filter { it.isNotBlank() }.distinct()
        for (variant in phoneVariants) {
            s.on("$EV_RINGING:$variant") { args -> (args.getOrNull(0) as? JSONObject)?.let(handleRinging) }
            s.on("$EV_ACCEPT:$variant")  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleAccept) }
            s.on("$EV_REJECT:$variant")  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleReject) }
            s.on("$EV_CANCEL:$variant")  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleCancel) }
            s.on("$EV_BUSY:$variant")    { args -> (args.getOrNull(0) as? JSONObject)?.let(handleBusy) }
            s.on("$EV_OFFER:$variant")   { args -> (args.getOrNull(0) as? JSONObject)?.let(handleOffer) }
            s.on("$EV_ANSWER:$variant")  { args -> (args.getOrNull(0) as? JSONObject)?.let(handleAnswer) }
            s.on("$EV_ICE:$variant")     { args -> (args.getOrNull(0) as? JSONObject)?.let(handleIce) }
            s.on("$EV_END:$variant")     { args -> (args.getOrNull(0) as? JSONObject)?.let(handleEnd) }
            s.on("$EV_VIDEO_STATE:$variant") { args -> (args.getOrNull(0) as? JSONObject)?.let(handleVideoState) }
            s.on("call:toggle-camera:$variant") { args -> (args.getOrNull(0) as? JSONObject)?.let(handleVideoState) }
        }
    }

    // ─── Émissions ─────────────────────────────────────────────────────────────

    fun sendInvite(callId: String, callerId: String, calleeId: String, callerName: String, callerAvatar: String, callType: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("callerName", callerName)
            put("callerAvatar", callerAvatar)
            put("type", callType)
            put("timestamp", System.currentTimeMillis())
            put("senderId", userPhone)
        }
        emitSafely(EV_INVITE, payload)
        emitSafely("$EV_INVITE:$calleeId", payload)
        val cleanCallee = cleanPhone(calleeId)
        if (cleanCallee.isNotBlank() && cleanCallee != calleeId) {
            emitSafely("$EV_INVITE:$cleanCallee", payload)
        }
    }

    fun sendRinging(callId: String, callerId: String, calleeId: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("target", callerId)
            put("senderId", userPhone)
        }
        emitSafely(EV_RINGING, payload)
        emitSafely("$EV_RINGING:$callerId", payload)
        val cleanCaller = cleanPhone(callerId)
        if (cleanCaller.isNotBlank() && cleanCaller != callerId) {
            emitSafely("$EV_RINGING:$cleanCaller", payload)
        }
    }

    fun sendAccept(callId: String, callerId: String, calleeId: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("senderId", userPhone)
        }
        emitSafely(EV_ACCEPT, payload)
        emitSafely("$EV_ACCEPT:$callerId", payload)
        val cleanCaller = cleanPhone(callerId)
        if (cleanCaller.isNotBlank() && cleanCaller != callerId) {
            emitSafely("$EV_ACCEPT:$cleanCaller", payload)
        }
    }

    fun sendReject(callId: String, callerId: String, calleeId: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("senderId", userPhone)
        }
        emitSafely(EV_REJECT, payload)
        emitSafely("$EV_REJECT:$callerId", payload)
        val cleanCaller = cleanPhone(callerId)
        if (cleanCaller.isNotBlank() && cleanCaller != callerId) {
            emitSafely("$EV_REJECT:$cleanCaller", payload)
        }
    }

    fun sendCancel(callId: String, callerId: String, calleeId: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("senderId", userPhone)
        }
        emitSafely(EV_CANCEL, payload)
        emitSafely("$EV_CANCEL:$calleeId", payload)
        val cleanCallee = cleanPhone(calleeId)
        if (cleanCallee.isNotBlank() && cleanCallee != calleeId) {
            emitSafely("$EV_CANCEL:$cleanCallee", payload)
        }
    }

    fun sendBusy(callId: String, callerId: String, calleeId: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("senderId", userPhone)
        }
        emitSafely(EV_BUSY, payload)
        emitSafely("$EV_BUSY:$callerId", payload)
        val cleanCaller = cleanPhone(callerId)
        if (cleanCaller.isNotBlank() && cleanCaller != callerId) {
            emitSafely("$EV_BUSY:$cleanCaller", payload)
        }
    }

    fun sendOffer(callId: String, callerId: String, calleeId: String, sdp: String, sdpType: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("offer", JSONObject().put("type", sdpType).put("sdp", sdp))
            put("sdp", sdp)
            put("type", sdpType)
            put("senderId", userPhone)
        }
        emitSafely(EV_OFFER, payload)
        val target = if (phoneMatches(userPhone, callerId)) calleeId else callerId
        emitSafely("$EV_OFFER:$target", payload)
        val cleanTarget = cleanPhone(target)
        if (cleanTarget.isNotBlank() && cleanTarget != target) {
            emitSafely("$EV_OFFER:$cleanTarget", payload)
        }
    }

    fun sendAnswer(callId: String, callerId: String, calleeId: String, sdp: String, sdpType: String) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("answer", JSONObject().put("type", sdpType).put("sdp", sdp))
            put("sdp", sdp)
            put("type", sdpType)
            put("senderId", userPhone)
        }
        emitSafely(EV_ANSWER, payload)
        val target = if (phoneMatches(userPhone, callerId)) calleeId else callerId
        emitSafely("$EV_ANSWER:$target", payload)
        val cleanTarget = cleanPhone(target)
        if (cleanTarget.isNotBlank() && cleanTarget != target) {
            emitSafely("$EV_ANSWER:$cleanTarget", payload)
        }
    }

    fun sendIceCandidate(callId: String, callerId: String, calleeId: String, candidate: String, sdpMid: String?, sdpMLineIndex: Int) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("candidate", JSONObject().put("candidate", candidate).put("sdpMid", sdpMid ?: "").put("sdpMLineIndex", sdpMLineIndex))
            put("senderId", userPhone)
        }
        emitSafely(EV_ICE, payload)
        val target = if (phoneMatches(userPhone, callerId)) calleeId else callerId
        emitSafely("$EV_ICE:$target", payload)
        val cleanTarget = cleanPhone(target)
        if (cleanTarget.isNotBlank() && cleanTarget != target) {
            emitSafely("$EV_ICE:$cleanTarget", payload)
        }
    }

    fun sendEnd(callId: String, callerId: String, calleeId: String, duration: Int) {
        val payload = buildJson {
            put("callId", callId)
            put("callerId", callerId)
            put("calleeId", calleeId)
            put("duration", duration)
            put("senderId", userPhone)
        }
        emitSafely(EV_END, payload)
        val target = if (phoneMatches(userPhone, callerId)) calleeId else callerId
        emitSafely("$EV_END:$target", payload)
        val cleanTarget = cleanPhone(target)
        if (cleanTarget.isNotBlank() && cleanTarget != target) {
            emitSafely("$EV_END:$cleanTarget", payload)
        }
    }

    fun sendVideoState(callId: String, targetPhone: String, enabled: Boolean) {
        val payload = buildJson {
            put("callId", callId)
            put("target", targetPhone)
            put("calleeId", targetPhone)
            put("callerId", userPhone)
            put("senderId", userPhone)
            put("enabled", enabled)
            put("disabled", !enabled)
        }
        emitSafely(EV_VIDEO_STATE, payload)
        emitSafely("$EV_VIDEO_STATE:$targetPhone", payload)
        val cleanTarget = cleanPhone(targetPhone)
        if (cleanTarget.isNotBlank() && cleanTarget != targetPhone) {
            emitSafely("$EV_VIDEO_STATE:$cleanTarget", payload)
        }
        emitSafely("call:toggle-camera", payload)
        emitSafely("call:toggle-camera:$targetPhone", payload)
        if (cleanTarget.isNotBlank() && cleanTarget != targetPhone) {
            emitSafely("call:toggle-camera:$cleanTarget", payload)
        }
    }

    private fun emitSafely(event: String, payload: JSONObject) {
        val s = socket
        if (s != null && s.connected()) {
            try {
                s.emit(event, payload)
                Log.d(TAG, "-> $event (target: ${payload.optString("calleeId", payload.optString("callerId"))})")
            } catch (e: Exception) {
                Log.e(TAG, "Error emitting $event: ${e.message}")
            }
        } else {
            Log.w(TAG, "Socket not connected yet — queuing emit for $event")
            pendingEmitQueue.add(Pair(event, payload))
            s?.connect()
        }
    }

    private inline fun buildJson(block: JSONObject.() -> Unit): JSONObject = JSONObject().apply(block)

    fun clearCallbacks() {
        handledSignalingEvents.clear()
        onCallAccepted  = null
        onCallRinging   = null
        onCallRejected  = null
        onCallCancelled = null
        onCallBusy      = null
        onOffer         = null
        onAnswer        = null
        onIceCandidate  = null
        onCallEnd       = null
        onVideoStateChanged = null
    }

    fun getUserPhone() = userPhone
    fun isConnected() = socket?.connected() == true

    private fun disconnectInternal() {
        try {
            socket?.off()
            socket?.disconnect()
            socket = null
            isConnected = false
        } catch (e: Exception) {
            Log.e(TAG, "Error during disconnect: ${e.message}")
        }
    }

    fun disconnect() {
        disconnectInternal()
        clearCallbacks()
        pendingEmitQueue.clear()
        Log.d(TAG, "Disconnected and callbacks cleared")
    }
}

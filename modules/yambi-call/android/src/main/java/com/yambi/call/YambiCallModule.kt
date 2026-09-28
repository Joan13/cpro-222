package com.yambi.call

import android.content.Context
import android.media.AudioManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class YambiCallModule : Module() {

  companion object {
    private var instance: YambiCallModule? = null
    private var pendingCallData: Map<String, Any?>? = null

    private var localUserPhone: String = ""
    private val answeredCallIds = java.util.Collections.synchronizedSet(mutableSetOf<String>())

    fun markCallAnswered(callId: String) {
      if (callId.isNotBlank()) {
        answeredCallIds.add(callId)
      }
    }

    fun wasCallAnswered(callId: String): Boolean {
      return answeredCallIds.contains(callId)
    }

    fun setPendingCallData(data: Map<String, Any?>) { pendingCallData = data }
    fun clearPendingCallData() { pendingCallData = null }

    fun emitCallAnswered(data: Map<String, Any?>) { try { instance?.sendEvent("onCallAnswered", data) } catch (_: Exception) {} }
    fun emitCallRejected(data: Map<String, Any?>) { try { instance?.sendEvent("onCallRejected", data) } catch (_: Exception) {} }
    fun emitCallEnded(data: Map<String, Any?>)    { try { instance?.sendEvent("onCallEnded",    data) } catch (_: Exception) {} }
    fun emitCallStarted(data: Map<String, Any?>)  { try { instance?.sendEvent("onCallStarted",  data) } catch (_: Exception) {} }

    /**
     * Méthode générique d'émission vers JS — utilisée par ActiveCallActivity
     * pour notifier la fin d'appel sans passer par le bridge Expo.
     */
    fun emitToJS(event: String, data: Map<String, Any?>) {
      try {
        instance?.sendEvent(event, data)
      } catch (_: Exception) {}
    }
  }

  override fun definition() = ModuleDefinition {
    Name("YambiCall")

    Events(
      "onVoIPTokenReceived",
      "onCallStarted",
      "onCallAnswered",
      "onCallRejected",
      "onCallEnded",
      "onCallMuted"
    )

    // ─── Nouvelles fonctions pour l'architecture native ───────────────────

    OnCreate {
      instance = this@YambiCallModule
    }

    OnDestroy {
      if (instance == this@YambiCallModule) {
        instance = null
      }
    }

    Function("initialize") {
      // Ready — no-op on Android (WebRTC initialized per-call)
    }

    /**
     * Enregistre le numéro de téléphone de l'utilisateur courant.
     * Appelé par CallManager.ts au démarrage de l'app.
     */
    Function("setUserPhone") { phone: String ->
      localUserPhone = phone
      NativeSignalingManager.instance.connect(phone)
    }

    Function("setCallStrings") { strings: Map<String, String> ->
      val context = appContext.reactContext ?: return@Function
      val prefs = context.getSharedPreferences("yambi_call_prefs", Context.MODE_PRIVATE)
      prefs.edit().apply {
        for ((key, value) in strings) {
          putString("str_$key", value)
        }
        apply()
      }
    }

    AsyncFunction("isCallActive") {
      IncomingCallActivity.isCallActive()
    }

    /**
     * Lance un appel sortant natif vers la callee.
     * Retourne le callId généré.
     */
    AsyncFunction("startOutgoingCall") { options: Map<String, Any?> ->
      if (IncomingCallActivity.isCallActive()) {
        android.util.Log.w("YambiCallModule", "Cannot start outgoing call: a call is already active")
        return@AsyncFunction null
      }
      val context = appContext.reactContext ?: return@AsyncFunction null
      val calleeId    = options["calleeId"]    as? String ?: return@AsyncFunction null
      val calleeName  = options["calleeName"]  as? String ?: calleeId
      val calleeAvatar= options["calleeAvatar"]as? String ?: ""
      val callType    = options["callType"]    as? String ?: "audio"
      val callerId    = options["callerId"]    as? String ?: localUserPhone
      val callerName  = options["callerName"]  as? String ?: ""
      val callerAvatar= options["callerAvatar"]as? String ?: ""

      val callId = "call_${System.currentTimeMillis()}_${(1000..9999).random()}"
      markCallAnswered(callId)

      val intent = IncomingCallActivity.buildLaunchIntent(
        context   = context,
        callId    = callId,
        callerId  = callerId,
        calleeId  = calleeId,
        callerName  = callerName,
        callerAvatar= callerAvatar,
        calleeName  = calleeName,
        calleeAvatar= calleeAvatar,
        callType  = callType,
        isCaller  = true,
        userPhone = callerId
      )
      context.startActivity(intent)
      emitCallStarted(mapOf(
        "callId" to callId,
        "callerId" to callerId,
        "calleeId" to calleeId,
        "type" to callType
      ))
      callId
    }

    /**
     * Retourne true si l'appel a été décroché ou était actif sur cet appareil.
     */
    AsyncFunction("wasCallAnswered") { callId: String ->
      if (wasCallAnswered(callId)) return@AsyncFunction true
      val context = appContext.reactContext ?: return@AsyncFunction false
      val entry = CallHistoryDatabase.getInstance(context).dao().getById("hist_$callId")
      if (entry != null) {
        entry.direction == "incoming" || entry.direction == "outgoing" || entry.durationSeconds > 0 || entry.status == "ENDED"
      } else {
        false
      }
    }

    /**
     * Retourne les entrées de l'historique d'appels non encore synchronisées
     * avec Realm (syncedToRealm = 0).
     */
    AsyncFunction("getUnsyncedCallHistory") { ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any?>>()
      val db = CallHistoryDatabase.getInstance(context)
      db.dao().getUnsynced().map { it.toMap() }
    }

    /**
     * Marque les entrées comme synchronisées après leur insertion dans Realm.
     */
    AsyncFunction("markCallHistorySynced") { ids: List<String> ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val db = CallHistoryDatabase.getInstance(context)
      db.dao().markSynced(ids)
    }

    AsyncFunction("getPendingCall") {
      pendingCallData
    }

    AsyncFunction("clearPendingCall") {
      pendingCallData = null
    }

    AsyncFunction("reportIncomingCall") { options: Map<String, Any?> ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val callId = options["callId"] as? String ?: ""
      val callerId = options["callerId"] as? String ?: ""
      val calleeId = options["calleeId"] as? String ?: ""
      val callerName = options["callerName"] as? String ?: callerId
      val callerAvatar = options["callerAvatar"] as? String
      val rawType = (options["callType"] as? String)
        ?: (options["type"] as? String)
        ?: ""
      val hasVideo = (options["hasVideo"] as? Boolean) == true
        || rawType.equals("video", ignoreCase = true)
      val callType = if (hasVideo) "video" else "audio"
      val isVerified = (options["isVerified"] as? Boolean) == true

      YambiCallService.start(
        context,
        callId,
        callerId,
        callerName,
        callerAvatar,
        callType,
        isVerified,
        calleeId
      )

      val intent = IncomingCallActivity.buildLaunchIntent(
        context      = context,
        callId       = callId,
        callerId     = callerId,
        calleeId     = calleeId,
        callerName   = callerName,
        callerAvatar = callerAvatar ?: "",
        calleeName   = calleeId,
        calleeAvatar = "",
        callType     = callType,
        isCaller     = false,
        userPhone    = calleeId
      )
      try {
        context.startActivity(intent)
        emitCallStarted(mapOf(
          "callId" to callId,
          "callerId" to callerId,
          "calleeId" to calleeId,
          "type" to callType
        ))
      } catch (e: Exception) {
        android.util.Log.e("YambiCallModule", "Error starting IncomingCallActivity: ${e.message}")
      }
    }

    AsyncFunction("reportOutgoingCall") { callId: String, calleeName: String, hasVideo: Boolean ->
      // Outgoing call reported
    }

    AsyncFunction("reportCallConnected") { callId: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      IncomingCallNotificationManager.dismissNotification(context, callId)
      YambiCallService.stop(context)
    }

    AsyncFunction("reportCallEnded") { callId: String, reason: String? ->
      val context = appContext.reactContext ?: return@AsyncFunction
      IncomingCallNotificationManager.dismissNotification(context, callId)
      YambiCallService.stop(context)
      IncomingCallActivity.finishCurrent(callId)
      pendingCallData = null
    }

    AsyncFunction("setMuted") { callId: String, muted: Boolean ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      audioManager?.isMicrophoneMute = muted
      sendEvent("onCallMuted", mapOf("isMuted" to muted))
    }

    AsyncFunction("setSpeaker") { callId: String, enabled: Boolean ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      audioManager?.mode = AudioManager.MODE_IN_COMMUNICATION
      audioManager?.isSpeakerphoneOn = enabled
    }

    AsyncFunction("dismissNotification") { callId: String? ->
      val context = appContext.reactContext ?: return@AsyncFunction
      IncomingCallNotificationManager.dismissNotification(context, callId)
      YambiCallService.stop(context)
    }

    AsyncFunction("startRingtone") {
      val context = appContext.reactContext
      if (context != null) {
        IncomingCallNotificationManager.startRinging(context)
      }
    }

    AsyncFunction("stopRingtone") {
      IncomingCallNotificationManager.stopRinging()
    }
  }
}

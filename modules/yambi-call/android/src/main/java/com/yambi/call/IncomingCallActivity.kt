package com.yambi.call

import android.app.Activity
import android.app.KeyguardManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.Icon
import android.view.ViewOutlineProvider
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.TextUtils
import android.util.Log
import android.util.Rational
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.webrtc.PeerConnection
import org.webrtc.RendererCommon
import org.webrtc.SurfaceViewRenderer
import org.webrtc.VideoTrack
import java.lang.ref.WeakReference
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors

/**
 * IncomingCallActivity — Écran d'appel natif unique (audio + vidéo, entrant + sortant).
 *
 * Conserve 100% de la charte visuelle premium :
 *  - Photo de profil du correspondant en arrière-plan plein écran avec assombrissement sombre (#A6000000)
 *  - Avatar circulaire centré avec contour vert/accent
 *  - Nom du correspondant et badge vérifié
 *  - Sous-titre dynamique (statut initial -> "Connexion..." -> chronomètre "00:01"...)
 *  - Au décrochage : métamorphose fluide des boutons en contrôles d'appel (Muet, Haut-parleur, Caméra, Raccrocher)
 *    sur le MÊME écran sans aucune transition d'activité.
 */
class IncomingCallActivity : Activity() {

    companion object {
        private const val TAG = "[YAMBI_CALL_UI]"
        const val ACTION_DISMISS_INCOMING_CALL = "com.yambi.call.ACTION_DISMISS_INCOMING_CALL"
        const val ACTION_PIP_TOGGLE_MIC = "com.yambi.call.ACTION_PIP_TOGGLE_MIC"
        const val ACTION_PIP_END_CALL = "com.yambi.call.ACTION_PIP_END_CALL"
        private const val REQUEST_CODE_PIP_MIC = 201
        private const val REQUEST_CODE_PIP_END = 202
        private const val OUTGOING_TIMEOUT_MS = 45_000L
        private const val INCOMING_TIMEOUT_MS = 60_000L

        private var activeActivityRef: WeakReference<IncomingCallActivity>? = null

        fun finishCurrent(targetCallId: String? = null) {
            Handler(Looper.getMainLooper()).post {
                activeActivityRef?.get()?.let { activity ->
                    if (!activity.isFinishing && !activity.isDestroyed) {
                        if (targetCallId.isNullOrEmpty() || activity.callId.isEmpty() || activity.callId == targetCallId) {
                            activity.finish()
                        }
                    }
                }
            }
        }

        fun isCallActive(): Boolean {
            val activity = activeActivityRef?.get()
            val isActivityActive = activity != null && !activity.isFinishing && !activity.isDestroyed
            return isActivityActive || YambiCallService.activeSession != null
        }

        fun buildLaunchIntent(
            context: Context,
            callId: String,
            callerId: String,
            calleeId: String,
            callerName: String,
            callerAvatar: String,
            calleeName: String,
            calleeAvatar: String,
            callType: String,
            isCaller: Boolean,
            userPhone: String
        ): Intent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("callId", callId)
            putExtra("callerId", callerId)
            putExtra("calleeId", calleeId)
            putExtra("callerName", callerName)
            putExtra("callerAvatar", callerAvatar)
            putExtra("calleeName", calleeName)
            putExtra("calleeAvatar", calleeAvatar)
            putExtra("callType", callType)
            putExtra("isCaller", isCaller)
            putExtra("userPhone", userPhone)
        }
    }

    // ─── Données d'appel ──────────────────────────────────────────────────────
    private var callId: String = ""
    private var callerId: String = ""
    private var calleeId: String = ""
    private var callerName: String = ""
    private var callerAvatar: String = ""
    private var calleeName: String = ""
    private var calleeAvatar: String = ""

    private fun isValidAvatar(url: String?): Boolean {
        if (url.isNullOrBlank()) return false
        val lower = url.trim().lowercase()
        return lower != "null" && lower != "undefined" && lower != "none" && lower != "default" && !lower.endsWith("profile_black.jpg")
    }

    private fun getOtherAvatar(): String {
        val target = if (isCaller) calleeAvatar else callerAvatar
        return if (isValidAvatar(target)) target.trim() else ""
    }
    private var callType: String = "audio"
    private var isVerified: Boolean = false
    private var isCaller: Boolean = false
    private var userPhone: String = ""
    private var wasAnswered: Boolean = false

    // ─── États internes ───────────────────────────────────────────────────────
    private enum class CallState { IDLE, RINGING, CONNECTING, CONNECTED, ENDED }
    private var callState = CallState.IDLE
    private var durationSeconds = 0
    private var callConnectedTimestamp: Long = 0L
    private var isMuted = false
    private var isSpeakerOn = false
    private var isCameraOff = false

    @Volatile private var hasCreatedOffer = false
    @Volatile private var hasCreatedAnswer = false
    @Volatile private var hasHandledAnswer = false

    // ─── Managers ─────────────────────────────────────────────────────────────
    private val webRTC = NativeWebRTCManager.getInstance()
    private val signaling = NativeSignalingManager.instance
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val mainHandler = Handler(Looper.getMainLooper())

    // ─── Vues UI ──────────────────────────────────────────────────────────────
    private var backgroundImageView: ImageView? = null
    private var backgroundOverlayView: View? = null
    private var avatarRingLayout: FrameLayout? = null
    private var avatarImageView: ImageView? = null
    private var subtitleView: TextView? = null
    private var nameView: TextView? = null
    private var nameRowLayout: LinearLayout? = null
    private var bottomControlsContainer: FrameLayout? = null
    private var foregroundContentLayout: LinearLayout? = null  // ref to the foreground content (name, avatar, buttons)
    private var isControlsVisible: Boolean = true

    // Contrôles actifs
    private var muteBtnBg: FrameLayout? = null
    private var muteIconView: ImageView? = null
    private var speakerBtnBg: FrameLayout? = null
    private var speakerIconView: ImageView? = null
    private var camBtnBg: FrameLayout? = null
    private var videoPauseBtnBg: FrameLayout? = null
    private var videoPauseIconView: ImageView? = null
    private var videoPauseLabel: TextView? = null

    // Vidéo
    private var remoteRenderer: SurfaceViewRenderer? = null
    private var localRenderer: SurfaceViewRenderer? = null
    private var pipContainer: FrameLayout? = null  // local camera pip (in-call small frame)
    private var remoteVideoTrack: VideoTrack? = null
    private var isRemoteRendererInitialized = false
    private var isLocalRendererInitialized = false
    private var isInPipMode = false
    private var remoteVideoPausedOverlay: LinearLayout? = null
    private var remoteVideoPausedText: TextView? = null
    private var localPipPausedOverlay: FrameLayout? = null
    private var isRemoteVideoPaused = false

    // Sons
    private var outgoingRingtonePlayer: MediaPlayer? = null
    private var endCallPlayer: MediaPlayer? = null

    // ─── Runnables & Receivers ────────────────────────────────────────────────
    private val durationTick = object : Runnable {
        override fun run() {
            if (callState == CallState.CONNECTED) {
                durationSeconds++
                updateSubtitle(formatDuration(durationSeconds))
                mainHandler.postDelayed(this, 1000)
            }
        }
    }

    private val timeoutRunnable = Runnable {
        if (callState != CallState.CONNECTED && callState != CallState.ENDED) {
            Log.d(TAG, "Call timed out")
            endCall(reason = "TIMEOUT", remote = false)
        }
    }

    private val dismissReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val targetId = intent?.getStringExtra("callId")
            if (targetId.isNullOrEmpty() || callId.isEmpty() || callId == targetId) {
                finish()
            }
        }
    }

    private val pipActionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                ACTION_PIP_TOGGLE_MIC -> {
                    Log.d(TAG, "PiP action: TOGGLE_MIC")
                    toggleMute()
                }
                ACTION_PIP_END_CALL -> {
                    Log.d(TAG, "PiP action: END_CALL")
                    endCall(reason = "USER_ENDED", remote = false)
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cycle de vie Activity
    // ─────────────────────────────────────────────────────────────────────────

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        activeActivityRef = WeakReference(this)

        // callType not yet extracted here; re-apply after extractIntentData in setupUI
        setupWindowFlags(false)
        extractIntentData(intent)

        try {
            val filter = IntentFilter(ACTION_DISMISS_INCOMING_CALL)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(dismissReceiver, filter)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            val pipFilter = IntentFilter().apply {
                addAction(ACTION_PIP_TOGGLE_MIC)
                addAction(ACTION_PIP_END_CALL)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(pipActionReceiver, pipFilter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(pipActionReceiver, pipFilter)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            setMediaController(null)
        } catch (_: Exception) {}

        setupUI()

        // Pour les appels entrants : se connecter au signaling immédiatement
        if (!isCaller) {
            signaling.connect(userPhone.ifBlank { calleeId })
        }

        // Si l'intention demande directement d'accepter, rejeter ou terminer (ex: clic notification)
        when (intent.action) {
            "ACTION_ACCEPT" -> {
                handleAccept()
                return
            }
            "ACTION_REJECT" -> {
                handleReject()
                return
            }
            "ACTION_END_CALL" -> {
                endCall(reason = "USER_ENDED", remote = false)
                return
            }
            "ACTION_RESUME_CALL" -> {
                Log.d(TAG, "Activity created with ACTION_RESUME_CALL")
                resumeExistingCall()
                return
            }
        }

        // Si une session active connectée existe déjà pour cet appel, restaurer directement l'appel
        val session = YambiCallService.activeSession
        if (session != null && (callId.isEmpty() || session.callId == callId) && session.connectedAt > 0L) {
            Log.d(TAG, "Active connected session detected for callId=$callId — resuming call directly")
            resumeExistingCall()
            return
        }

        val initialCallInfo = mapOf(
            "callId" to callId,
            "callerId" to callerId,
            "calleeId" to calleeId,
            "callerName" to callerName,
            "callType" to callType
        )
        YambiCallModule.emitToJS("onCallStarted", initialCallInfo)

        if (isCaller) {
            // Appel sortant : démarrer la session immédiatement
            wasAnswered = true
            YambiCallModule.markCallAnswered(callId)
            callState = CallState.CONNECTING
            updateSubtitle(getCallString("calling", "Appel..."))
            showActiveControls()
            val otherName = calleeName.ifBlank { calleeId }
            val otherAvatar = getOtherAvatar()
            YambiCallService.activeSession = ActiveCallSession(
                callId = callId,
                callerId = callerId,
                calleeId = calleeId,
                callerName = callerName,
                callerAvatar = callerAvatar,
                calleeName = calleeName,
                calleeAvatar = calleeAvatar,
                callType = callType,
                isCaller = true,
                userPhone = userPhone,
                connectedAt = 0L,
                isMuted = isMuted,
                isSpeakerOn = isSpeakerOn
            )
            YambiCallService.startOngoing(this, callId, otherName, callType, 0L, otherAvatar)
            mainHandler.postDelayed(timeoutRunnable, OUTGOING_TIMEOUT_MS)
            startCallSession()
        } else {
            // Appel entrant : faire sonner et attendre décrochage
            callState = CallState.RINGING
            setupSignalingCallbacks()
            signaling.sendRinging(callId, callerId, calleeId)
            mainHandler.postDelayed(timeoutRunnable, INCOMING_TIMEOUT_MS)

            // Pré-initialiser WebRTC en tâche de fond pour réchauffer le sous-système audio sans latence au décrochage
            scope.launch(Dispatchers.IO) {
                try {
                    webRTC.initialize(this@IncomingCallActivity)
                } catch (e: Exception) {
                    Log.w(TAG, "Pre-initialize WebRTC error: ${e.message}")
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        extractIntentData(intent)
        when (intent.action) {
            "ACTION_ACCEPT" -> handleAccept()
            "ACTION_REJECT" -> handleReject()
            "ACTION_END_CALL" -> endCall(reason = "USER_ENDED", remote = false)
            "ACTION_RESUME_CALL" -> {
                Log.d(TAG, "Activity resumed with ACTION_RESUME_CALL")
                if (callState == CallState.CONNECTED) {
                    if (callConnectedTimestamp > 0L) {
                        durationSeconds = maxOf(0, ((System.currentTimeMillis() - callConnectedTimestamp) / 1000).toInt())
                    }
                    updateSubtitle(formatDuration(durationSeconds))
                    showActiveControls()
                } else {
                    resumeExistingCall()
                }
            }
            else -> {
                Log.d(TAG, "Activity resumed with action=${intent.action}, callState=$callState")
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        handleBackPressed()
    }

    private fun returnToMainActivity() {
        try {
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            if (launchIntent != null) {
                startActivity(launchIntent)
            } else {
                val mainIntent = Intent(this, Class.forName("${packageName}.MainActivity")).apply {
                    flags = Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                startActivity(mainIntent)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error returning to MainActivity: ${e.message}")
        }
    }

    private fun handleBackPressed() {
        Log.d(TAG, "Back pressed, current callState=$callState")
        when (callState) {
            CallState.CONNECTED, CallState.CONNECTING -> {
                val isVideo = callType.equals("video", ignoreCase = true)
                val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
                YambiCallService.startOngoing(this, callId, otherName, callType, callConnectedTimestamp, getOtherAvatar())

                if (isVideo && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    // Video call → enter PiP directly (underlying app screen remains in place)
                    enterPiP()
                } else {
                    // Audio call → return to previous app screen and finish call activity
                    returnToMainActivity()
                    finish()
                }
            }
            CallState.RINGING -> {
                if (isCaller) {
                    endCall("CANCELLED", remote = false)
                } else {
                    Log.d(TAG, "Back pressed while ringing: keeping incoming notification alive in taskbar, moving activity to background")
                    val moved = moveTaskToBack(true)
                    if (!moved) {
                        returnToMainActivity()
                    }
                }
            }
            CallState.IDLE, CallState.ENDED -> {
                finish()
            }
        }
    }

    override fun onStop() {
        super.onStop()
        Log.d(TAG, "IncomingCallActivity onStop, callState=$callState, isInPipMode=$isInPipMode")
        if (!isInPipMode && (callState == CallState.CONNECTED || callState == CallState.CONNECTING)) {
            val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
            YambiCallService.startOngoing(this, callId, otherName, callType, callConnectedTimestamp, getOtherAvatar())
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopOutgoingRingtone()
        mainHandler.removeCallbacks(durationTick)
        mainHandler.removeCallbacks(timeoutRunnable)

        val callIsActive = callState == CallState.CONNECTED || callState == CallState.CONNECTING || callState == CallState.RINGING

        if (callIsActive) {
            // Call is still ongoing — only detach UI renderers (tied to this Activity's Surface views).
            // Do NOT cancel scope or clear signaling callbacks or destroy WebRTC — the new Activity instance needs them.
            if (callType.equals("video", ignoreCase = true)) {
                if (isRemoteRendererInitialized) {
                    remoteRenderer?.let { webRTC.detachRemoteRenderer(it, remoteVideoTrack) }
                    isRemoteRendererInitialized = false
                }
                if (isLocalRendererInitialized) {
                    localRenderer?.let { webRTC.detachLocalRenderer(it) }
                    isLocalRendererInitialized = false
                }
                pipContainer?.removeAllViews()
                pipContainer = null
                remoteVideoPausedOverlay = null
                remoteVideoPausedText = null
                localPipPausedOverlay = null
                videoPauseBtnBg = null
                videoPauseIconView = null
                videoPauseLabel = null
            }
            // Keep the ongoing service alive so the notification stays visible
        } else {
            scope.cancel()
            // Call is fully ended — clean up everything
            signaling.clearCallbacks()
            if (callType.equals("video", ignoreCase = true)) {
                if (isRemoteRendererInitialized) {
                    remoteRenderer?.let { webRTC.detachRemoteRenderer(it, remoteVideoTrack) }
                    isRemoteRendererInitialized = false
                }
                if (isLocalRendererInitialized) {
                    localRenderer?.let { webRTC.detachLocalRenderer(it) }
                    isLocalRendererInitialized = false
                }
                pipContainer?.removeAllViews()
                pipContainer = null
                remoteVideoPausedOverlay = null
                remoteVideoPausedText = null
                localPipPausedOverlay = null
                videoPauseBtnBg = null
                videoPauseIconView = null
                videoPauseLabel = null
            }
            webRTC.cleanup()
            restoreAudioMode()
            IncomingCallNotificationManager.stopRinging()
            IncomingCallNotificationManager.dismissOngoingNotification(this)
            IncomingCallNotificationManager.dismissNotification(this, callId)
            YambiCallService.stop(this)
        }

        try {
            unregisterReceiver(dismissReceiver)
        } catch (_: Exception) {}

        try {
            unregisterReceiver(pipActionReceiver)
        } catch (_: Exception) {}

        if (activeActivityRef?.get() == this) {
            activeActivityRef = null
        }
        if (YambiCallService.activeSession == null) {
            notifyRNCallEnded("DESTROYED")
        }
        Log.d(TAG, "IncomingCallActivity destroyed (callState=$callState, callIsActive=$callIsActive)")
    }


    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        // Re-apply immersive mode when focus is restored for video calls
        if (hasFocus && callType.equals("video", ignoreCase = true)) {
            applyImmersiveMode()
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        val isActiveCall = callState == CallState.CONNECTED || callState == CallState.CONNECTING
        if (!isActiveCall) return

        val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
        YambiCallService.startOngoing(this, callId, otherName, callType, callConnectedTimestamp, getOtherAvatar())

        val isVideo = callType.equals("video", ignoreCase = true)
        if (isVideo && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            enterPiP()
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildPiPActions(): ArrayList<RemoteAction> {
        val actions = ArrayList<RemoteAction>()
        try {
            // 1. Bouton Couper / Activer micro
            val micIntent = Intent(ACTION_PIP_TOGGLE_MIC).setPackage(packageName)
            val micPendingIntent = PendingIntent.getBroadcast(
                this,
                REQUEST_CODE_PIP_MIC,
                micIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val micIconRes = if (isMuted) R.drawable.ic_call_mic_off else R.drawable.ic_call_mic_on
            val micTitle = if (isMuted) "Activer micro" else "Couper micro"
            actions.add(
                RemoteAction(
                    Icon.createWithResource(this, micIconRes),
                    micTitle,
                    micTitle,
                    micPendingIntent
                )
            )

            // 2. Bouton Raccrocher
            val endIntent = Intent(ACTION_PIP_END_CALL).setPackage(packageName)
            val endPendingIntent = PendingIntent.getBroadcast(
                this,
                REQUEST_CODE_PIP_END,
                endIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            actions.add(
                RemoteAction(
                    Icon.createWithResource(this, R.drawable.ic_call_decline),
                    "Raccrocher",
                    "Raccrocher l'appel",
                    endPendingIntent
                )
            )
        } catch (e: Exception) {
            Log.w(TAG, "Error building PiP actions: ${e.message}")
        }
        return actions
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildPiPParams(): PictureInPictureParams {
        val builder = PictureInPictureParams.Builder()
            .setAspectRatio(Rational(9, 16))
            .setActions(buildPiPActions())

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setAutoEnterEnabled(true)
        }

        return builder.build()
    }

    private fun updatePiPParams() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isInPipMode) {
            try {
                setPictureInPictureParams(buildPiPParams())
            } catch (e: Exception) {
                Log.w(TAG, "Failed to update PiP params: ${e.message}")
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun enterPiP() {
        try {
            val params = buildPiPParams()
            enterPictureInPictureMode(params)
        } catch (e: Exception) {
            Log.w(TAG, "PiP not available: ${e.message}")
            val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
            YambiCallService.startOngoing(this, callId, otherName, callType, callConnectedTimestamp)
            returnToMainActivity()
            finish()
        }
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode)
        isInPipMode = isInPictureInPictureMode
        Log.d(TAG, "PiP mode changed: isInPiP=$isInPictureInPictureMode")

        // Hide all UI controls in PiP — only the video feed should be visible
        val visibility = if (isInPictureInPictureMode) View.GONE else View.VISIBLE
        foregroundContentLayout?.visibility = visibility

        // Also hide/show the local camera pip container (confusing in PiP-within-PiP)
        pipContainer?.visibility = if (isInPictureInPictureMode) View.GONE else View.VISIBLE

        if (!isInPictureInPictureMode) {
            // Returning from PiP — restore ongoing notification if still connected
            if (callState == CallState.CONNECTED || callState == CallState.CONNECTING) {
                val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
                YambiCallService.startOngoing(this, callId, otherName, callType, callConnectedTimestamp, getOtherAvatar())
            }
            if (callType.equals("video", ignoreCase = true)) {
                if (isControlsVisible) {
                    subtitleView?.visibility = View.VISIBLE
                    subtitleView?.alpha = 1f
                    nameRowLayout?.visibility = View.VISIBLE
                    nameRowLayout?.alpha = 1f
                    bottomControlsContainer?.visibility = View.VISIBLE
                    bottomControlsContainer?.alpha = 1f
                } else {
                    subtitleView?.visibility = View.GONE
                    nameRowLayout?.visibility = View.GONE
                    bottomControlsContainer?.visibility = View.GONE
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Extraction et UI
    // ─────────────────────────────────────────────────────────────────────────

    private fun extractIntentData(intent: Intent?) {
        if (intent == null) return
        val rawCallId = intent.getStringExtra("callId") ?: ""
        if (rawCallId.isNotEmpty()) callId = rawCallId

        val session = YambiCallService.activeSession
        val sameSession = session != null && (callId.isEmpty() || session.callId == callId)

        val rawCallerId = intent.getStringExtra("callerId") ?: ""
        callerId = if (rawCallerId.isNotEmpty()) rawCallerId else (if (sameSession) session!!.callerId else callerId)

        val rawCalleeId = intent.getStringExtra("calleeId") ?: ""
        calleeId = if (rawCalleeId.isNotEmpty()) rawCalleeId else (if (sameSession) session!!.calleeId else calleeId)

        val rawCallerName = intent.getStringExtra("callerName") ?: ""
        callerName = if (rawCallerName.isNotEmpty()) rawCallerName else (if (sameSession) session!!.callerName.ifEmpty { callerId } else callerName.ifEmpty { callerId })

        val rawCallerAvatar = intent.getStringExtra("callerAvatar")
            ?: (if (!isCaller) intent.getStringExtra("avatar") ?: intent.getStringExtra("user_profile") ?: "" else "")
        callerAvatar = if (rawCallerAvatar.isNotEmpty()) rawCallerAvatar else (if (sameSession) session!!.callerAvatar else callerAvatar)

        val rawCalleeName = intent.getStringExtra("calleeName") ?: ""
        calleeName = if (rawCalleeName.isNotEmpty()) rawCalleeName else (if (sameSession) session!!.calleeName.ifEmpty { calleeId } else calleeName.ifEmpty { calleeId })

        val rawCalleeAvatar = intent.getStringExtra("calleeAvatar")
            ?: (if (isCaller) intent.getStringExtra("avatar") ?: intent.getStringExtra("user_profile") ?: "" else "")
        calleeAvatar = if (rawCalleeAvatar.isNotEmpty()) rawCalleeAvatar else (if (sameSession) session!!.calleeAvatar else calleeAvatar)

        if (!isValidAvatar(callerAvatar)) callerAvatar = ""
        if (!isValidAvatar(calleeAvatar)) calleeAvatar = ""

        val rawType = intent.getStringExtra("callType")
            ?: intent.getStringExtra("type")
            ?: (if (sameSession) session!!.callType else "")
        val hasVideo = intent.getBooleanExtra("hasVideo", false)
            || rawType.equals("video", ignoreCase = true)
        callType = if (hasVideo) "video" else "audio"

        isVerified = intent.getBooleanExtra("isVerified", false)
        isCaller = if (intent.hasExtra("isCaller")) intent.getBooleanExtra("isCaller", false) else (if (sameSession) session!!.isCaller else isCaller)
        val rawUserPhone = intent.getStringExtra("userPhone") ?: ""
        userPhone = if (rawUserPhone.isNotEmpty()) rawUserPhone else (if (sameSession && session!!.userPhone.isNotEmpty()) session.userPhone else (if (isCaller) callerId else calleeId))

        val intentConnectedAt = intent.getLongExtra("connectedAt", 0L)
        if (intentConnectedAt > 0L) {
            callConnectedTimestamp = intentConnectedAt
        } else if (sameSession && session!!.connectedAt > 0L) {
            callConnectedTimestamp = session.connectedAt
        }
    }

    private fun setupWindowFlags(isVideo: Boolean = false) {
        // ── Keyguard / screen-on (unchanged) ───────────────────────────────────
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val km = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
            km?.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // ── Edge-to-edge : draw under system bars ──────────────────────────────
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor   = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
            window.isStatusBarContrastEnforced = false
        }

        if (isVideo) {
            // ── VIDEO : full immersive — both bars completely hidden ─────────
            applyImmersiveMode()
        } else {
            // ── AUDIO : bars stay visible but drawn transparently over the page background ─
            val controller = WindowInsetsControllerCompat(window, window.decorView)
            controller.isAppearanceLightStatusBars   = false
            controller.isAppearanceLightNavigationBars = false

            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }
    }

    /** Re-applies full immersive mode (video calls). Safe to call multiple times. */
    private fun applyImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val controller = WindowInsetsControllerCompat(window, window.decorView)
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 101 && grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
            Log.d(TAG, "Audio/Video permissions granted — restarting call session")
            startCallSession()
        } else if (requestCode == 101) {
            Log.w(TAG, "Audio/Video permissions denied by user")
            endCall(reason = "PERMISSION_DENIED", remote = false)
        }
    }

    private fun getCallString(key: String, fallback: String): String {
        return IncomingCallNotificationManager.getCallString(this, key, fallback)
    }

    private fun setupUI() {
        val density = resources.displayMetrics.density
        val isVideo = callType.equals("video", ignoreCase = true)

        // Re-apply window flags now that callType is known
        setupWindowFlags(isVideo)

        val displayName = if (isCaller) (if (calleeName.isNotBlank()) calleeName else calleeId) else (if (callerName.isNotBlank()) callerName else callerId)
        val displayAvatar = getOtherAvatar()

        val rootFrame = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(if (isVideo) Color.parseColor("#1C1C1E") else Color.parseColor("#0F172A"))
        }

        // 1. Photo de profil plein écran en arrière-plan
        backgroundImageView = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            scaleType = ImageView.ScaleType.CENTER_CROP
            setImageResource(R.drawable.profile_black)
            visibility = View.VISIBLE
        }
        rootFrame.addView(backgroundImageView)

        // 2. Calque sombre semi-transparent (#A6000000)
        backgroundOverlayView = View(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#A6000000"))
            visibility = View.VISIBLE
        }
        rootFrame.addView(backgroundOverlayView)

        // 3. Renderers Vidéo (si vidéo)
        if (isVideo) {
            remoteRenderer = SurfaceViewRenderer(this).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setEnableHardwareScaler(true)
                setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
                visibility = View.GONE
            }
            rootFrame.addView(remoteRenderer)

            remoteVideoPausedOverlay = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(Color.parseColor("#E6000000"))
                visibility = if (isRemoteVideoPaused) View.VISIBLE else View.GONE

                val pauseIcon = ImageView(context).apply {
                    val sz = (48 * density).toInt()
                    layoutParams = LinearLayout.LayoutParams(sz, sz).apply {
                        gravity = Gravity.CENTER_HORIZONTAL
                        bottomMargin = (16 * density).toInt()
                    }
                    setImageResource(R.drawable.ic_call_video_off)
                }
                addView(pauseIcon)

                remoteVideoPausedText = TextView(context).apply {
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply {
                        gravity = Gravity.CENTER_HORIZONTAL
                    }
                    text = getCallString("video_paused", "Vidéo en pause")
                    setTextColor(Color.WHITE)
                    textSize = 16f
                    typeface = Typeface.DEFAULT_BOLD
                }
                addView(remoteVideoPausedText)
            }
            rootFrame.addView(remoteVideoPausedOverlay)

            val pipW = (112 * density).toInt()
            val pipH = (160 * density).toInt()
            val pipRadius = 10 * density   // 10dp border radius as requested

            // Initial position: top-right corner (will be updated once screen size is known)
            val pipInitialLeft = resources.displayMetrics.widthPixels - pipW - (16 * density).toInt()
            val pipInitialTop  = (72 * density).toInt()   // below status bar area

            pipContainer = FrameLayout(this).apply {
                layoutParams = FrameLayout.LayoutParams(pipW, pipH).apply {
                    // No gravity — absolute position via leftMargin/topMargin
                    leftMargin = pipInitialLeft
                    topMargin  = pipInitialTop
                }
                background = GradientDrawable().apply {
                    shape = GradientDrawable.RECTANGLE
                    cornerRadius = pipRadius
                    setColor(Color.parseColor("#1E293B"))
                    setStroke((1.5f * density).toInt(), Color.parseColor("#4DFFFFFF"))
                }
                elevation = 12 * density
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    outlineProvider = object : ViewOutlineProvider() {
                        override fun getOutline(view: View, outline: Outline) {
                            outline.setRoundRect(0, 0, view.width, view.height, pipRadius)
                        }
                    }
                    clipToOutline = true
                }
                visibility = View.VISIBLE

                // ── Drag logic ────────────────────────────────────────────────
                var dragStartRawX = 0f
                var dragStartRawY = 0f
                var dragStartLeftMargin = 0
                var dragStartTopMargin  = 0
                var totalMovePx = 0f

                setOnTouchListener { view, event ->
                    val params = view.layoutParams as? FrameLayout.LayoutParams ?: return@setOnTouchListener false
                    val screenW = resources.displayMetrics.widthPixels
                    val screenH = resources.displayMetrics.heightPixels

                    when (event.action) {
                        MotionEvent.ACTION_DOWN -> {
                            view.bringToFront()
                            dragStartRawX     = event.rawX
                            dragStartRawY     = event.rawY
                            dragStartLeftMargin = params.leftMargin
                            dragStartTopMargin  = params.topMargin
                            totalMovePx = 0f
                            true
                        }
                        MotionEvent.ACTION_MOVE -> {
                            val dx = event.rawX - dragStartRawX
                            val dy = event.rawY - dragStartRawY
                            totalMovePx += Math.abs(dx) + Math.abs(dy)
                            val newLeft = (dragStartLeftMargin + dx).toInt()
                                .coerceIn(0, screenW - view.width)
                            val newTop  = (dragStartTopMargin  + dy).toInt()
                                .coerceIn(0, screenH - view.height)
                            params.leftMargin = newLeft
                            params.topMargin  = newTop
                            view.layoutParams = params
                            true
                        }
                        MotionEvent.ACTION_UP -> {
                            if (totalMovePx < 15f) {
                                // Treat as a tap → switch camera
                                switchCamera()
                            }
                            true
                        }
                        else -> false
                    }
                }
            }

            localRenderer = SurfaceViewRenderer(this).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setEnableHardwareScaler(true)
                setScalingType(RendererCommon.ScalingType.SCALE_ASPECT_FILL)
                setZOrderMediaOverlay(true)
                visibility = View.VISIBLE
            }
            pipContainer?.addView(localRenderer)

            localPipPausedOverlay = FrameLayout(this).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(Color.parseColor("#CC111827"))
                visibility = if (isCameraOff) View.VISIBLE else View.GONE

                val icon = ImageView(context).apply {
                    val sz = (28 * density).toInt()
                    layoutParams = FrameLayout.LayoutParams(sz, sz).apply { gravity = Gravity.CENTER }
                    setImageResource(R.drawable.ic_call_video_off)
                }
                addView(icon)
            }
            pipContainer?.addView(localPipPausedOverlay)

            rootFrame.addView(pipContainer)

            webRTC.attachLocalRenderer(localRenderer!!)
            isLocalRendererInitialized = true
        }

        // 4. Layout vertical de premier plan
        val padHoriz = (24 * density).toInt()
        val contentLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            // Initial padding — bottom will be updated via window insets below
            val padTop = (72 * density).toInt()
            val padBottom = (54 * density).toInt()
            setPadding(padHoriz, padTop, padHoriz, padBottom)
        }
        foregroundContentLayout = contentLayout

        if (!isVideo) {
            // Pour les appels audio : écouter les insets pour que le contenu se place au-dessus
            // de la barre de navigation système sans masquer le fond plein écran.
            ViewCompat.setOnApplyWindowInsetsListener(contentLayout) { v, insets ->
                val navBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom
                val statusBarHeight = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top
                val minBottomPad = (36 * density).toInt()
                val bottomPad = maxOf(navBarHeight + (20 * density).toInt(), minBottomPad)
                val topPad = maxOf(statusBarHeight + (16 * density).toInt(), (56 * density).toInt())
                v.setPadding(padHoriz, topPad, padHoriz, bottomPad)
                insets
            }
        }

        // Sous-titre initial
        val initialSubtitle = if (isCaller) {
            getCallString("calling", "Appel...")
        } else {
            if (isVideo) getCallString("incoming_video_call", "Appel vidéo entrant") else getCallString("incoming_audio_call", "Appel audio entrant")
        }

        subtitleView = TextView(this).apply {
            text = initialSubtitle
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.12f
            setTextColor(Color.parseColor("#34C759"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (8 * density).toInt()
            }
        }
        contentLayout.addView(subtitleView)

        // Nom du correspondant + badge vérifié
        val nameRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (36 * density).toInt()
            }
        }
        nameRowLayout = nameRow

        nameView = TextView(this).apply {
            text = displayName
            textSize = 30f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            maxLines = 1
            ellipsize = TextUtils.TruncateAt.END
        }
        nameRow.addView(nameView)

        if (isVerified) {
            val verifiedBadge = ImageView(this).apply {
                val badgeSize = (22 * density).toInt()
                layoutParams = LinearLayout.LayoutParams(badgeSize, badgeSize).apply {
                    marginStart = (8 * density).toInt()
                    gravity = Gravity.CENTER_VERTICAL
                }
                setImageResource(R.drawable.ic_verified_badge)
            }
            nameRow.addView(verifiedBadge)
        }
        contentLayout.addView(nameRow)

        // Cercle d'avatar au centre
        val ringSize = (144 * density).toInt()
        val ringBorderWidth = (3.5f * density).toInt()
        val ringPadding = (4 * density).toInt()

        avatarRingLayout = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(ringSize, ringSize).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                topMargin = (10 * density).toInt()
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#1E293B"))
                setStroke(ringBorderWidth, Color.parseColor("#9934C759"))
            }
            setPadding(ringPadding, ringPadding, ringPadding, ringPadding)
            elevation = 8 * density
        }

        val imgInnerSize = ringSize - (2 * ringPadding)
        avatarImageView = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(imgInnerSize, imgInnerSize).apply {
                gravity = Gravity.CENTER
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#1E293B"))
            }
            scaleType = ImageView.ScaleType.CENTER_CROP
            val defaultBitmap = BitmapFactory.decodeResource(resources, R.drawable.profile_black)
            if (defaultBitmap != null) {
                setImageBitmap(getCircularBitmap(defaultBitmap))
            } else {
                setImageResource(R.drawable.profile_black)
            }
        }
        avatarRingLayout?.addView(avatarImageView)
        contentLayout.addView(avatarRingLayout)

        // Spacer central extensible
        val spacer = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f
            )
        }
        contentLayout.addView(spacer)

        // Conteneur des boutons du bas
        bottomControlsContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        contentLayout.addView(bottomControlsContainer)
        rootFrame.addView(contentLayout)

        if (isVideo) {
            pipContainer?.bringToFront()
            contentLayout.setOnClickListener {
                toggleControlsVisibility()
            }
            remoteRenderer?.setOnClickListener {
                toggleControlsVisibility()
            }
            remoteVideoPausedOverlay?.setOnClickListener {
                toggleControlsVisibility()
            }
        }

        setContentView(rootFrame)

        // Afficher les contrôles initiaux selon entrant ou sortant
        if (isCaller) {
            showActiveControls()
        } else {
            showIncomingControls()
        }

        // Charger la photo de profil en fond et dans l'avatar
        if (displayAvatar.isNotBlank()) {
            loadAvatarImage(displayAvatar)
        } else {
            loadDefaultAvatar()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boutons du bas : Entrant (Refuser / Accepter)
    // ─────────────────────────────────────────────────────────────────────────

    private fun showIncomingControls() {
        val container = bottomControlsContainer ?: return
        container.removeAllViews()

        val density = resources.displayMetrics.density
        val isVideo = callType.equals("video", ignoreCase = true)
        val btnSize = (72 * density).toInt()
        val iconSize = (34 * density).toInt()

        val actionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            val padH = (24 * density).toInt()
            setPadding(padH, 0, padH, 0)
        }

        // 1. Bouton Refuser (Rouge)
        val declineCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
        }
        val declineBtn = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(btnSize, btnSize).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#FF3B30"))
            }
            elevation = 6 * density
            isClickable = true
            isFocusable = true
            val icon = ImageView(context).apply {
                layoutParams = FrameLayout.LayoutParams(iconSize, iconSize).apply { gravity = Gravity.CENTER }
                setImageResource(R.drawable.ic_call_decline)
            }
            addView(icon)
            setOnClickListener { handleReject() }
        }
        declineCol.addView(declineBtn)

        val declineLabel = TextView(this).apply {
            text = getCallString("decline", "Refuser")
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = (10 * density).toInt() }
        }
        declineCol.addView(declineLabel)
        actionsRow.addView(declineCol)

        // 2. Bouton Accepter (Vert)
        val acceptCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
        }
        val acceptBtn = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(btnSize, btnSize).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#34C759"))
            }
            elevation = 6 * density
            isClickable = true
            isFocusable = true
            val icon = ImageView(context).apply {
                layoutParams = FrameLayout.LayoutParams(iconSize, iconSize).apply { gravity = Gravity.CENTER }
                setImageResource(if (isVideo) R.drawable.ic_call_video else R.drawable.ic_call_accept)
            }
            addView(icon)
            setOnClickListener { handleAccept() }
        }
        acceptCol.addView(acceptBtn)

        val acceptLabel = TextView(this).apply {
            text = getCallString("accept", "Accepter")
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = (10 * density).toInt() }
        }
        acceptCol.addView(acceptLabel)
        actionsRow.addView(acceptCol)

        container.addView(actionsRow)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boutons du bas : En cours d'appel (Muet, Haut-parleur, Flip, Raccrocher)
    // ─────────────────────────────────────────────────────────────────────────

    private fun showActiveControls() {
        val container = bottomControlsContainer ?: return
        container.removeAllViews()

        val density = resources.displayMetrics.density
        val isVideo = callType.equals("video", ignoreCase = true)
        val btnSize = if (isVideo) (54 * density).toInt() else (64 * density).toInt()
        val iconSize = if (isVideo) (24 * density).toInt() else (28 * density).toInt()
        val endBtnSize = if (isVideo) (60 * density).toInt() else (72 * density).toInt()
        val endIconSize = if (isVideo) (28 * density).toInt() else (34 * density).toInt()
        val labelSize = if (isVideo) 11f else 12f

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            val padH = if (isVideo) (8 * density).toInt() else (16 * density).toInt()
            setPadding(padH, 0, padH, 0)
        }

        // 1. Bouton Muet
        val muteCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
        }
        muteBtnBg = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(btnSize, btnSize).apply { gravity = Gravity.CENTER_HORIZONTAL }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(if (isMuted) Color.parseColor("#EF4444") else Color.parseColor("#3A3A3C"))
            }
            elevation = 4 * density
            isClickable = true
            isFocusable = true
            muteIconView = ImageView(context).apply {
                layoutParams = FrameLayout.LayoutParams(iconSize, iconSize).apply { gravity = Gravity.CENTER }
                setImageResource(if (isMuted) R.drawable.ic_call_mic_off else R.drawable.ic_call_mic_on)
            }
            addView(muteIconView)
            setOnClickListener { toggleMute() }
        }
        muteCol.addView(muteBtnBg)
        val muteLabel = TextView(this).apply {
            text = getCallString("mute", "Muet")
            textSize = labelSize
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = (8 * density).toInt() }
        }
        muteCol.addView(muteLabel)
        row.addView(muteCol)

        // 2. Bouton Haut-Parleur
        val speakerCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
        }
        speakerBtnBg = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(btnSize, btnSize).apply { gravity = Gravity.CENTER_HORIZONTAL }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(if (isSpeakerOn) Color.parseColor("#3B82F6") else Color.parseColor("#3A3A3C"))
            }
            elevation = 4 * density
            isClickable = true
            isFocusable = true
            speakerIconView = ImageView(context).apply {
                layoutParams = FrameLayout.LayoutParams(iconSize, iconSize).apply { gravity = Gravity.CENTER }
                setImageResource(if (isSpeakerOn) R.drawable.ic_call_speaker_on else R.drawable.ic_call_speaker_off)
            }
            addView(speakerIconView)
            setOnClickListener { toggleSpeaker() }
        }
        speakerCol.addView(speakerBtnBg)
        val speakerLabel = TextView(this).apply {
            text = getCallString("speaker", "HP")
            textSize = labelSize
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = (8 * density).toInt() }
        }
        speakerCol.addView(speakerLabel)
        row.addView(speakerCol)

        // 3. Bouton Pause Vidéo (si vidéo)
        if (isVideo) {
            val pauseCol = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
            }
            videoPauseBtnBg = FrameLayout(this).apply {
                layoutParams = LinearLayout.LayoutParams(btnSize, btnSize).apply { gravity = Gravity.CENTER_HORIZONTAL }
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(if (isCameraOff) Color.parseColor("#EF4444") else Color.parseColor("#3A3A3C"))
                }
                elevation = 4 * density
                isClickable = true
                isFocusable = true
                videoPauseIconView = ImageView(context).apply {
                    layoutParams = FrameLayout.LayoutParams(iconSize, iconSize).apply { gravity = Gravity.CENTER }
                    setImageResource(if (isCameraOff) R.drawable.ic_call_video_off else R.drawable.ic_call_video)
                }
                addView(videoPauseIconView)
                setOnClickListener { toggleVideoPause() }
            }
            pauseCol.addView(videoPauseBtnBg)
            videoPauseLabel = TextView(this).apply {
                text = if (isCameraOff) getCallString("resume_video", "Reprendre") else getCallString("pause_video", "Pause")
                textSize = labelSize
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.WHITE)
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { topMargin = (8 * density).toInt() }
            }
            pauseCol.addView(videoPauseLabel)
            row.addView(pauseCol)

            // 4. Bouton Bascule Caméra (si vidéo)
            val camCol = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
            }
            camBtnBg = FrameLayout(this).apply {
                layoutParams = LinearLayout.LayoutParams(btnSize, btnSize).apply { gravity = Gravity.CENTER_HORIZONTAL }
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor("#3A3A3C"))
                }
                elevation = 4 * density
                isClickable = true
                isFocusable = true
                val camIcon = ImageView(context).apply {
                    layoutParams = FrameLayout.LayoutParams(iconSize, iconSize).apply { gravity = Gravity.CENTER }
                    setImageResource(R.drawable.ic_call_flip_camera)
                }
                addView(camIcon)
                setOnClickListener { switchCamera() }
            }
            camCol.addView(camBtnBg)
            val camLabel = TextView(this).apply {
                text = getCallString("switch_camera", "Bascule")
                textSize = labelSize
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.WHITE)
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply { topMargin = (8 * density).toInt() }
            }
            camCol.addView(camLabel)
            row.addView(camCol)
        }

        // 5. Bouton Raccrocher (Rouge)
        val endCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)
        }
        val endBtn = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(endBtnSize, endBtnSize).apply { gravity = Gravity.CENTER_HORIZONTAL }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#FF3B30"))
            }
            elevation = 6 * density
            isClickable = true
            isFocusable = true
            val icon = ImageView(context).apply {
                layoutParams = FrameLayout.LayoutParams(endIconSize, endIconSize).apply { gravity = Gravity.CENTER }
                setImageResource(R.drawable.ic_call_decline)
            }
            addView(icon)
            setOnClickListener { endCall(reason = "USER_ENDED", remote = false) }
        }
        endCol.addView(endBtn)
        val endLabel = TextView(this).apply {
            text = getCallString("end_call", "Fin")
            textSize = labelSize
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = (8 * density).toInt() }
        }
        endCol.addView(endLabel)
        row.addView(endCol)

        container.addView(row)

        if (!isControlsVisible && isVideo) {
            container.visibility = View.GONE
            container.alpha = 0f
        } else {
            container.visibility = View.VISIBLE
            container.alpha = 1f
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Actions utilisateur : Décrocher / Raccrocher / Toggles
    // ─────────────────────────────────────────────────────────────────────────

    private fun handleAccept() {
        if (callState == CallState.CONNECTED || callState == CallState.CONNECTING) return
        Log.d(TAG, "Call accepted by user")
        wasAnswered = true
        YambiCallModule.markCallAnswered(callId)
        mainHandler.removeCallbacks(timeoutRunnable)
        IncomingCallNotificationManager.stopRinging()
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.cancel(IncomingCallNotificationManager.NOTIFICATION_ID)
        } catch (_: Exception) {}

        callState = CallState.CONNECTING
        updateSubtitle(getCallString("connecting", "Connexion..."))
        showActiveControls()
        setAudioModeInCall()

        val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
        YambiCallService.activeSession = ActiveCallSession(
            callId = callId,
            callerId = callerId,
            calleeId = calleeId,
            callerName = callerName,
            callerAvatar = callerAvatar,
            calleeName = calleeName,
            calleeAvatar = calleeAvatar,
            callType = callType,
            isCaller = false,
            userPhone = userPhone,
            connectedAt = 0L,
            isMuted = isMuted,
            isSpeakerOn = isSpeakerOn
        )
        YambiCallService.startOngoing(this, callId, otherName, callType, 0L)

        val callData = mapOf(
            "callId" to callId,
            "callerId" to callerId,
            "calleeId" to calleeId,
            "callerName" to callerName,
            "callType" to callType
        )
        YambiCallModule.emitCallAnswered(callData)

        startCallSession()
    }

    private fun handleReject() {
        Log.d(TAG, "Call rejected by user")
        IncomingCallNotificationManager.stopRinging()
        IncomingCallNotificationManager.dismissNotification(this, callId)

        signaling.sendReject(callId, callerId, calleeId)
        val callData = mapOf(
            "callId" to callId,
            "callerId" to callerId,
            "calleeId" to calleeId,
            "callerName" to callerName,
            "callType" to callType
        )
        YambiCallModule.clearPendingCallData()
        YambiCallModule.emitCallRejected(callData)
        playEndCallSound()
        mainHandler.postDelayed({ finish() }, 800)
    }

    private fun toggleMute() {
        isMuted = !isMuted
        webRTC.toggleMute(isMuted)
        muteBtnBg?.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(if (isMuted) Color.parseColor("#EF4444") else Color.parseColor("#3A3A3C"))
        }
        muteIconView?.setImageResource(if (isMuted) R.drawable.ic_call_mic_off else R.drawable.ic_call_mic_on)
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            am?.isMicrophoneMute = isMuted
        } catch (_: Exception) {}
        YambiCallService.activeSession?.isMuted = isMuted
        updatePiPParams()
    }

    private fun toggleSpeaker() {
        isSpeakerOn = !isSpeakerOn
        speakerBtnBg?.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(if (isSpeakerOn) Color.parseColor("#3B82F6") else Color.parseColor("#3A3A3C"))
        }
        speakerIconView?.setImageResource(if (isSpeakerOn) R.drawable.ic_call_speaker_on else R.drawable.ic_call_speaker_off)
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            am?.mode = AudioManager.MODE_IN_COMMUNICATION
            am?.isSpeakerphoneOn = isSpeakerOn
        } catch (_: Exception) {}
        YambiCallService.activeSession?.isSpeakerOn = isSpeakerOn
    }

    private fun startOutgoingRingtone() {
        if (callState == CallState.CONNECTED || callState == CallState.ENDED) return
        if (outgoingRingtonePlayer != null) return

        try {
            stopOutgoingRingtone()
            outgoingRingtonePlayer = MediaPlayer.create(applicationContext, R.raw.outgoing_call)?.apply {
                isLooping = true
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION_SIGNALLING)
                    .build()
                setAudioAttributes(audioAttributes)
                setVolume(1.0f, 1.0f)
                start()
                Log.d(TAG, "Outgoing ringtone started")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting outgoing ringtone: ${e.message}", e)
        }
    }

    private fun stopOutgoingRingtone() {
        try {
            outgoingRingtonePlayer?.let { player ->
                if (player.isPlaying) {
                    player.stop()
                }
                player.release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping outgoing ringtone: ${e.message}", e)
        } finally {
            outgoingRingtonePlayer = null
        }
    }

    private fun playEndCallSound() {
        try {
            stopOutgoingRingtone()
            IncomingCallNotificationManager.stopRinging()
            endCallPlayer = MediaPlayer.create(applicationContext, R.raw.end_call)?.apply {
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .build()
                setAudioAttributes(audioAttributes)
                setVolume(1.0f, 1.0f)
                setOnCompletionListener { mp ->
                    try {
                        mp.release()
                    } catch (_: Exception) {}
                    if (endCallPlayer == mp) {
                        endCallPlayer = null
                    }
                }
                start()
                Log.d(TAG, "End call sound started")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error playing end call sound: ${e.message}", e)
        }
    }

    private fun switchCamera() {
        webRTC.switchCamera()
    }

    private fun toggleVideoPause() {
        val isVideo = callType.equals("video", ignoreCase = true)
        if (!isVideo) return

        isCameraOff = !isCameraOff
        Log.d(TAG, "toggleVideoPause: isCameraOff=$isCameraOff")

        webRTC.toggleCamera(isCameraOff)

        videoPauseBtnBg?.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(if (isCameraOff) Color.parseColor("#EF4444") else Color.parseColor("#3A3A3C"))
        }
        videoPauseIconView?.setImageResource(
            if (isCameraOff) R.drawable.ic_call_video_off else R.drawable.ic_call_video
        )
        videoPauseLabel?.text = if (isCameraOff) {
            getCallString("resume_video", "Reprendre")
        } else {
            getCallString("pause_video", "Pause")
        }

        localPipPausedOverlay?.visibility = if (isCameraOff) View.VISIBLE else View.GONE

        val target = if (isCaller) calleeId else callerId
        signaling.sendVideoState(callId, target, enabled = !isCameraOff)

        YambiCallService.activeSession?.isCameraOff = isCameraOff
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Démarrage WebRTC et Session d'Appel
    // ─────────────────────────────────────────────────────────────────────────

    private fun startCallSession() {
        val isVideo = callType.equals("video", ignoreCase = true)
        setAudioModeInCall()

        scope.launch {
            try {
                // 1. Initialiser WebRTC
                webRTC.initialize(this@IncomingCallActivity)

                // 2. Vérifier permissions d'enregistrement audio/vidéo
                val hasAudioPerm = ActivityCompat.checkSelfPermission(
                    this@IncomingCallActivity, android.Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED
                val hasCameraPerm = if (isVideo) {
                    ActivityCompat.checkSelfPermission(
                        this@IncomingCallActivity, android.Manifest.permission.CAMERA
                    ) == PackageManager.PERMISSION_GRANTED
                } else true

                if (!hasAudioPerm || !hasCameraPerm) {
                    val missing = mutableListOf<String>()
                    if (!hasAudioPerm) missing.add(android.Manifest.permission.RECORD_AUDIO)
                    if (!hasCameraPerm) missing.add(android.Manifest.permission.CAMERA)
                    ActivityCompat.requestPermissions(this@IncomingCallActivity, missing.toTypedArray(), 101)
                    // Stop here — onRequestPermissionsResult will re-acquire the stream once granted
                    return@launch
                }

                // 3. Obtenir le stream local
                withContext(Dispatchers.IO) {
                    webRTC.getLocalStream(this@IncomingCallActivity, isVideo)
                }

                if (isVideo) {
                    pipContainer?.visibility = View.VISIBLE
                    webRTC.onLocalVideoTrack = { track ->
                        mainHandler.post {
                            localRenderer?.let { r -> track?.let { t -> try { t.addSink(r) } catch (_: Exception) {} } }
                        }
                    }
                }

                // 4. Créer la PeerConnection
                withContext(Dispatchers.IO) {
                    webRTC.createPeerConnection()
                }

                // 5. Configurer callbacks WebRTC et Signaling
                setupWebRTCCallbacks()
                setupSignalingCallbacks()

                // 6. Connecter le signaling (si pas déjà connecté)
                // Pour le caller : nouvelle connexion
                // Pour le callee : déjà connecté depuis onCreate — on envoie juste l'accept
                if (isCaller) {
                    signaling.connect(userPhone.ifBlank { callerId })
                    // Envoyer l'invite vers la callee
                    signaling.sendInvite(callId, callerId, calleeId, callerName, callerAvatar, callType)
                    Log.d(TAG, "Sent call:invite to $calleeId")
                } else {
                    // Le signaling est déjà connecté depuis onCreate, juste envoyer l'accept
                    signaling.sendAccept(callId, callerId, calleeId)
                    Log.d(TAG, "Sent call:accept to $callerId")
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error in startCallSession: ${e.message}", e)
                endCall(reason = "FAILED", remote = false)
            }
        }
    }

    private fun setupSignalingCallbacks() {
        signaling.onCallRinging = { cId ->
            if (cId == callId && isCaller) {
                mainHandler.post {
                    Log.d(TAG, "Callee is ringing for $cId — updating to 'ringing' and starting outgoing ringtone")
                    updateSubtitle(getCallString("ringing", "Appel en cours..."))
                    startOutgoingRingtone()
                }
            }
        }

        signaling.onCallAccepted = { cId ->
            if (cId == callId && isCaller) {
                mainHandler.post { stopOutgoingRingtone() }
                if (!hasCreatedOffer) {
                    hasCreatedOffer = true
                    Log.d(TAG, "Call accepted by remote peer, creating offer")
                    mainHandler.removeCallbacks(timeoutRunnable)
                    mainHandler.post { updateSubtitle(getCallString("connecting", "Connexion...")) }
                    scope.launch {
                        try {
                            val offer = withContext(Dispatchers.IO) { webRTC.createOffer() }
                            signaling.sendOffer(callId, callerId, calleeId, offer.description, offer.type.canonicalForm())
                        } catch (e: Exception) {
                            Log.e(TAG, "Error creating offer: ${e.message}", e)
                        }
                    }
                } else {
                    Log.d(TAG, "Offer already created for $callId, ignoring duplicate accept")
                }
            }
        }

        signaling.onOffer = { cId, sdp, type ->
            if (cId == callId && !isCaller) {
                if (!hasCreatedAnswer) {
                    hasCreatedAnswer = true
                    Log.d(TAG, "Received offer from caller, creating answer")
                    mainHandler.post { updateSubtitle(getCallString("connecting", "Connexion...")) }
                    scope.launch {
                        try {
                            val answer = withContext(Dispatchers.IO) {
                                webRTC.handleOfferAndCreateAnswer(sdp, type)
                            }
                            signaling.sendAnswer(callId, callerId, calleeId, answer.description, answer.type.canonicalForm())
                        } catch (e: Exception) {
                            Log.e(TAG, "Error creating answer: ${e.message}", e)
                        }
                    }
                } else {
                    Log.d(TAG, "Answer already created for $callId, ignoring duplicate offer")
                }
            }
        }

        signaling.onAnswer = { cId, sdp, type ->
            if (cId == callId && isCaller) {
                if (!hasHandledAnswer) {
                    hasHandledAnswer = true
                    Log.d(TAG, "Received answer from callee")
                    scope.launch {
                        try {
                            withContext(Dispatchers.IO) { webRTC.handleAnswer(sdp, type) }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error handling answer: ${e.message}", e)
                        }
                    }
                } else {
                    Log.d(TAG, "Answer already handled for $callId, ignoring duplicate answer")
                }
            }
        }

        signaling.onIceCandidate = { cId, candidate, sdpMid, sdpMLineIndex ->
            if (cId == callId) {
                scope.launch(Dispatchers.IO) {
                    webRTC.addIceCandidate(candidate, sdpMid, sdpMLineIndex)
                }
            }
        }

        signaling.onCallEnd = { cId ->
            if (cId == callId) {
                mainHandler.post { endCall(reason = "REMOTE_ENDED", remote = true) }
            }
        }

        signaling.onCallCancelled = { cId ->
            if (cId == callId) {
                mainHandler.post { endCall(reason = "CANCELLED", remote = true) }
            }
        }

        signaling.onCallRejected = { cId ->
            if (cId == callId) {
                mainHandler.post { endCall(reason = "REJECTED", remote = true) }
            }
        }

        signaling.onCallBusy = { cId ->
            if (cId == callId) {
                mainHandler.post { endCall(reason = "BUSY", remote = true) }
            }
        }

        signaling.onVideoStateChanged = { cId, enabled ->
            if (cId == callId) {
                mainHandler.post {
                    Log.d(TAG, "Remote video state changed: enabled=$enabled")
                    isRemoteVideoPaused = !enabled
                    val isVideo = callType.equals("video", ignoreCase = true)
                    if (isVideo) {
                        remoteVideoPausedText?.text = getCallString("video_paused", "Vidéo en pause")
                        remoteVideoPausedOverlay?.visibility = if (isRemoteVideoPaused) View.VISIBLE else View.GONE
                        if (isRemoteVideoPaused) {
                            remoteVideoPausedOverlay?.bringToFront()
                            foregroundContentLayout?.bringToFront()
                            pipContainer?.bringToFront()
                        }
                    }
                }
            }
        }
    }

    private fun setupWebRTCCallbacks() {
        webRTC.onIceCandidate = { candidate ->
            signaling.sendIceCandidate(callId, callerId, calleeId, candidate.sdp, candidate.sdpMid, candidate.sdpMLineIndex)
        }

        webRTC.onConnectionStateChange = { state ->
            mainHandler.post {
                when (state) {
                    PeerConnection.PeerConnectionState.CONNECTED -> onCallConnected()
                    PeerConnection.PeerConnectionState.DISCONNECTED,
                    PeerConnection.PeerConnectionState.FAILED -> {
                        if (callState != CallState.ENDED) {
                            updateSubtitle(getCallString("reconnecting", "Reconnexion..."))
                        }
                    }
                    PeerConnection.PeerConnectionState.CLOSED -> {
                        if (callState == CallState.CONNECTED && !isFinishing && !isDestroyed) {
                            endCall(reason = "CONNECTION_CLOSED", remote = false)
                        }
                    }
                    else -> {}
                }
            }
        }

        webRTC.onIceConnectionStateChange = { state ->
            mainHandler.post {
                if (state == PeerConnection.IceConnectionState.CONNECTED || state == PeerConnection.IceConnectionState.COMPLETED) {
                    onCallConnected()
                }
            }
        }

        webRTC.onRemoteAudioReady = {
            mainHandler.post { onCallConnected() }
        }

        webRTC.onRemoteVideoTrack = { track ->
            remoteVideoTrack = track
            mainHandler.post {
                onCallConnected()
                remoteRenderer?.let { r ->
                    track?.let { t ->
                        r.visibility = View.VISIBLE
                        if (!isRemoteRendererInitialized) {
                            webRTC.attachRemoteRenderer(r)
                            isRemoteRendererInitialized = true
                        }
                        webRTC.addRemoteRendererSink(r, t)
                        avatarRingLayout?.visibility = View.GONE
                        backgroundImageView?.visibility = View.GONE
                        backgroundOverlayView?.visibility = View.GONE
                        if (isRemoteVideoPaused) {
                            remoteVideoPausedOverlay?.visibility = View.VISIBLE
                            remoteVideoPausedOverlay?.bringToFront()
                            foregroundContentLayout?.bringToFront()
                        } else {
                            remoteVideoPausedOverlay?.visibility = View.GONE
                        }
                        pipContainer?.visibility = View.VISIBLE
                        pipContainer?.bringToFront()
                    }
                }
            }
        }
    }

    private fun onCallConnected() {
        stopOutgoingRingtone()
        wasAnswered = true
        YambiCallModule.markCallAnswered(callId)
        if (callState == CallState.CONNECTED) return
        callState = CallState.CONNECTED
        Log.d(TAG, "Call CONNECTED — starting duration timer")
        mainHandler.removeCallbacks(timeoutRunnable)
        setAudioModeInCall()
        webRTC.toggleMute(isMuted)

        if (callConnectedTimestamp == 0L) {
            callConnectedTimestamp = System.currentTimeMillis()
        }

        YambiCallService.activeSession = ActiveCallSession(
            callId = callId,
            callerId = callerId,
            calleeId = calleeId,
            callerName = callerName,
            callerAvatar = callerAvatar,
            calleeName = calleeName,
            calleeAvatar = calleeAvatar,
            callType = callType,
            isCaller = isCaller,
            userPhone = userPhone,
            connectedAt = callConnectedTimestamp,
            isMuted = isMuted,
            isSpeakerOn = isSpeakerOn
        )

        updateSubtitle(formatDuration(0))
        mainHandler.removeCallbacks(durationTick)
        mainHandler.post(durationTick)

        val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
        YambiCallService.startOngoing(this, callId, otherName, callType, callConnectedTimestamp)
    }

    private fun resumeExistingCall() {
        stopOutgoingRingtone()
        Log.d(TAG, "resumeExistingCall: callId=$callId, caller=$callerName, callee=$calleeName, connectedAt=$callConnectedTimestamp")
        wasAnswered = true
        YambiCallModule.markCallAnswered(callId)
        mainHandler.removeCallbacks(timeoutRunnable)

        callState = CallState.CONNECTED
        setAudioModeInCall()
        showActiveControls()

        val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
        nameView?.text = otherName

        if (callConnectedTimestamp > 0L) {
            val elapsed = ((System.currentTimeMillis() - callConnectedTimestamp) / 1000).toInt()
            durationSeconds = maxOf(0, elapsed)
        }
        updateSubtitle(formatDuration(durationSeconds))

        mainHandler.removeCallbacks(durationTick)
        mainHandler.post(durationTick)

        // Restaurer l'état muet / haut-parleur depuis la session active
        YambiCallService.activeSession?.let { session ->
            if (session.isMuted != isMuted) {
                isMuted = session.isMuted
                webRTC.toggleMute(isMuted)
                muteBtnBg?.background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(if (isMuted) Color.parseColor("#EF4444") else Color.parseColor("#3A3A3C"))
                }
                muteIconView?.setImageResource(if (isMuted) R.drawable.ic_call_mic_off else R.drawable.ic_call_mic_on)
            }
            if (session.isSpeakerOn != isSpeakerOn) {
                isSpeakerOn = session.isSpeakerOn
                speakerBtnBg?.background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(if (isSpeakerOn) Color.parseColor("#3B82F6") else Color.parseColor("#3A3A3C"))
                }
                speakerIconView?.setImageResource(if (isSpeakerOn) R.drawable.ic_call_speaker_on else R.drawable.ic_call_speaker_off)
                try {
                    val am = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
                    am?.isSpeakerphoneOn = isSpeakerOn
                } catch (_: Exception) {}
            }
            if (session.isCameraOff != isCameraOff) {
                isCameraOff = session.isCameraOff
                webRTC.toggleCamera(isCameraOff)
                videoPauseBtnBg?.background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(if (isCameraOff) Color.parseColor("#EF4444") else Color.parseColor("#3A3A3C"))
                }
                videoPauseIconView?.setImageResource(
                    if (isCameraOff) R.drawable.ic_call_video_off else R.drawable.ic_call_video
                )
                videoPauseLabel?.text = if (isCameraOff) {
                    getCallString("resume_video", "Reprendre")
                } else {
                    getCallString("pause_video", "Pause")
                }
                localPipPausedOverlay?.visibility = if (isCameraOff) View.VISIBLE else View.GONE
            }
        }

        // Reconnecter les renderers vidéo si appel vidéo
        if (callType.equals("video", ignoreCase = true)) {
            val track = webRTC.remoteVideoTrack
            if (track != null && remoteRenderer != null) {
                remoteVideoTrack = track
                remoteRenderer?.visibility = View.VISIBLE
                if (!isRemoteRendererInitialized) {
                    webRTC.attachRemoteRenderer(remoteRenderer!!)
                    isRemoteRendererInitialized = true
                }
                webRTC.addRemoteRendererSink(remoteRenderer!!, track)
                avatarRingLayout?.visibility = View.GONE
                backgroundImageView?.visibility = View.GONE
                backgroundOverlayView?.visibility = View.GONE
                pipContainer?.visibility = View.VISIBLE
                pipContainer?.bringToFront()
            }
            if (localRenderer != null && !isLocalRendererInitialized) {
                webRTC.attachLocalRenderer(localRenderer!!)
                isLocalRendererInitialized = true
            }
        }

        setupSignalingCallbacks()
        setupWebRTCCallbacks()

        YambiCallService.startOngoing(this, callId, otherName, callType, callConnectedTimestamp, getOtherAvatar())
    }

    private fun toggleControlsVisibility() {
        if (!callType.equals("video", ignoreCase = true)) return
        if (isInPipMode) return
        if (callState != CallState.CONNECTED && callState != CallState.CONNECTING) return

        isControlsVisible = !isControlsVisible

        subtitleView?.animate()?.cancel()
        nameRowLayout?.animate()?.cancel()
        bottomControlsContainer?.animate()?.cancel()

        if (isControlsVisible) {
            subtitleView?.visibility = View.VISIBLE
            nameRowLayout?.visibility = View.VISIBLE
            bottomControlsContainer?.visibility = View.VISIBLE

            subtitleView?.animate()?.alpha(1f)?.setDuration(200)?.start()
            nameRowLayout?.animate()?.alpha(1f)?.setDuration(200)?.start()
            bottomControlsContainer?.animate()?.alpha(1f)?.setDuration(200)?.start()
        } else {
            subtitleView?.animate()?.alpha(0f)?.setDuration(200)?.start()
            nameRowLayout?.animate()?.alpha(0f)?.setDuration(200)?.start()
            bottomControlsContainer?.animate()?.alpha(0f)?.setDuration(200)?.withEndAction {
                if (!isControlsVisible) {
                    subtitleView?.visibility = View.GONE
                    nameRowLayout?.visibility = View.GONE
                    bottomControlsContainer?.visibility = View.GONE
                }
            }?.start()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fin d'appel et Enregistrement
    // ─────────────────────────────────────────────────────────────────────────

    private fun endCall(reason: String, remote: Boolean) {
        if (callState == CallState.ENDED) return
        callState = CallState.ENDED
        hasCreatedOffer = false
        hasCreatedAnswer = false
        hasHandledAnswer = false
        Log.d(TAG, "Ending call: reason=$reason remote=$remote duration=${durationSeconds}s")

        mainHandler.removeCallbacks(durationTick)
        mainHandler.removeCallbacks(timeoutRunnable)

        if (!remote) {
            signaling.sendEnd(callId, callerId, calleeId, durationSeconds)
        }

        val finalLabel = when (reason) {
            "REJECTED" -> getCallString("call_rejected", "Appel refusé")
            "BUSY" -> getCallString("user_busy", "Occupé")
            "CANCELLED" -> getCallString("no_answer", "Appel annulé")
            "TIMEOUT" -> getCallString("no_answer", "Sans réponse")
            else -> getCallString("call_ended", "Appel terminé")
        }
        updateSubtitle(finalLabel)
        subtitleView?.setTextColor(Color.parseColor("#FF3B30"))

        restoreAudioMode()
        IncomingCallNotificationManager.stopRinging()
        IncomingCallNotificationManager.dismissOngoingNotification(this)
        IncomingCallNotificationManager.dismissNotification(this, callId)
        callConnectedTimestamp = 0L
        YambiCallService.stop(this)

        scope.launch(Dispatchers.IO) {
            saveCallHistory(reason)
        }

        notifyRNCallEnded(reason)

        stopOutgoingRingtone()
        playEndCallSound()

        mainHandler.postDelayed({ finish() }, 800)
    }

    private fun saveCallHistory(reason: String) {
        val isReallyAnswered = wasAnswered || durationSeconds > 0 || callState == CallState.CONNECTED
        val direction = when {
            isCaller -> "outgoing"
            isReallyAnswered -> "incoming"
            reason == "REJECTED" -> "rejected"
            reason == "CANCELLED" || reason == "TIMEOUT" -> "missed"
            else -> "missed"
        }
        val status = when {
            isReallyAnswered -> "ENDED"
            reason == "REJECTED" -> "REJECTED"
            reason == "BUSY" -> "BUSY"
            reason == "TIMEOUT" -> "TIMEOUT"
            reason == "CANCELLED" -> "CANCELLED"
            else -> reason
        }

        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        val nowIso = sdf.format(Date())

        val entry = CallHistoryEntity(
            id = "hist_$callId",
            callId = callId,
            callerId = callerId,
            calleeId = calleeId,
            callerName = callerName,
            callerAvatar = callerAvatar,
            calleeName = calleeName,
            calleeAvatar = calleeAvatar,
            type = callType,
            direction = direction,
            status = status,
            durationSeconds = durationSeconds,
            createdAt = nowIso,
            timestamp = System.currentTimeMillis(),
            syncedToRealm = 0
        )

        try {
            CallHistoryDatabase.getInstance(this).dao().insert(entry)
            Log.d(TAG, "Call history saved: $direction $durationSeconds s")
        } catch (e: Exception) {
            Log.e(TAG, "Error saving call history: ${e.message}", e)
        }
    }

    private fun notifyRNCallEnded(reason: String) {
        val data = mapOf(
            "callId" to callId,
            "duration" to durationSeconds,
            "reason" to reason
        )
        YambiCallModule.emitToJS("onCallEnded", data)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Audio Routing & Focus
    // ─────────────────────────────────────────────────────────────────────────

    private var audioFocusRequest: Any? = null

    private fun setAudioModeInCall() {
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return

            // Demande d'audio focus immédiate pour communication vocale VoIP
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (audioFocusRequest == null) {
                    val playbackAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                    val focusReq = android.media.AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                        .setAudioAttributes(playbackAttributes)
                        .setAcceptsDelayedFocusGain(false)
                        .setOnAudioFocusChangeListener { /* garder le focus */ }
                        .build()
                    audioFocusRequest = focusReq
                    am.requestAudioFocus(focusReq)
                }
            } else {
                @Suppress("DEPRECATION")
                am.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
            }

            am.mode = AudioManager.MODE_IN_COMMUNICATION
            if (callType.equals("video", ignoreCase = true)) {
                isSpeakerOn = true
                am.isSpeakerphoneOn = true
            } else {
                am.isSpeakerphoneOn = isSpeakerOn
            }
            am.isMicrophoneMute = isMuted
            webRTC.toggleMute(isMuted)
            Log.d(TAG, "Audio mode set to MODE_IN_COMMUNICATION with audio focus (speaker: $isSpeakerOn, muted: $isMuted)")
        } catch (e: Exception) {
            Log.e(TAG, "Error setting audio mode: ${e.message}", e)
        }
    }

    private fun restoreAudioMode() {
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                (audioFocusRequest as? android.media.AudioFocusRequest)?.let { am.abandonAudioFocusRequest(it) }
                audioFocusRequest = null
            } else {
                @Suppress("DEPRECATION")
                am.abandonAudioFocus(null)
            }
            am.isSpeakerphoneOn = false
            am.isMicrophoneMute = false
            am.mode = AudioManager.MODE_NORMAL
            Log.d(TAG, "Audio mode restored to MODE_NORMAL")
        } catch (e: Exception) {
            Log.e(TAG, "Error restoring audio mode: ${e.message}", e)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utilitaires UI
    // ─────────────────────────────────────────────────────────────────────────

    private fun updateSubtitle(text: String) {
        subtitleView?.text = text
    }

    private fun formatDuration(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return String.format(Locale.US, "%02d:%02d", m, s)
    }

    private fun resolveAvatarUrl(avatarUrl: String): String {
        if (avatarUrl.isBlank()) return ""
        if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
            return avatarUrl
        }
        val clean = avatarUrl.trimStart('/')
        return when {
            clean.startsWith("media/profile_pictures/") -> "https://server.yambi.net/$clean"
            clean.startsWith("profile_pictures/") -> "https://server.yambi.net/media/$clean"
            else -> "https://server.yambi.net/media/profile_pictures/$clean"
        }
    }

    private fun loadAvatarImage(avatarUrl: String) {
        if (avatarUrl.isBlank()) return
        val fullUrl = resolveAvatarUrl(avatarUrl)
        val executor = Executors.newSingleThreadExecutor()
        executor.execute {
            try {
                val url = URL(fullUrl)
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 6000
                conn.readTimeout = 6000
                conn.doInput = true
                conn.connect()
                val stream = conn.inputStream
                val bitmap = BitmapFactory.decodeStream(stream)
                stream.close()
                conn.disconnect()

                if (bitmap != null) {
                    val circular = getCircularBitmap(bitmap)
                    IncomingCallNotificationManager.setCachedAvatarBitmap(avatarUrl, circular)
                    IncomingCallNotificationManager.setCachedAvatarBitmap(fullUrl, circular)
                    runOnUiThread {
                        if (!isFinishing && !isDestroyed) {
                            avatarImageView?.setPadding(0, 0, 0, 0)
                            avatarImageView?.scaleType = ImageView.ScaleType.CENTER_CROP
                            avatarImageView?.setImageBitmap(circular)

                            backgroundImageView?.setImageBitmap(bitmap)
                            backgroundImageView?.visibility = View.VISIBLE
                            backgroundOverlayView?.visibility = View.VISIBLE
                        }
                    }

                    // Si un appel ou une session est en cours, rafraîchir la notification pour afficher immédiatement la photo
                    if (isCallActive() || YambiCallService.activeSession != null) {
                        val session = YambiCallService.activeSession
                        val effectiveConnectedAt = session?.connectedAt ?: callConnectedTimestamp
                        val otherName = if (isCaller) calleeName.ifBlank { calleeId } else callerName.ifBlank { callerId }
                        IncomingCallNotificationManager.showOngoingCallNotification(
                            this@IncomingCallActivity,
                            callId,
                            otherName,
                            callType,
                            effectiveConnectedAt,
                            avatarUrl
                        )
                    }
                } else {
                    runOnUiThread {
                        if (!isFinishing && !isDestroyed) {
                            loadDefaultAvatar()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading avatar image: ${e.message}")
                runOnUiThread {
                    if (!isFinishing && !isDestroyed) {
                        loadDefaultAvatar()
                    }
                }
            }
        }
    }

    private fun loadDefaultAvatar() {
        try {
            val bitmap = BitmapFactory.decodeResource(resources, R.drawable.profile_black)
            if (bitmap != null) {
                val circular = getCircularBitmap(bitmap)
                IncomingCallNotificationManager.setCachedAvatarBitmap("default_profile_black", circular)
                runOnUiThread {
                    if (!isFinishing && !isDestroyed) {
                        avatarImageView?.setPadding(0, 0, 0, 0)
                        avatarImageView?.scaleType = ImageView.ScaleType.CENTER_CROP
                        avatarImageView?.setImageBitmap(circular)

                        backgroundImageView?.setImageBitmap(bitmap)
                        backgroundImageView?.visibility = View.VISIBLE
                        backgroundOverlayView?.visibility = View.VISIBLE
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading default profile_black avatar: ${e.message}")
        }
    }

    private fun getCircularBitmap(src: Bitmap): Bitmap {
        val size = Math.min(src.width, src.height)
        val x = (src.width - size) / 2
        val y = (src.height - size) / 2
        val squared = Bitmap.createBitmap(src, x, y, size, size)

        val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val paint = Paint().apply {
            isAntiAlias = true
            isFilterBitmap = true
        }
        val rect = Rect(0, 0, size, size)
        val rectF = RectF(rect)
        canvas.drawARGB(0, 0, 0, 0)
        canvas.drawRoundRect(rectF, size / 2f, size / 2f, paint)
        paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
        canvas.drawBitmap(squared, rect, rect, paint)
        return output
    }
}

package com.yambi.call

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

data class ActiveCallSession(
    val callId: String,
    val callerId: String = "",
    val calleeId: String = "",
    val callerName: String = "",
    val callerAvatar: String = "",
    val calleeName: String = "",
    val calleeAvatar: String = "",
    val callType: String = "audio",
    val isCaller: Boolean = false,
    val userPhone: String = "",
    var connectedAt: Long = 0L,
    var isMuted: Boolean = false,
    var isSpeakerOn: Boolean = false,
    var isCameraOff: Boolean = false
)

class YambiCallService : Service() {

  companion object {
    const val ACTION_START_INCOMING = "ACTION_START_INCOMING"
    const val ACTION_START_ONGOING = "ACTION_START_ONGOING"

    @Volatile
    var activeSession: ActiveCallSession? = null

    fun start(
      context: Context,
      callId: String,
      callerId: String,
      callerName: String,
      callerAvatar: String?,
      callType: String,
      isVerified: Boolean = false,
      calleeId: String = ""
    ) {
      val intent = Intent(context, YambiCallService::class.java).apply {
        action = ACTION_START_INCOMING
        putExtra("callId", callId)
        putExtra("callerId", callerId)
        putExtra("callerName", callerName)
        putExtra("callerAvatar", callerAvatar ?: "")
        putExtra("callType", callType)
        putExtra("isVerified", isVerified)
        putExtra("calleeId", calleeId)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun startOngoing(
      context: Context,
      callId: String,
      otherName: String,
      callType: String,
      connectedAt: Long = 0L,
      otherAvatar: String = ""
    ) {
      val intent = Intent(context, YambiCallService::class.java).apply {
        action = ACTION_START_ONGOING
        putExtra("callId", callId)
        putExtra("otherName", otherName)
        putExtra("callType", callType)
        putExtra("connectedAt", connectedAt)
        putExtra("otherAvatar", otherAvatar)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      activeSession = null
      val intent = Intent(context, YambiCallService::class.java)
      context.stopService(intent)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent != null) {
      val action = intent.action ?: ACTION_START_INCOMING
      if (action == ACTION_START_ONGOING) {
        val callId = intent.getStringExtra("callId") ?: ""
        val otherName = intent.getStringExtra("otherName") ?: ""
        val callType = intent.getStringExtra("callType") ?: "audio"
        val connectedAt = intent.getLongExtra("connectedAt", 0L)
        val otherAvatar = intent.getStringExtra("otherAvatar") ?: ""
        val effectiveConnectedAt = if (connectedAt > 0L) connectedAt else (activeSession?.connectedAt ?: 0L)

        try {
          val notification = IncomingCallNotificationManager.showOngoingCallNotification(
            this,
            callId,
            otherName,
            callType,
            effectiveConnectedAt,
            otherAvatar
          )

          try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
              try {
                startForeground(
                  IncomingCallNotificationManager.ONGOING_NOTIFICATION_ID,
                  notification,
                  ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                )
              } catch (eType: Exception) {
                android.util.Log.w("YambiCallService", "Typed ongoing startForeground failed, trying standard: ${eType.message}")
                startForeground(IncomingCallNotificationManager.ONGOING_NOTIFICATION_ID, notification)
              }
            } else {
              startForeground(IncomingCallNotificationManager.ONGOING_NOTIFICATION_ID, notification)
            }
          } catch (e: Exception) {
            android.util.Log.e("YambiCallService", "Failed ongoing startForeground: ${e.message}", e)
          }
        } catch (e: Exception) {
          android.util.Log.e("YambiCallService", "Error in ongoing call notification: ${e.message}", e)
        }
      } else {
        val callId = intent.getStringExtra("callId") ?: ""
        val callerId = intent.getStringExtra("callerId") ?: ""
        val calleeId = intent.getStringExtra("calleeId") ?: ""
        val callerName = intent.getStringExtra("callerName") ?: callerId
        val callerAvatar = intent.getStringExtra("callerAvatar")
        val callType = intent.getStringExtra("callType") ?: "audio"
        val isVerified = intent.getBooleanExtra("isVerified", false)

        try {
          val notification = IncomingCallNotificationManager.showIncomingCallNotification(
            this,
            callId,
            callerId,
            callerName,
            callerAvatar,
            callType,
            isVerified,
            calleeId
          )

          if (callerId.isNotBlank() && calleeId.isNotBlank()) {
            try {
              NativeSignalingManager.instance.connect(calleeId)
              NativeSignalingManager.instance.sendRinging(callId, callerId, calleeId)
            } catch (_: Exception) {}
          }

          try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
              try {
                startForeground(
                  IncomingCallNotificationManager.NOTIFICATION_ID,
                  notification,
                  ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                )
              } catch (eType: Exception) {
                android.util.Log.w("YambiCallService", "Typed incoming startForeground failed, trying standard: ${eType.message}")
                startForeground(IncomingCallNotificationManager.NOTIFICATION_ID, notification)
              }
            } else {
              startForeground(IncomingCallNotificationManager.NOTIFICATION_ID, notification)
            }
          } catch (e: Exception) {
            android.util.Log.e("YambiCallService", "Failed incoming startForeground: ${e.message}", e)
          }
        } catch (e: Exception) {
          android.util.Log.e("YambiCallService", "Error in incoming call notification: ${e.message}", e)
        }
      }
    }

    return START_NOT_STICKY
  }

  override fun onDestroy() {
    super.onDestroy()
    activeSession = null
    IncomingCallNotificationManager.stopRinging()
    IncomingCallNotificationManager.dismissOngoingNotification(this)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
  }
}

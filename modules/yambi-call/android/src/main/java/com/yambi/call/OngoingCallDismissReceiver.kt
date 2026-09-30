package com.yambi.call

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * OngoingCallDismissReceiver — Sécurité absolue pour empêcher la fermeture de la notification.
 * Si l'utilisateur tente de glisser/supprimer la notification d'appel alors que l'appel
 * est encore en cours, ce BroadcastReceiver intercepte l'événement (via deleteIntent)
 * et republie immédiatement la notification pour ne jamais perdre l'appel.
 */
class OngoingCallDismissReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "[YAMBI_DISMISS_REC]"
        const val ACTION_ONGOING_CALL_DISMISSED = "com.yambi.call.ACTION_ONGOING_CALL_DISMISSED"
        const val ACTION_INCOMING_CALL_DISMISSED = "com.yambi.call.ACTION_INCOMING_CALL_DISMISSED"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.d(TAG, "Notification swipe-dismiss detected for action=$action")

        if (action == ACTION_INCOMING_CALL_DISMISSED) {
            val callId = intent.getStringExtra("callId") ?: ""
            if (IncomingCallActivity.isCallActive() || callId.isNotBlank()) {
                val callerId = intent.getStringExtra("callerId") ?: ""
                val callerName = intent.getStringExtra("callerName") ?: callerId
                val callerAvatar = intent.getStringExtra("callerAvatar")
                val callType = intent.getStringExtra("callType") ?: "audio"
                val isVerified = intent.getBooleanExtra("isVerified", false)
                val calleeId = intent.getStringExtra("calleeId") ?: ""

                Log.i(TAG, "Incoming call notification dismissal intercepted! Re-asserting notification immediately for callId=$callId")
                IncomingCallNotificationManager.showIncomingCallNotification(
                    context, callId, callerId, callerName, callerAvatar, callType, isVerified, calleeId
                )
            }
            return
        }

        if (action == ACTION_ONGOING_CALL_DISMISSED) {
            if (IncomingCallActivity.isCallActive()) {
                val session = YambiCallService.activeSession
                val callId = intent.getStringExtra("callId") ?: session?.callId ?: ""
                val otherName = intent.getStringExtra("otherName") ?: (
                    if (session?.isCaller == true) session.calleeName.ifBlank { session.calleeId }
                    else session?.callerName?.ifBlank { session?.callerId ?: "Yambi Call" } ?: "Yambi Call"
                )
                val callType = intent.getStringExtra("callType") ?: session?.callType ?: "audio"
                val connectedAt = intent.getLongExtra("connectedAt", session?.connectedAt ?: 0L)
                val otherAvatar = intent.getStringExtra("otherAvatar") ?: (
                    if (session?.isCaller == true) session.calleeAvatar
                    else session?.callerAvatar ?: ""
                )

                Log.i(TAG, "Call is active! Instantly re-asserting ongoing notification for callId=$callId")
                YambiCallService.startOngoing(context, callId, otherName, callType, connectedAt, otherAvatar)
            }
        }
    }
}

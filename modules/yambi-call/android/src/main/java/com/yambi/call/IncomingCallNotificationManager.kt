package com.yambi.call

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import androidx.core.graphics.drawable.IconCompat
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

object IncomingCallNotificationManager {
  private const val CHANNEL_ID = "yambi_incoming_calls_channel_v2"
  private const val CHANNEL_NAME = "Appels entrants Yambi"
  public const val NOTIFICATION_ID = 998822

  private const val ONGOING_CHANNEL_ID = "yambi_ongoing_calls_channel_v3"
  private const val ONGOING_CHANNEL_NAME = "Appels en cours Yambi"
  public const val ONGOING_NOTIFICATION_ID = 998833

  private var ringtone: Ringtone? = null
  private var vibrator: Vibrator? = null

  private val avatarBitmapCache = ConcurrentHashMap<String, Bitmap>()

  fun setCachedAvatarBitmap(avatarUrl: String?, bitmap: Bitmap) {
    if (!avatarUrl.isNullOrBlank() && !bitmap.isRecycled) {
      avatarBitmapCache[avatarUrl] = bitmap
    }
  }

  fun getCachedAvatarBitmap(avatarUrl: String?): Bitmap? {
    if (avatarUrl.isNullOrBlank()) return null
    val cached = avatarBitmapCache[avatarUrl]
    if (cached != null && !cached.isRecycled) return cached
    return null
  }

  fun createCircularBitmap(src: Bitmap): Bitmap {
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

  fun loadAvatarBitmapAsync(
    context: Context,
    avatarUrl: String?,
    onLoaded: (Bitmap) -> Unit
  ) {
    if (avatarUrl.isNullOrBlank()) {
      val cached = getCachedAvatarBitmap("default_profile_black")
      if (cached != null) {
        onLoaded(cached)
        return
      }
      try {
        val rawBitmap = BitmapFactory.decodeResource(context.resources, R.drawable.profile_black)
        if (rawBitmap != null) {
          val circular = createCircularBitmap(rawBitmap)
          avatarBitmapCache["default_profile_black"] = circular
          onLoaded(circular)
        }
      } catch (_: Exception) {}
      return
    }

    val cached = getCachedAvatarBitmap(avatarUrl)
    if (cached != null) {
      onLoaded(cached)
      return
    }

    Executors.newSingleThreadExecutor().execute {
      try {
        val clean = avatarUrl.trimStart('/')
        val fullUrl = when {
          avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://") -> avatarUrl
          clean.startsWith("media/profile_pictures/") -> "https://server.yambi.net/$clean"
          clean.startsWith("profile_pictures/") -> "https://server.yambi.net/media/$clean"
          else -> "https://server.yambi.net/media/profile_pictures/$clean"
        }

        val url = java.net.URL(fullUrl)
        val conn = url.openConnection() as java.net.HttpURLConnection
        conn.connectTimeout = 4000
        conn.readTimeout = 4000
        conn.doInput = true
        conn.connect()
        val inputStream = conn.inputStream
        val rawBitmap = BitmapFactory.decodeStream(inputStream)
        inputStream.close()
        conn.disconnect()

        if (rawBitmap != null) {
          val circular = createCircularBitmap(rawBitmap)
          avatarBitmapCache[avatarUrl] = circular
          android.os.Handler(android.os.Looper.getMainLooper()).post {
            onLoaded(circular)
          }
        } else {
          try {
            val defaultBmp = BitmapFactory.decodeResource(context.resources, R.drawable.profile_black)
            if (defaultBmp != null) {
              val circular = createCircularBitmap(defaultBmp)
              avatarBitmapCache["default_profile_black"] = circular
              android.os.Handler(android.os.Looper.getMainLooper()).post {
                onLoaded(circular)
              }
            }
          } catch (_: Exception) {}
        }
      } catch (e: Exception) {
        android.util.Log.w("IncomingCallNotif", "Error loading avatar bitmap: ${e.message}")
        try {
          val defaultBmp = BitmapFactory.decodeResource(context.resources, R.drawable.profile_black)
          if (defaultBmp != null) {
            val circular = createCircularBitmap(defaultBmp)
            avatarBitmapCache["default_profile_black"] = circular
            android.os.Handler(android.os.Looper.getMainLooper()).post {
              onLoaded(circular)
            }
          }
        } catch (_: Exception) {}
      }
    }
  }

  fun getSystemRingtoneUri(context: Context): Uri {
    return RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_RINGTONE)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
  }

  fun createNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      // Clean up legacy channel to avoid cached configurations or conflict
      try {
        notificationManager.deleteNotificationChannel("yambi_incoming_calls_channel")
        notificationManager.deleteNotificationChannel("incoming_calls")
      } catch (e: Exception) {
        // ignore
      }

      val existingChannel = notificationManager.getNotificationChannel(CHANNEL_ID)
      if (existingChannel == null) {
        val channel = NotificationChannel(
          CHANNEL_ID,
          CHANNEL_NAME,
          NotificationManager.IMPORTANCE_HIGH
        ).apply {
          description = "Notifications pour les appels audio et vidéo entrants"
          setSound(null, null)
          enableVibration(false)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        notificationManager.createNotificationChannel(channel)
      }
    }
  }

  fun createOngoingNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val existingChannel = notificationManager.getNotificationChannel(ONGOING_CHANNEL_ID)
      if (existingChannel == null) {
        val channel = NotificationChannel(
          ONGOING_CHANNEL_ID,
          ONGOING_CHANNEL_NAME,
          NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
          description = "Notification pour les appels en cours"
          setSound(null, null)
          enableVibration(false)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        notificationManager.createNotificationChannel(channel)
      }
    }
  }

  fun showIncomingCallNotification(
    context: Context,
    callId: String,
    callerId: String,
    callerName: String,
    callerAvatar: String?,
    callType: String,
    isVerified: Boolean = false,
    calleeId: String = ""
  ): Notification {
    createNotificationChannel(context)

    // Fullscreen Intent to IncomingCallActivity
    val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      putExtra("callId", callId)
      putExtra("callerId", callerId)
      putExtra("callerName", callerName)
      putExtra("callerAvatar", callerAvatar ?: "")
      putExtra("callType", callType)
      putExtra("isVerified", isVerified)
      putExtra("calleeId", calleeId)
    }

    val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }

    val fullScreenPendingIntent = PendingIntent.getActivity(
      context,
      NOTIFICATION_ID,
      fullScreenIntent,
      piFlags
    )

    // Intent for Accept Action
    val acceptIntent = Intent(context, IncomingCallActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      action = "ACTION_ACCEPT"
      putExtra("callId", callId)
      putExtra("callerId", callerId)
      putExtra("callerName", callerName)
      putExtra("callerAvatar", callerAvatar ?: "")
      putExtra("callType", callType)
      putExtra("isVerified", isVerified)
      putExtra("calleeId", calleeId)
    }
    val acceptPendingIntent = PendingIntent.getActivity(
      context,
      NOTIFICATION_ID + 1,
      acceptIntent,
      piFlags
    )

    // Intent for Reject Action
    val rejectIntent = Intent(context, IncomingCallActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      action = "ACTION_REJECT"
      putExtra("callId", callId)
      putExtra("callerId", callerId)
      putExtra("callerName", callerName)
      putExtra("callType", callType)
      putExtra("calleeId", calleeId)
    }
    val rejectPendingIntent = PendingIntent.getActivity(
      context,
      NOTIFICATION_ID + 2,
      rejectIntent,
      piFlags
    )

    // DeleteIntent pour intercepter et bloquer toute tentative de glissement/effacement de l'appel entrant
    val deleteIntent = Intent(context, OngoingCallDismissReceiver::class.java).apply {
      action = OngoingCallDismissReceiver.ACTION_INCOMING_CALL_DISMISSED
      putExtra("callId", callId)
      putExtra("callerId", callerId)
      putExtra("callerName", callerName)
      putExtra("callerAvatar", callerAvatar ?: "")
      putExtra("callType", callType)
      putExtra("isVerified", isVerified)
      putExtra("calleeId", calleeId)
    }
    val deletePendingIntent = PendingIntent.getBroadcast(
      context,
      NOTIFICATION_ID + 3,
      deleteIntent,
      piFlags
    )

    val title = if (callerName.isNotBlank()) callerName else callerId
    val isVideo = callType.equals("video", ignoreCase = true)
    val subtitle = if (isVideo) {
      getCallString(context, "incoming_video_call", "Appel vidéo entrant...")
    } else {
      getCallString(context, "incoming_audio_call", "Appel audio entrant...")
    }

    // Small icon
    val iconResId = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
      .let { if (it == 0) android.R.drawable.sym_call_incoming else it }

    val cachedAvatar = getCachedAvatarBitmap(callerAvatar)

    val notificationBuilder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(iconResId)
      .setContentTitle(title)
      .setContentText(subtitle)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(false)
      .setOngoing(true)
      .setSound(null)
      .setContentIntent(fullScreenPendingIntent)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .setDeleteIntent(deletePendingIntent)

    if (cachedAvatar != null) {
      notificationBuilder.setLargeIcon(cachedAvatar)
    }

    // CallStyle officiel Android pour appel entrant (verrouille le swipe-dismiss et affiche les boutons natifs)
    var callStyleApplied = false
    try {
      val callerPersonBuilder = Person.Builder()
        .setName(title)
        .setImportant(true)

      if (cachedAvatar != null) {
        callerPersonBuilder.setIcon(IconCompat.createWithBitmap(cachedAvatar))
      } else {
        callerPersonBuilder.setIcon(IconCompat.createWithResource(context, iconResId))
      }

      val callerPerson = callerPersonBuilder.build()
      val callStyle = NotificationCompat.CallStyle.forIncomingCall(
        callerPerson,
        rejectPendingIntent,
        acceptPendingIntent
      )
      notificationBuilder.setStyle(callStyle)
      callStyleApplied = true
    } catch (t: Throwable) {
      android.util.Log.w("IncomingCallNotificationManager", "Could not apply CallStyle: ${t.message}")
    }

    // Boutons de secours si CallStyle non supporté par la version de la bibliothèque
    if (!callStyleApplied) {
      notificationBuilder.addAction(
        android.R.drawable.ic_menu_close_clear_cancel,
        getCallString(context, "decline", "Refuser"),
        rejectPendingIntent
      )
      notificationBuilder.addAction(
        android.R.drawable.ic_menu_call,
        getCallString(context, "accept", "Accepter"),
        acceptPendingIntent
      )
    }

    if (cachedAvatar == null && !callerAvatar.isNullOrBlank()) {
      loadAvatarBitmapAsync(context, callerAvatar) { loadedBitmap ->
        try {
          notificationBuilder.setLargeIcon(loadedBitmap)
          try {
            val callerPerson = Person.Builder()
              .setName(title)
              .setImportant(true)
              .setIcon(IconCompat.createWithBitmap(loadedBitmap))
              .build()
            notificationBuilder.setStyle(
              NotificationCompat.CallStyle.forIncomingCall(
                callerPerson,
                rejectPendingIntent,
                acceptPendingIntent
              )
            )
          } catch (_: Throwable) {}
          val updatedNotification = notificationBuilder.build().apply {
            flags = flags or Notification.FLAG_ONGOING_EVENT or Notification.FLAG_NO_CLEAR
          }
          val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
          nm.notify(NOTIFICATION_ID, updatedNotification)
        } catch (_: Exception) {}
      }
    }

    // Sécurisation stricte : interdire toute suppression (swipe ou 'Tout effacer')
    val notification = notificationBuilder.build().apply {
      flags = flags or Notification.FLAG_ONGOING_EVENT or Notification.FLAG_NO_CLEAR
    }

    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    notificationManager.notify(NOTIFICATION_ID, notification)

    startRinging(context)

    try {
      context.startActivity(fullScreenIntent)
    } catch (e: Exception) {
      e.printStackTrace()
    }

    return notification
  }

  fun showOngoingCallNotification(
    context: Context,
    callId: String,
    otherName: String,
    callType: String,
    connectedAt: Long = 0L,
    otherAvatar: String = ""
  ): Notification {
    createOngoingNotificationChannel(context)

    val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }

    val session = YambiCallService.activeSession
    val effectiveConnectedAt = if (connectedAt > 0L) connectedAt else (session?.connectedAt ?: 0L)
    val effectiveAvatar = if (otherAvatar.isNotBlank()) {
      otherAvatar
    } else if (session != null) {
      if (session.isCaller) session.calleeAvatar else session.callerAvatar
    } else {
      ""
    }

    val resumeIntent = Intent(context, IncomingCallActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      action = "ACTION_RESUME_CALL"
      putExtra("callId", callId)
      putExtra("callerId", session?.callerId ?: "")
      putExtra("calleeId", session?.calleeId ?: "")
      putExtra("callerName", session?.callerName ?: "")
      putExtra("callerAvatar", session?.callerAvatar ?: "")
      putExtra("calleeName", session?.calleeName ?: "")
      putExtra("calleeAvatar", session?.calleeAvatar ?: "")
      putExtra("callType", session?.callType ?: callType)
      putExtra("isCaller", session?.isCaller ?: false)
      putExtra("userPhone", session?.userPhone ?: "")
      putExtra("connectedAt", effectiveConnectedAt)
    }
    val resumePendingIntent = PendingIntent.getActivity(
      context,
      ONGOING_NOTIFICATION_ID,
      resumeIntent,
      piFlags
    )

    val endIntent = Intent(context, IncomingCallActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
      action = "ACTION_END_CALL"
      putExtra("callId", callId)
    }
    val endPendingIntent = PendingIntent.getActivity(
      context,
      ONGOING_NOTIFICATION_ID + 1,
      endIntent,
      piFlags
    )

    val deleteIntent = Intent(context, OngoingCallDismissReceiver::class.java).apply {
      action = OngoingCallDismissReceiver.ACTION_ONGOING_CALL_DISMISSED
      putExtra("callId", callId)
      putExtra("otherName", otherName)
      putExtra("callType", callType)
      putExtra("connectedAt", effectiveConnectedAt)
      putExtra("otherAvatar", effectiveAvatar)
    }
    val deletePendingIntent = PendingIntent.getBroadcast(
      context,
      ONGOING_NOTIFICATION_ID + 2,
      deleteIntent,
      piFlags
    )

    val isVideo = callType.equals("video", ignoreCase = true)
    val subtitle = if (isVideo) {
      getCallString(context, "ongoing_video_call", "Appel vidéo en cours...")
    } else {
      getCallString(context, "ongoing_audio_call", "Appel audio en cours...")
    }

    val iconResId = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
      .let { if (it == 0) android.R.drawable.sym_call_incoming else it }

    val cachedAvatar = getCachedAvatarBitmap(effectiveAvatar)

    val notificationBuilder = NotificationCompat.Builder(context, ONGOING_CHANNEL_ID)
      .setSmallIcon(iconResId)
      .setContentTitle(if (otherName.isNotBlank()) otherName else "Yambi Call")
      .setContentText(subtitle)
      .setSubText(getCallString(context, "tap_to_return", "Appuyez pour revenir à l'appel"))
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(false)
      .setOngoing(true)
      .setSound(null)
      .setUsesChronometer(true)
      .setWhen(if (effectiveConnectedAt > 0L) effectiveConnectedAt else System.currentTimeMillis())
      .setContentIntent(resumePendingIntent)
      .setDeleteIntent(deletePendingIntent)

    if (cachedAvatar != null) {
      notificationBuilder.setLargeIcon(cachedAvatar)
    }

    // CallStyle officiel Android (fournit le bouton rouge natif 'Hang up' / 'Raccrocher' et verrouille le geste de glissement)
    var callStyleApplied = false
    try {
      val callerPersonBuilder = Person.Builder()
        .setName(if (otherName.isNotBlank()) otherName else "Yambi Call")
        .setImportant(true)

      if (cachedAvatar != null) {
        callerPersonBuilder.setIcon(IconCompat.createWithBitmap(cachedAvatar))
      } else {
        callerPersonBuilder.setIcon(IconCompat.createWithResource(context, iconResId))
      }

      val callerPerson = callerPersonBuilder.build()
      val callStyle = NotificationCompat.CallStyle.forOngoingCall(callerPerson, endPendingIntent)
      notificationBuilder.setStyle(callStyle)
      callStyleApplied = true
    } catch (t: Throwable) {
      android.util.Log.w("IncomingCallNotificationManager", "Could not apply CallStyle: ${t.message}")
    }

    // En cas d'échec de CallStyle uniquement, on ajoute le bouton d'action manuel de secours (pour éviter le double bouton Hang up + End)
    if (!callStyleApplied) {
      notificationBuilder.addAction(
        android.R.drawable.ic_menu_close_clear_cancel,
        getCallString(context, "end_call", "Raccrocher"),
        endPendingIntent
      )
    }

    if (cachedAvatar == null && effectiveAvatar.isNotBlank()) {
      loadAvatarBitmapAsync(context, effectiveAvatar) { loadedBitmap ->
        if (IncomingCallActivity.isCallActive() || YambiCallService.activeSession != null) {
          showOngoingCallNotification(
            context,
            callId,
            otherName,
            callType,
            effectiveConnectedAt,
            effectiveAvatar
          )
        }
      }
    }

    val notification = notificationBuilder.build()
    notification.flags = notification.flags or Notification.FLAG_ONGOING_EVENT or Notification.FLAG_NO_CLEAR
    try {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.notify(ONGOING_NOTIFICATION_ID, notification)
    } catch (_: Exception) {}
    return notification
  }

  fun dismissOngoingNotification(context: Context) {
    try {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.cancel(ONGOING_NOTIFICATION_ID)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  fun getCallString(context: Context, key: String, fallback: String): String {
    return try {
      val prefs = context.getSharedPreferences("yambi_call_prefs", Context.MODE_PRIVATE)
      val value = prefs.getString("str_$key", null)
      if (!value.isNullOrBlank()) return value

      val locale = java.util.Locale.getDefault().language.lowercase()
      when {
        locale.startsWith("sw") -> when (key) {
          "incoming_video_call" -> "Wito wa video unaoingia..."
          "incoming_audio_call" -> "Wito wa sauti unaoingia..."
          "ongoing_video_call" -> "Simu ya video inaendelea..."
          "ongoing_audio_call" -> "Simu ya sauti inaendelea..."
          "tap_to_return" -> "Gusa ili kurudi kwenye simu"
          "decline" -> "Kataa"
          "accept" -> "Pokea"
          "end_call", "btn_end" -> "Kata wito"
          "mute" -> "Nyamazisha"
          "unmute" -> "Washa sauti"
          "speaker", "btn_speaker" -> "Kipaza sauti"
          "earpiece" -> "Simu"
          "switch_camera", "btn_flip" -> "Badilisha kamera"
          "calling" -> "Inapiga..."
          "ringing" -> "Iko na pita..."
          "connecting" -> "Kuunganisha..."
          "reconnecting" -> "Inaunganisha tena..."
          "call_ended" -> "Wito umekatika"
          "call_rejected" -> "Wito umekataliwa"
          "user_busy" -> "Ametumika"
          "no_answer" -> "Bila jibu"
          else -> fallback
        }
        locale.startsWith("en") -> when (key) {
          "incoming_video_call" -> "Incoming video call..."
          "incoming_audio_call" -> "Incoming audio call..."
          "ongoing_video_call" -> "Video call in progress..."
          "ongoing_audio_call" -> "Audio call in progress..."
          "tap_to_return" -> "Tap to return to call"
          "decline" -> "Decline"
          "accept" -> "Accept"
          "end_call" -> "End Call"
          "btn_end" -> "End"
          "mute" -> "Mute"
          "unmute" -> "Unmute"
          "speaker", "btn_speaker" -> "Speaker"
          "earpiece" -> "Earpiece"
          "switch_camera", "btn_flip" -> "Flip"
          "calling" -> "Calling..."
          "ringing" -> "Ringing..."
          "connecting" -> "Connecting..."
          "reconnecting" -> "Reconnecting..."
          "call_ended" -> "Call ended"
          "call_rejected" -> "Call rejected"
          "user_busy" -> "User busy"
          "no_answer" -> "No answer"
          else -> fallback
        }
        else -> fallback
      }
    } catch (_: Exception) {
      fallback
    }
  }

  fun dismissNotification(context: Context, callId: String? = null) {
    stopRinging()
    try {
      YambiCallService.stop(context)
    } catch (e: Exception) {
      e.printStackTrace()
    }
    try {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.cancel(NOTIFICATION_ID)
      notificationManager.cancel(ONGOING_NOTIFICATION_ID)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  fun startRinging(context: Context) {
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    val ringerMode = audioManager?.ringerMode ?: AudioManager.RINGER_MODE_NORMAL

    // 1. Play default user telephone ringtone if in normal mode
    if (ringerMode == AudioManager.RINGER_MODE_NORMAL) {
      if (ringtone == null || ringtone?.isPlaying == false) {
        try {
          val ringtoneUri = getSystemRingtoneUri(context)
          val r = RingtoneManager.getRingtone(context.applicationContext, ringtoneUri)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            r.isLooping = true
          }
          val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .build()
          r.audioAttributes = audioAttributes
          r.play()
          ringtone = r
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }

    // 2. Vibrate if not in silent mode
    if (ringerMode != AudioManager.RINGER_MODE_SILENT) {
      if (vibrator == null) {
        try {
          vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
          } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
          }

          val pattern = longArrayOf(0, 1000, 1000)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
          } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 0)
          }
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }
  }

  fun stopRinging() {
    try {
      ringtone?.stop()
      ringtone = null
    } catch (e: Exception) {
      e.printStackTrace()
    }

    try {
      vibrator?.cancel()
      vibrator = null
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
}

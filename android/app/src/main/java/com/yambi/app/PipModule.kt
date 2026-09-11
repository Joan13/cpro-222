package com.yambi.app

import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class PipModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PipModule"

    companion object {
        private var reactContextRef: ReactApplicationContext? = null

        fun sendPipModeEvent(isInPipMode: Boolean) {
            reactContextRef?.let { ctx ->
                if (ctx.hasActiveCatalystInstance()) {
                    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("onPictureInPictureModeChanged", isInPipMode)
                }
            }
        }
    }

    init {
        reactContextRef = reactContext
    }

    @ReactMethod
    fun setVideoCallActive(active: Boolean) {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        activity?.runOnUiThread {
            activity.updatePipParams(active)
        } ?: run {
            MainActivity.isVideoCallActive = active
        }
    }

    @ReactMethod
    fun enterPipMode() {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        activity?.runOnUiThread {
            if (MainActivity.isVideoCallActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    val params = android.app.PictureInPictureParams.Builder()
                        .setAspectRatio(android.util.Rational(9, 16))
                        .build()
                    activity.enterPictureInPictureMode(params)
                } catch (e: Exception) {
                    // ignore if system PIP is not permitted
                }
            }
        }
    }

    @ReactMethod
    fun isInPipMode(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            promise.resolve(activity.isInPictureInPictureMode)
        } else {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}

package com.yambi.app
import com.zoontek.rnbootsplash.RNBootSplash
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.app.PictureInPictureParams
import android.util.Rational
import android.content.res.Configuration

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

  companion object {
    var isVideoCallActive: Boolean = false
    var currentInstance: MainActivity? = null
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)
    currentInstance = this
  }

  override fun onDestroy() {
    super.onDestroy()
    if (currentInstance == this) {
      currentInstance = null
    }
  }

  fun updatePipParams(active: Boolean) {
    isVideoCallActive = active
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      try {
        val builder = PictureInPictureParams.Builder()
          .setAspectRatio(Rational(9, 16))
          .setAutoEnterEnabled(active)
        setPictureInPictureParams(builder.build())
      } catch (e: Exception) {
        // ignore
      }
    }
  }

  override fun onUserLeaveHint() {
    super.onUserLeaveHint()
    // ONLY enter System Picture-in-Picture mode if there is an ongoing video call!
    if (isVideoCallActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      try {
        val params = PictureInPictureParams.Builder()
          .setAspectRatio(Rational(9, 16))
          .build()
        enterPictureInPictureMode(params)
      } catch (e: Exception) {
        // ignore if system PIP is not permitted
      }
    }
  }

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
    PipModule.sendPipModeEvent(isInPictureInPictureMode)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}

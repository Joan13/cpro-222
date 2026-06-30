package expo.modules.proximity

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.PowerManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ProximityModule : Module(), SensorEventListener {
  private var sensorManager: SensorManager? = null
  private var proximitySensor: Sensor? = null
  private var powerManager: PowerManager? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var isMonitoring = false

  override fun definition() = ModuleDefinition {
    Name("Proximity")

    Events("onProximityChange")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
      proximitySensor = sensorManager?.getDefaultSensor(Sensor.TYPE_PROXIMITY)
      powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    }

    Function("setProximityMonitoringEnabled") { enabled: Boolean ->
      if (enabled && !isMonitoring) {
        proximitySensor?.let { sensor ->
          sensorManager?.registerListener(this@ProximityModule, sensor, SensorManager.SENSOR_DELAY_NORMAL)
          isMonitoring = true
        }
      } else if (!enabled && isMonitoring) {
        sensorManager?.unregisterListener(this@ProximityModule)
        releaseWakeLock()
        isMonitoring = false
      }
    }
  }

  override fun onSensorChanged(event: SensorEvent?) {
    if (event == null || event.sensor.type != Sensor.TYPE_PROXIMITY) return

    val distance = event.values[0]
    val maxRange = event.sensor.maximumRange
    val isNear = distance < maxRange && distance < 5.0f

    if (isNear) {
      acquireWakeLock()
    } else {
      releaseWakeLock()
    }

    sendEvent("onProximityChange", mapOf(
      "isNear" to isNear
    ))
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  private fun acquireWakeLock() {
    if (wakeLock == null && powerManager != null) {
      if (powerManager!!.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK)) {
        wakeLock = powerManager!!.newWakeLock(
          PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK,
          "proximity:screen_off"
        ).apply {
          acquire()
        }
      }
    }
  }

  private fun releaseWakeLock() {
    wakeLock?.let {
      if (it.isHeld) {
        it.release()
      }
    }
    wakeLock = null
  }
}

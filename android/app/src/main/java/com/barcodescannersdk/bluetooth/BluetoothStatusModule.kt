package com.barcodescannersdk.bluetooth;

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothAdapter

private const val MODULE_NAME = "BluetoothStatusModule"
private const val EVENT_BLUETOOTH_ENABLED =  "$MODULE_NAME.bluetoothEnabled"

class BluetoothStatusModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = MODULE_NAME

  private val bluetoothManager by lazy {
    reactContext.applicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  }

  private val eventEmitter by lazy {
    reactApplicationContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  }

  private var receiver: BluetoothActionReceiver? = null

  override fun initialize() {
    super.initialize()
    receiver = bluetoothManager.adapter?.let { adapter ->
      BluetoothActionReceiver(adapter, eventEmitter)
    }
    receiver?.run {
      reactApplicationContext.registerReceiver(this, IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED))
    }
  }

  override fun onCatalystInstanceDestroy() {
    receiver?.run { reactApplicationContext.unregisterReceiver(this) }
    receiver = null
  }

  @ReactMethod
  fun getCurrentBluetoothState(promise: Promise) {
    val isBluetoothEnabled = when(bluetoothManager.adapter?.state) {
      null, BluetoothAdapter.STATE_OFF, BluetoothAdapter.STATE_TURNING_OFF  -> false
      BluetoothAdapter.STATE_ON, BluetoothAdapter.STATE_TURNING_ON -> true
      else -> false
    }
    promise.resolve(isBluetoothEnabled)
  }

  private class BluetoothActionReceiver(
    val bluetoothAdapter: BluetoothAdapter,
    val eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter
  ) : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == BluetoothAdapter.ACTION_STATE_CHANGED) {
        eventEmitter.emit(EVENT_BLUETOOTH_ENABLED, bluetoothAdapter.isEnabled)
      }
    }
  }
}


package com.barcodescannersdk;

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.barcodescannersdk.bluetooth.hasBondedDevice
import com.barcodescannersdk.bluetooth.removeBond
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume
import android.util.Log

private const val MODULE_NAME = "BluetoothModule"
private const val SCAN_STATE = "BT_SCAN_STATE"
private const val SCAN_STARTED = "BT_SCAN_STARTED"
private const val SCAN_STOPPED = "BT_SCAN_STOPPED"
private const val DEVICE_FOUND = "BT_DEVICES_FOUND"
private const val CONNECTION_STATE = "BT_CONNECTION_STATE"
private const val CONNECTION_STATE_BONDING = "Bonding"
private const val CONNECTION_STATE_BONDED = "Bonded"
private const val CONNECTION_STATE_BOND_FAILED = "Disconnected"
private val logTag = "BLUETOOTH_MODULE"

class BluetoothModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val backgroundScope = CoroutineScope(Dispatchers.Default)

  private var filter: String? = null
  private val devices = HashMap<String, BluetoothDevice>()
  private val adapter: BluetoothAdapter by lazy {
    BluetoothAdapter.getDefaultAdapter()
  }
  private var discovering = false
  private var currentPairingDeviceAddress: String? = null
  private var bonding = false

  private var onBluetoothEnabled: (() -> Unit)? = null

  private val eventEmitter by lazy {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  }

  override fun getName() = MODULE_NAME

  private val bluetoothReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent) {
      when {
        BluetoothAdapter.ACTION_STATE_CHANGED == intent.action -> {
          if (intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, -1) == BluetoothAdapter.STATE_ON) {
            onBluetoothEnabled?.let {
              it.invoke()
              onBluetoothEnabled = null
            }
          }
        }
        BluetoothDevice.ACTION_FOUND == intent.action -> {
          //bluetooth device found
          val device = intent.getParcelableExtra<BluetoothDevice>(BluetoothDevice.EXTRA_DEVICE)
         // Log.i(logTag, device.toString())
          addDevice(device)
        }
        BluetoothAdapter.ACTION_DISCOVERY_STARTED == intent.action -> {
          eventEmitter.emit(SCAN_STATE, SCAN_STARTED)
        }
        BluetoothAdapter.ACTION_DISCOVERY_FINISHED == intent.action -> {
          if (discovering) {
            adapter.startDiscovery()
          }
          eventEmitter.emit(SCAN_STATE, SCAN_STOPPED)
        }
        BluetoothDevice.ACTION_BOND_STATE_CHANGED == intent.action -> {
          val connectionState = intent.getIntExtra(
            BluetoothDevice.EXTRA_BOND_STATE,
            BluetoothDevice.BOND_BONDING
          )
          val device = intent.getParcelableExtra<BluetoothDevice>(BluetoothDevice.EXTRA_DEVICE)
          device?.let {
            if (device.address == currentPairingDeviceAddress) {
              when (connectionState) {
                BluetoothDevice.BOND_NONE -> {
                  if (bonding) {
                    // Assume that bonding failed
                    bonding = false
                    eventEmitter.emit(CONNECTION_STATE, CONNECTION_STATE_BOND_FAILED)
                  }
                }
                BluetoothDevice.BOND_BONDING -> {
                  bonding = true
                  eventEmitter.emit(CONNECTION_STATE, CONNECTION_STATE_BONDING)
                }
                BluetoothDevice.BOND_BONDED -> {
                  bonding = false
                  eventEmitter.emit(CONNECTION_STATE, CONNECTION_STATE_BONDED)
                  currentPairingDeviceAddress = null
                  reactContext.unregisterReceiver(this)
                }
              }
            }
          }
        }
      }
    }
  }

  private fun addDevice(device: BluetoothDevice?) {
    device?.let {
      devices[device.address] = device
      serializeAndSendDevices()
    }
  }

  /*
   * We want to filter out devices that are already bonded, and devices that don't contain the filter string
   */
  private fun BluetoothDevice.filterBondedDevice() = filter.let {
    this.bondState != BluetoothDevice.BOND_BONDED
      && (it == null || (this.name != null && this.name.startsWith(it)))
  }

  private fun serializeAndSendDevices() {
    val array = WritableNativeArray()
    //Filter devices here before we send them over the bridge
    devices.filterValues { device -> device.filterBondedDevice() }.forEach {
      val deviceMap = WritableNativeMap().apply {
        putString("name", it.value.name)
        putString("address", it.value.address)
      }
      array.pushMap(deviceMap)
    }
    Log.i(logTag, array.toString())
    eventEmitter.emit(DEVICE_FOUND, array)
  }

  @ReactMethod
  fun clearCache() {
    devices.clear()
  }

  @ReactMethod
  fun discoverDevices() {
    val intentFilter = IntentFilter().apply {
      addAction(BluetoothDevice.ACTION_FOUND)
      addAction(BluetoothAdapter.ACTION_DISCOVERY_STARTED)
      addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED)
      addAction(BluetoothAdapter.ACTION_STATE_CHANGED)
    }

    reactContext.registerReceiver(bluetoothReceiver, intentFilter)
    discovering = true
    if (!adapter.startDiscovery()) {
      onBluetoothEnabled = {
        adapter.startDiscovery()
      }
      val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
      enableBtIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
      reactContext.startActivity(enableBtIntent)
    }
  }

  @ReactMethod
  fun setFilter(filter: String?) {
    this.filter = filter
  }

  @ReactMethod
  fun pair(deviceAddress: String) = backgroundScope.launch {
    devices[deviceAddress]?.let { device ->
      if (adapter.hasBondedDevice(deviceAddress)) {
        if (!unpair(device)) {
          eventEmitter.emit(CONNECTION_STATE, CONNECTION_STATE_BOND_FAILED)
          return@let
        }
      }

      val intentFilter = IntentFilter().apply {
        addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED)
        addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED)
      }
      reactContext.registerReceiver(bluetoothReceiver, intentFilter)
      currentPairingDeviceAddress = deviceAddress
      device.createBond()
    }
  }

  @ReactMethod
  fun openPermissions() {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    val uri: Uri = Uri.fromParts("package", reactContext.packageName, null)
    intent.data = uri
    reactContext.startActivity(intent)
  }

  @ReactMethod
  fun stopScanning() {
    reactContext.unregisterReceiver(bluetoothReceiver)
    discovering = false
    onBluetoothEnabled = null
    adapter.cancelDiscovery()
  }

  /**
   * Unpair the supplied [BluetoothDevice] from the Android device, assuming it had been previously paired with the device.
   *
   * @return`true` if the device has been successfully unpaired
   *
   * `false` if a successful unpairing is not detected within the given [timeoutMillis].
   */
  private suspend fun unpair(device: BluetoothDevice, timeoutMillis: Long = 10_000): Boolean {
    val intentFilter = IntentFilter().apply { addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED) }
    lateinit var unbondReceiver: UnbondReceiver

    val unbondingResult = withTimeoutOrNull(timeoutMillis) {
      suspendCancellableCoroutine<Boolean> { continuation ->
        unbondReceiver = UnbondReceiver(device, continuation)
        reactContext.registerReceiver(unbondReceiver, intentFilter)
        device.removeBond()
      }
    } ?: false

    reactContext.unregisterReceiver(unbondReceiver)
    return unbondingResult
  }

  /**
   * A [BroadcastReceiver] implementation that will listen for broadcasts indicating that the given [device] has been
   * unbonded with the device. The [continuation] will be resumed with `true` once the unbonding is detected.
   */
  private class UnbondReceiver(
    private val device: BluetoothDevice,
    private val continuation: CancellableContinuation<Boolean>
  ) : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent) {
      // Resume the suspended coroutine when we detect the device we're attempting to unpair has registered
      // a bond state changed to BOND_NONE.
      if (intent.action == BluetoothDevice.ACTION_BOND_STATE_CHANGED) {
        val bondState = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, -1)
        val foundDevice = intent.getParcelableExtra<BluetoothDevice>(BluetoothDevice.EXTRA_DEVICE)
        if (foundDevice?.address == device.address && bondState == BluetoothDevice.BOND_NONE) {
          continuation.resume(true)
        }
      }
    }
  }

  /**
   * Mirrors BluetoothDevice.ts
   */
  private data class RNBluetoothDevice(
    val name: String,
    val address: String
  )
}

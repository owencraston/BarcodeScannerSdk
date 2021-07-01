package com.barcodescannersdk;

import android.bluetooth.BluetoothManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.Promise
import android.content.Context
import android.util.Log
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import java.util.Locale
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.socketmobile.capture.CaptureError
import com.socketmobile.capture.client.CaptureClient
import com.socketmobile.capture.client.ConnectionState
import com.socketmobile.capture.client.DataEvent
import com.socketmobile.capture.client.DeviceStateEvent
import com.socketmobile.capture.client.DeviceState
import com.socketmobile.capture.client.DeviceClient
import com.socketmobile.capture.Property
import com.socketmobile.capture.Property.DEVICE_BATTERY_LEVEL
import com.socketmobile.capture.Property.DEVICE_BLUETOOTH_ADDRESS
import com.socketmobile.capture.Property.DEVICE_FRIENDLY_NAME
import com.socketmobile.capture.Property.create
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine
import com.google.gson.Gson

private const val BARCODE_SCAN_RESULT = "BARCODE_SCAN_RESULT"
private const val BARCODE_DEVICE_EVENT = "BARCODE_DEVICE_EVENT"
private const val PREF_PAIRED_BARCODE_SCANNER_KEY = "barcode_scanners_address"
private const val PREF_PAIRED_BARCODE_SCANNER_FILE = "com.shopify.reactnative.barcode_scanner_sdk.barcode_scanner_preferences"
private const val DEFAULT_SCANNER_NAME = "Default Scanner"
private const val DEFAULT_BT_ADDRESS = "00:00:00:00:00:00"
private const val DEFAULT_BATTERY_LEVEL = -1

private const val BAD_BEEP = 2 // 0: No Beep, 1: Good Beep, 2 Bad Beep
private const val RED_LED = 2 // 0: No LED, 1: Green LED, 2: Red LED
private const val BAD_RUMBLE = 2 // 0: No Rumble, 1: Good Rumble, 2: Bad Rumble

private const val GOOD_BEEP = 1 // 0: No Beep, 1: Good Beep, 2 Bad Beep
private const val GREEN_LED = 1 // 0: No LED, 1: Green LED, 2: Red LED
private const val GOOD_RUMBLE = 1 // 0: No Rumble, 1: Good Rumble, 2: Bad Rumble

private val logTag = "SOCKET_SCANNER_SDK"

private data class BarcodeScanner(
  val name: String,
  val address: String,
  val connected: Boolean,
  val batteryLevel: Int
)

class SocketScannerSdk(reactContext: ReactContext, private val capture: CaptureClient) {

  private val eventEmitter by lazy {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  }

  private val bluetoothManager by lazy {
    reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  }

  private val sharedPreferences by lazy {
    reactContext.getSharedPreferences(PREF_PAIRED_BARCODE_SCANNER_FILE, Context.MODE_PRIVATE)
  }

  private var lastUsedDevice: DeviceClient? = null

  private var ready: Boolean = false

  private val gson = Gson()

  private val bgScope = CoroutineScope(Dispatchers.IO)

  init {
    capture.setListener(object : CaptureClient.Listener {
      override fun onData(dataEvent: DataEvent) {
        onDataReceived(dataEvent)
      }

      override fun onError(captureError: CaptureError) {
        Log.e(logTag, captureError.getMessage())
      }

      override fun onDeviceStateEvent(deviceStateEvent: DeviceStateEvent) {
        onCaptureDeviceStateChange(deviceStateEvent)
      }
    })
  }

  private fun onDataReceived(dataEvent: DataEvent) {
    // set the last used device to the current device
    lastUsedDevice = dataEvent.device

    val result = WritableNativeMap().apply {
      /* This data will be sent across the bridge to React Native via a WritableNativeMap with the following keys.
      - id: refers to the data source type which are defined here:
         - https://docs.socketmobile.com/capture/java/en/latest/javadoc/capture-common/com/socketmobile/capture/types/DataSource.html
      - name: refers to the plain text representation of the above types
      - data: converts a byte array to a string representing the data in the barcode that the scanner has scanned and decoded
      */
      putInt("id", dataEvent.data.dataSource.id)
      putString("name", dataEvent.data.dataSource.name)
      putString("data", dataEvent.data.string)
    }
    Log.d(logTag, "Emitting a $BARCODE_SCAN_RESULT with data $result")
    eventEmitter.emit(BARCODE_SCAN_RESULT, result)
  }

  private fun onCaptureServiceConnectionStateChange(state: ConnectionState) {
    when(state.intValue()) {
      ConnectionState.CONNECTED -> Log.d(logTag, "Connection state change with state CONNECTED")
      ConnectionState.DISCONNECTED -> Log.d(logTag, "Connection state change with state DISCONNECTED")
      ConnectionState.CONNECTING -> Log.d(logTag, "Connection state change with state CONNECTING")
      ConnectionState.DISCONNECTING -> Log.d(logTag, "Connection state change with state DISCONNECTING")
      ConnectionState.READY -> {
        Log.d(logTag, "Connection state change with state READY")
        ready = true
      }
    }
  }

  private fun onCaptureDeviceStateChange(event: DeviceStateEvent) {
    if (DeviceState.AVAILABLE == event.state.intValue()) {
      event.device.open()
    }

    when (event.state.intValue()) {
      DeviceState.READY -> {
        bgScope.launch {
          val firstPairedScanner = capture.devices.firstOrNull()

          firstPairedScanner?.let { pairedScanner ->
            lastUsedDevice = firstPairedScanner
            savePairedScanner(pairedScanner.toBarcodeScanner())
          }
        }
      }
      DeviceState.GONE -> {
        val lastPairedScanner = getSavedPairedScanner()

        lastPairedScanner?.let {
          if (bluetoothManager.adapter.hasBondedDevice(it.address)) {
            updatePairedScanner(it.copy(connected = false))
          } else {
            clearSavedScanners()
          }
        }
      }
    }
  }

  /**
   * Converts a [DeviceClient] into a [BarcodeScanner].
   *
   * This is a suspendable method because it depends on coroutines to transform the callbacks
   * required by the SocketMobile client into 'sync' calls.
   *
   * @receiver the [DeviceClient]
   * @return a [BarcodeScanner] representing that client
   */
  private suspend fun DeviceClient.toBarcodeScanner(): BarcodeScanner = BarcodeScanner(
    name = getDeviceProperty(DEVICE_FRIENDLY_NAME) {
      it?.string ?: DEFAULT_SCANNER_NAME
    },
    address = getDeviceProperty(DEVICE_BLUETOOTH_ADDRESS) {
      it?.array?.toBluetoothAddress() ?: DEFAULT_BT_ADDRESS
    },
    batteryLevel = getDeviceProperty(DEVICE_BATTERY_LEVEL) {
      it?.int?.toBatteryLevel() ?: DEFAULT_BATTERY_LEVEL
    },
    connected = true
  )

  /**
   * Retrieves a property for a given [DeviceClient], using a coroutine to resolve the required callback
   *
   * @receiver the [DeviceClient]
   * @param propertyId the id of the desired property as declared in [Property]
   * @param propertyMapper a function that receives a [Property]? and returns a mapped value T
   * @return the value of the [Property] after having the propertyMapper applied to it
   */
  private suspend fun <T> DeviceClient.getDeviceProperty(propertyId: Int, propertyMapper: (Property?) -> T): T {
    return suspendCancellableCoroutine { cont ->
      getProperty(create(propertyId)) { _, property ->
        cont.resume(propertyMapper(property))
      }
    }
  }

  /**
   * Updates a String property for a given [DeviceClient]. Once this method finishes,
   * querying the device for that property will result in the new one being returned.
   *
   * @receiver the [DeviceClient]
   * @param propertyId the id of the desired property as declared in [Property]
   * @param newValue the updated value as String
   */
  private suspend fun DeviceClient.setPropertyString(propertyId: Int, newValue: String) {
    return suspendCancellableCoroutine { cont ->
      setProperty(create(propertyId, newValue)) { _, _ ->
        cont.resume(Unit)
      }
    }
  }

  /**
   * Converts a list of Ints into a String representing that device's BT address in the same
   * format as reported by Android. The SocketMobile SDK returns the address as a list of Ints,
   * each one representing a 2-byte hex character (whence why we pad with a '0').
   *
   * @receiver a list of Ints representing a BT address
   * @return a string with the address in a friendly representation (ie '01:23:AB:CD')
   */
  private fun List<Int>.toBluetoothAddress(): String = joinToString(separator = ":") {
    it.toString(16).padStart(2, '0')
  }.toUpperCase(Locale.getDefault())

  /**
   * The SocketScanner SDK [returns the battery level as int](https://docs.socketmobile.com/capture/java/en/latest/javadoc/capture/com/socketmobile/capture/client/DeviceClient.html), where each byte is as follows:
   *
   * Byte 0 - reserved/empty
   *
   * Byte 1 - current level
   *
   * Byte 2 - minimum
   *
   * Byte 3 - maximum
   *
   * We use bitwise operations to extract these 3 values, and then do a simple percentage calculation
   * at the end
   *
   * @receiver an Int representing the current, min and max battery levels
   * @return the current battery amount left, as percentage
   */
  private fun Int.toBatteryLevel(): Int {
    val current = this ushr 8 and 0xff
    val min = this ushr 16 and 0xff
    val max = this ushr 24 and 0xff

    return (current * 100.0 / (max - min)).toInt()
  }

  /**
   * Checks the BT system for a previously bonded device with a given address.
   *
   * @param btAddress a string representing the Bluetooth address of the device
   * @return true if a device with that address has ever bonded, false otherwise
   */
  private fun BluetoothAdapter.hasBondedDevice(btAddress: String): Boolean =
    bondedDevices.any { it.address == btAddress }

  /**
   * Removes a bonded scanner from the system. For some weird reason, Android APIs
   * expose [BluetoothDevice.createBond], but not removeBond; hence the use of reflection
   * here.
   *
   * @return whether the request to remove the bond was successful.
   */
  private fun BluetoothDevice.removeBond(): Boolean {
    return try {
      javaClass.getMethod("removeBond").invoke(this)
      true
    } catch (e: Exception) {
      Log.e(logTag, "Error while trying to remove bonded device ${this.name} with exception: $e")
      false
    }
  }

  /**
   * Calls the native event emitter to emit a device event
   *
   * @param scanner scanner device, null if none are present
   */
  private fun emitDeviceEvent(scanner: BarcodeScanner?) {
    if (scanner != null) {
      val result = WritableNativeMap().apply {
        putString("name", scanner.name)
        putString("address", scanner.address)
        putBoolean("connected", scanner.connected)
        putInt("batteryLevel", scanner.batteryLevel)
      }
      Log.d(logTag, "Emitting a $BARCODE_DEVICE_EVENT with scanner $scanner")
      eventEmitter.emit(BARCODE_DEVICE_EVENT, result)
    }
  }

  /**
   * Saves the latest paired scanner in the SharedPreferences
   *
   * @param scanner the [BarcodeScanner] to save
   */
  private fun savePairedScanner(scanner: BarcodeScanner) {
    val jsonString = gson.toJson(scanner)
    sharedPreferences.edit().putString(PREF_PAIRED_BARCODE_SCANNER_KEY, jsonString).apply()
    Log.d(logTag, "Saved a new scanner on shared prefs: [$jsonString]")
    emitDeviceEvent(scanner)
  }

  /**
   * Updates the saved scanner with a new one, then fires a device event with the new scanner
   *
   * @param updatedScanner the updated [BarcodeScanner]
   */
  private fun updatePairedScanner(updatedScanner: BarcodeScanner) {
    val jsonString = gson.toJson(updatedScanner)
    Log.d(logTag, "Updating scanner SharedPrefs with new value $updatedScanner")
    sharedPreferences.edit().putString(PREF_PAIRED_BARCODE_SCANNER_KEY, jsonString).apply()
    emitDeviceEvent(updatedScanner)
  }

  /**
   * Retrieves the last paired scanner from SharedPreferences, or null if none found
   */
  private fun getSavedPairedScanner(): BarcodeScanner? {
    return sharedPreferences.getString(PREF_PAIRED_BARCODE_SCANNER_KEY, null)?.let { scannerString ->
      gson.fromJson(scannerString, BarcodeScanner::class.java).also {
        Log.d(logTag, "Got a saved scanner from shared prefs: [$it]")
      }
    }
  }

  /**
   * If we can't find any previously paired scanners, it means all of them have been removed by the user,
   * so we clear everything
   */
  private fun clearSavedScanners() {
    Log.d(logTag, "Clearing scanner SharedPrefs as no previously paired scanners have been found")
    sharedPreferences.edit().remove(PREF_PAIRED_BARCODE_SCANNER_KEY).apply()
    emitDeviceEvent(null)
  }

  fun onSessionStarted() {
    if(ready) return
    capture.connect {
      onCaptureServiceConnectionStateChange(it)
    }
  }

  fun onSessionStopped() {
    if(!ready) return
    capture.disconnect()
  }

  fun connect() {
    if (ready) return
    capture.connect {
      onCaptureServiceConnectionStateChange(it);
    }
  }

  fun badBeep() {
    lastUsedDevice?.let {
      val generatedBeep = BAD_RUMBLE shl 4 or (BAD_BEEP shl 2) or RED_LED
      it.triggerFeedback(generatedBeep)
    }
  }

  fun goodBeep() {
    lastUsedDevice?.let {
      val generatedBeep = GOOD_RUMBLE shl 4 or (GOOD_BEEP shl 2) or GREEN_LED
      it.triggerFeedback(generatedBeep)
    }
  }

  fun forgetScanner() {
    getSavedPairedScanner()?.let { savedScanner ->
      Log.d(logTag, "Attempting to remove bonded device ${savedScanner.name}")
      bluetoothManager.adapter.bondedDevices.firstOrNull { it.address == savedScanner.address }?.let {
        it.removeBond()
        clearSavedScanners()
      } ?: Log.d(logTag, "No bonded scanner ${savedScanner.name} found")
    }
  }

  fun updateScannerName(updatedName: String) {
    capture.devices.firstOrNull()?.let {
      bgScope.launch {
        val updatedScanner = it.setPropertyString(DEVICE_FRIENDLY_NAME, updatedName).run {
          it.toBarcodeScanner()
        }
        updatePairedScanner(updatedScanner)
      }
    }
  }

  fun forgetSavedScanners(promise: Promise) {
    clearSavedScanners()
    promise.resolve(true)
  }
}

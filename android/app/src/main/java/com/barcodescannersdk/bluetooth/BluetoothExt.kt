package com.barcodescannersdk.bluetooth;

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.util.Log

private val logTag = "BLUETOOTH_EXTENSION"

/**
 * Checks the BT system for a previously bonded device with a given address.
 *
 * @param btAddress a string representing the Bluetooth address of the device
 * @return true if a device with that address has ever bonded, false otherwise
 */
fun BluetoothAdapter.hasBondedDevice(btAddress: String): Boolean =
  bondedDevices.any { it.address == btAddress }

/**
 * Checks the BT system for a device that is currently bonded
 *
 * @param btAddress a string representing the Bluetooth address of the device
 * @return the BT device if a device with that address is bonded, null otherwise
 */
fun BluetoothAdapter.getBondedDevice(btAddress: String): BluetoothDevice? =
  bondedDevices.firstOrNull { it.address == btAddress }

/**
 * Removes a bonded scanner from the system. For some weird reason, Android APIs
 * expose [BluetoothDevice.createBond], but not removeBond; hence the use of reflection
 * here.
 *
 * @return whether the request to remove the bond was successful.
 */
fun BluetoothDevice.removeBond(): Boolean {
  return try {
    javaClass.getMethod("removeBond").invoke(this)
    true
  } catch (e: Exception) {
    Log.e(logTag, "Error while trying to remove bonded device ${this.name} with exception: $e")
    false
  }
}

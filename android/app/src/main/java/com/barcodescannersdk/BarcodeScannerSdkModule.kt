package com.barcodescannersdk;

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

private const val MODULE_NAME = "BarcodeScannerSdkModule"

class BarcodeScannerSdkModule(
  private val reactContext: ReactContext,
  private val socketScannerSdk: SocketScannerSdk
) : ReactContextBaseJavaModule(reactContext as ReactApplicationContext) {
  override fun getName(): String {
    return MODULE_NAME
  }

  @ReactMethod
  fun onSessionStarted() {
    socketScannerSdk.onSessionStarted()
  }

  @ReactMethod
  fun onSessionStopped() {
    socketScannerSdk.onSessionStopped()
  }

  @ReactMethod
  fun connect() {
    socketScannerSdk.connect()
  }

  @ReactMethod
  fun badBeep() {
    socketScannerSdk.badBeep()
  }

  @ReactMethod
  fun goodBeep() {
    socketScannerSdk.goodBeep()
  }

  @ReactMethod
  fun forgetScanner() {
    socketScannerSdk.forgetScanner()
  }

  @ReactMethod
  fun updateScannerName(updatedName: String) {
    socketScannerSdk.updateScannerName(updatedName)
  }

  @ReactMethod
  fun forgetSavedScanners(promise: Promise) {
    socketScannerSdk.forgetSavedScanners(promise)
  }
}

package com.barcodescannersdk;

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class BarcodeScannerSdkPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    val socketScannerSdk = SocketScannerSdk(reactContext, CaptureClientProvider.capture)
    return listOf(BarcodeScannerSdkModule(reactContext, socketScannerSdk), BluetoothModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}

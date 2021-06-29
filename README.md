# BarcodeScannerSdk

- A `android` test app to validate native module logic that communicates with Socket Mobile Barcode scanners.
- I have been testing this with the `Socket Mobile S740` scanner.
- To use this app with a scanner you will to run it on a `real device`.
- This App/Native Module is `NOT IOS READY`.
- This app also uses [embedded capture](https://github.com/owencraston/BarcodeScannerSdk/blob/main/android/app/libs/embeddedcapturecore-release.aar) library so that it does not need to use the companion service app.


### A Note About keys
- The keys used to configure the [Capture Client](https://github.com/owencraston/BarcodeScannerSdk/blob/main/android/app/src/main/java/com/barcodescannersdk/CaptureClientProvider.kt#L40) are app/developer specific.
- App keys are defined [here](https://github.com/owencraston/BarcodeScannerSdk/blob/main/android/app/build.gradle#L140-L144).
- Modify these and call [CaptureClientProvider.initializeCapture(...)](https://github.com/owencraston/BarcodeScannerSdk/blob/main/android/app/src/main/java/com/barcodescannersdk/MainApplication.java#L45-L52) in your MainApplication.java `onCreate()` method.
- This will configure a singleton of the [CaptureClient](https://docs.socketmobile.com/capture/java/en/latest/javadoc/capture/com/socketmobile/capture/client/CaptureClient.html) for the native module to use.

## Getting started
- Make sure you have properly set up your environment for React Native / Android
  - Docs fo this can be found [here](https://reactnative.dev/docs/environment-setup)
- Clone repo locally
- run `yarn install`

## API
- The typescript facing API can be found [here](https://github.com/owencraston/BarcodeScannerSdk/blob/main/src/BarcodeScannerModule/BarcodeScannerModule/BarcodeScannerModule.ts)
- Socket Specific Logic can be found [here](https://github.com/owencraston/BarcodeScannerSdk/blob/main/android/app/src/main/java/com/barcodescannersdk/SocketScannerSdk.kt)

## To run on android
- `yarn android`
- If this does not prompt you to open a new terminal window with a metro server running, create a new terminal window and run...
    - `yarn start`
    - then in another window run `yarn android`
    
## Pairing flow
- This Module does `NOT` handle forming the bluetooth bond with the scanner.
- To achieve this I wrote another custom [Bluetooth Native Module](https://github.com/owencraston/BarcodeScannerSdk/blob/main/android/app/src/main/java/com/barcodescannersdk/BluetoothModule.kt) which has a typescript facing API that can be found [here](https://github.com/owencraston/BarcodeScannerSdk/blob/main/src/barcodeScannerSdkExampleScreens/bluetooth/BluetoothModule.ts)
    - You are more likely to use the [useBluetoothDiscovery ](https://github.com/owencraston/BarcodeScannerSdk/blob/main/src/barcodeScannerSdkExampleScreens/hooks/useBluetoothDiscovery.tsx) hook to discover devices and the [useBluetoothPairing](https://github.com/owencraston/BarcodeScannerSdk/blob/main/src/barcodeScannerSdkExampleScreens/hooks/useBluetoothPairing.tsx) hook to form a bond.
- A complete pairing flow with examples of how to form the bluetooth bond, grant permissions, and test scanner features can be found [here](https://github.com/owencraston/BarcodeScannerSdk/tree/main/src/barcodeScannerSdkExampleScreens)
    - This is the pairing flow that will launch when you run the app.
    

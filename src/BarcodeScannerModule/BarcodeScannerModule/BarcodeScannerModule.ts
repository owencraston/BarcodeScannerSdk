import type {EmitterSubscription} from 'react-native';
import {NativeModules, DeviceEventEmitter, Platform} from 'react-native';

import {BarcodeScannerState} from '../shared';

interface BarcodeScannerModule {
  init: (
    listenerTypePriorities: string[],
    onDeviceStateChnaged: (barcodeScannerState?: BarcodeScannerState) => void,
  ) => void;
  destroy: () => void;
  connect: () => void;
  badBeep: () => void;
  goodBeep: () => void;
  forgetScanner: () => void;
  updateScannerName: (updatedName: string) => void;
  forgetSavedScanners: () => Promise<void>;
}

interface BarcodeScanListener {
  onScan: (data: string) => void;
}

export const BARCODE_SCAN_RESULT = 'BARCODE_SCAN_RESULT';
export const BARCODE_DEVICE_EVENT = 'BARCODE_DEVICE_EVENT';

class BarcodeScannerModuleImpl implements BarcodeScannerModule {
  private pairingResult: EmitterSubscription | undefined;
  private scanResult: EmitterSubscription | undefined;
  // We want the cart scanner listener to have priority over the home listener because on a tablet,
  // both of these listeners will exist, and we only want one to execute the scan
  private listenerTypePriorities: string[];

  private listeners: Map<string, BarcodeScanListener> = new Map();

  init(
    listenerTypePriorities: string[],
    onDeviceStateChnaged: (barcodeScannerState?: BarcodeScannerState) => void,
  ) {
    if (Platform.OS === 'ios') {
      return;
    }
    this.listenerTypePriorities = listenerTypePriorities;
    this.scanResult = DeviceEventEmitter.addListener(
      BARCODE_SCAN_RESULT,
      data => {
        console.log(`Got barcode: ${data.data}`);

        // We will go through the list of priority listener types, and try to see if there is a valid listener for each
        // type. If there is, we will execute the scan on that listener and then exit the loop to prevent multiple
        // listeners from executing the same scan.
        for (const listenerType of this.listenerTypePriorities) {
          const listener = this.listeners.get(listenerType);
          if (listener) {
            listener.onScan(data.data);
            return;
          }
        }
      },
    );

    this.pairingResult = DeviceEventEmitter.addListener(
      BARCODE_DEVICE_EVENT,
      (barcodeScannerState?: BarcodeScannerState) => {
        onDeviceStateChnaged(barcodeScannerState);
      },
    );
    NativeModules.BarcodeScannerSdkModule.onSessionStarted();
  }

  connect(): void {
    if (Platform.OS === 'ios') {
      return;
    }
    NativeModules.BarcodeScannerSdkModule.connect();
  }

  badBeep(): void {
    if (Platform.OS === 'ios') {
      return;
    }
    NativeModules.BarcodeScannerSdkModule.badBeep();
  }

  goodBeep(): void {
    if (Platform.OS === 'ios') {
      return;
    }
    NativeModules.BarcodeScannerSdkModule.goodBeep();
  }

  forgetScanner(): void {
    if (Platform.OS === 'ios') {
      return;
    }
    NativeModules.BarcodeScannerSdkModule.forgetScanner();
  }

  updateScannerName(updatedName: string): void {
    if (Platform.OS === 'ios') {
      return;
    }
    NativeModules.BarcodeScannerSdkModule.updateScannerName(updatedName);
  }

  forgetSavedScanners(): Promise<void> {
    if (Platform.OS === 'ios') {
      return Promise.reject(new Error('Stub!'));
    }
    return NativeModules.BarcodeScannerSdkModule.forgetSavedScanners();
  }

  destroy() {
    if (Platform.OS === 'ios') {
      return;
    }
    if (this.pairingResult) {
      this.pairingResult.remove();
      this.pairingResult = undefined;
    }

    if (this.scanResult) {
      this.scanResult.remove();
      this.scanResult = undefined;
    }
    NativeModules.BarcodeScannerSdkModule.onSessionStopped();
  }
}

export const BarcodeScannerModule = new BarcodeScannerModuleImpl();

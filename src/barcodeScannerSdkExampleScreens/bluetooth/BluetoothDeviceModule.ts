import type {EmitterSubscription} from 'react-native';
import {DeviceEventEmitter} from 'react-native';

import BluetoothDevice from './utils';

export interface HardwareModule {
  init: () => void;
  destroy: () => void;
}

class BluetoothDeviceModule implements HardwareModule {
  private scanResult: EmitterSubscription | undefined;
  private pairingResult: EmitterSubscription | undefined;

  private scanListeners: BluetoothScanListener[] =
    new Array<BluetoothScanListener>();
  private pairingListeners: BluetoothPairingListener[] =
    new Array<BluetoothPairingListener>();

  init() {
    this.scanResult = DeviceEventEmitter.addListener(
      'BT_DEVICES_FOUND',
      data => {
        this.scanListeners.forEach(listener => listener.onScan(data));
      },
    );
    this.pairingResult = DeviceEventEmitter.addListener(
      'BT_CONNECTION_STATE',
      data => {
        console.log(`Got pairing event: ${JSON.stringify(data)}`);
        this.pairingListeners.forEach(listener =>
          listener.onPairingStateChanged(data),
        );
      },
    );
  }

  addScanListener(listener: BluetoothScanListener) {
    if (!this.scanListeners.find(item => item === listener)) {
      this.scanListeners.push(listener);
    }
  }

  removeScanListener(listener: BluetoothScanListener) {
    const index = this.scanListeners.findIndex(item => item === listener);
    if (index !== -1) {
      this.scanListeners.splice(index, 1);
    }
  }

  addPairingListener(listener: BluetoothPairingListener) {
    if (!this.pairingListeners.find(item => item === listener)) {
      this.pairingListeners.push(listener);
    }
  }

  removePairingListener(listener: BluetoothPairingListener) {
    const index = this.pairingListeners.findIndex(item => item === listener);
    if (index !== -1) {
      this.pairingListeners.splice(index, 1);
    }
  }

  destroy() {
    if (this.scanResult) {
      this.scanResult.remove();
      this.scanResult = undefined;
    }

    if (this.pairingResult) {
      this.pairingResult.remove();
      this.pairingResult = undefined;
    }
  }
}

export interface BluetoothScanListener {
  onScan: (devices: BluetoothDevice[]) => void;
}

export interface BluetoothPairingListener {
  onPairingStateChanged: (pairingState: PairingState) => void;
}

export type PairingState = 'Bonding' | 'Bonded' | 'Disconnected';

export default new BluetoothDeviceModule();

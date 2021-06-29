import {NativeModules} from 'react-native';

interface BluetoothModule {
  discoverDevices(): void;
  setFilter(filter: string): void;
  pair(deviceAddress: string): void;
  stopScanning(): void;
  openPermissions(): void;
  clearCache(): void;
}

export default NativeModules.BluetoothModule as BluetoothModule;

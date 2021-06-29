import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import BluetoothModule from '../bluetooth/BluetoothModule';
import BluetoothDevice from '../bluetooth/utils';
import BluetoothDeviceModule, {BluetoothScanListener} from '../bluetooth/BluetoothDeviceModule';

const useBluetoothDiscovery = (filter: string): BluetoothDevice[] => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const scanListener = useMemo<BluetoothScanListener>(
    () => ({
      onScan: devices => {
        setDevices(devices);
      },
    }),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      BluetoothModule.clearCache();
      BluetoothModule.setFilter(filter);
      BluetoothModule.discoverDevices();
      BluetoothDeviceModule.addScanListener(scanListener);

      return () => {
        BluetoothDeviceModule.removeScanListener(scanListener);
        BluetoothModule.stopScanning();
      };
    }, [filter, scanListener]),
  );

  return devices;
};

export default useBluetoothDiscovery;

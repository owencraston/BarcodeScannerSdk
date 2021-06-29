import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';

import BluetoothDeviceModule, {
  BluetoothPairingListener,
  PairingState,
} from '../bluetooth/BluetoothDeviceModule';
import BluetoothDevice from '../bluetooth/utils';
import BluetoothModule from '../bluetooth/BluetoothModule';

export const useBluetoothPairing = (): [
  PairingState,
  (bluetoothDevice: BluetoothDevice) => void,
] => {
  const [pairingState, setPairingState] = useState<PairingState>('Bonding');
  const pair = useCallback((bluetoothDevice: BluetoothDevice) => {
    BluetoothModule.pair(bluetoothDevice.address);
  }, []);
  const scanListener = useMemo<BluetoothPairingListener>(
    () => ({
      onPairingStateChanged: pairingState => setPairingState(pairingState),
    }),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      BluetoothDeviceModule.addPairingListener(scanListener);

      return () => BluetoothDeviceModule.removePairingListener(scanListener);
    }, [scanListener]),
  );

  return [pairingState, pair];
};

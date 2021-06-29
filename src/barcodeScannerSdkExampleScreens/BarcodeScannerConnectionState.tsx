import React, {useEffect, useState} from 'react';
import {
  InteractionManager,
  SafeAreaView,
  Text,
  StyleSheet,
  Button,
} from 'react-native';

import BluetoothDevice from './bluetooth/utils';
import {useBluetoothPairing} from './hooks/useBluetoothPairing';
import {createScannerDetailsNavParams} from './BarcodeScannerDetails';
import {useBarcodeScannerContext} from './BarcodeScannerContext';
import {useNavigation} from '@react-navigation/native';
import {BarcodeScannerModule} from '../BarcodeScannerModule';
import {NavigationKeys} from '../constants';

export interface ScannerConnectionParams {
  bluetoothDevice: BluetoothDevice;
}

type ScannerState = 'Disconnected' | 'Connecting' | 'Connected' | 'Loading';

export const createScannerConnectionNavDetails = (
  bluetoothDevice: BluetoothDevice,
): [string, ScannerConnectionParams] => [
  NavigationKeys.BARCODE_SCANNER_SDK_CONNECTION_STATE,
  {bluetoothDevice},
];

const BarcodeScannerConnectionState = ({route}) => {
  const {bluetoothDevice} = route.params;
  const {navigate} = useNavigation();

  const [pairing, setPairing] = useState(false);
  const [pairingState, pair] = useBluetoothPairing();
  const [scannerConnectionState, setScannerConnectionState] =
    useState<ScannerState>('Loading');
  const {barcodeScanner} = useBarcodeScannerContext();

  useEffect(() => {
    if (!pairing) {
      setPairing(true);
      InteractionManager.runAfterInteractions(() => {
        pair(bluetoothDevice);
      });
    }
  }, [pairingState, pairing, pair, bluetoothDevice]);

  // This effect will set the scannerState depending on where we are in the flow
  useEffect(() => {
    if (barcodeScanner?.connected) {
      // Paired scanner is now ready for use, so we can proceed from this screen
      setScannerConnectionState('Connected');
    } else if (pairingState === 'Bonded') {
      // Connect to the newly-paired scanner via BarcodeScannerModule
      BarcodeScannerModule.connect();
    } else if (pairingState === 'Bonding') {
      setScannerConnectionState('Connecting');
    } else if (pairingState === 'Disconnected') {
      setScannerConnectionState('Disconnected');
    }
  }, [barcodeScanner, pairingState]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleStyle}>{scannerConnectionState}</Text>
      {scannerConnectionState === 'Connected' &&
      barcodeScanner !== undefined ? (
        <Button
          title="Complete setup"
          onPress={() => {
            navigate(...createScannerDetailsNavParams());
          }}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    margin: 8,
  },
  titleStyle: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});

export default BarcodeScannerConnectionState;

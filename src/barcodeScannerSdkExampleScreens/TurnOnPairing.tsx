import React, {useCallback, useState} from 'react';
import {Text, StyleSheet, SafeAreaView, Button} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {createPairScannerNavDetails} from './PairBarcodeScanner';
import {
  SocketScanner1DPairing,
  SocketScanner2DPairing,
} from '../BarcodeScannerModule';
import {checkLocationPermissions, ScannerParams, ScannerType} from './utils';
import {createBarcodeLocationPermissionNavDetails} from './BarcodeLocationPermission';
export const createTurnOnPairingNavParams = (
  scannerType: ScannerType,
): [string, ScannerParams] => ['TurnOnPairing', {scannerType}];

const TurnOnPairing = ({route}) => {
  console.log(route.params);
  const {scannerType} = route.params;
  const {navigate} = useNavigation();

  const [permissionGranted, setPermissionGranted] = useState(false);

  const checkLocationPermission = async () => {
    const result = await checkLocationPermissions();
    setPermissionGranted(result);
  };
  const nextStepCallback = useCallback(() => {
    if (permissionGranted) {
      navigate(...createPairScannerNavDetails());
    } else {
      navigate(...createBarcodeLocationPermissionNavDetails());
    }
  }, [navigate, permissionGranted]);

  useFocusEffect(() => {
    checkLocationPermission();
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text
        style={
          styles.titleStyle
        }>{`Put ${scannerType} scanner in pairing mode`}</Text>
      <Text>
        Press and hold the large scan button and scan the barcode below. The
        scanner will beep 3 times when pairing mode is on.
      </Text>
      <Button title="Next" onPress={nextStepCallback} />
      {scannerType === '1d' ? (
        <SocketScanner1DPairing />
      ) : (
        <SocketScanner2DPairing />
      )}
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

export default TurnOnPairing;

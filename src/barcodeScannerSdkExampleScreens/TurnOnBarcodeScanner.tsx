import React from 'react';
import {Text, StyleSheet, SafeAreaView, Button} from 'react-native';

import {ScannerParams, ScannerType} from './utils';
import {createTurnOnPairingNavParams} from './TurnOnPairing';
import {useNavigation} from '@react-navigation/native';

export const createTurnOnScannerNavParams = (
  scannerType: ScannerType,
): [string, ScannerParams] => ['TurnOnBarcodeScanner', {scannerType}];

const TurnOnBarcodeScanner = ({route}) => {
  const {scannerType} = route.params;
  const {navigate} = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleStyle}>{`Turn On ${scannerType} Scanner`}</Text>
      <Text>
        Press and hold the small power button until the scanner beeps twice.
      </Text>
      <Button
        title="Next"
        onPress={() => {
          navigate(...createTurnOnPairingNavParams(scannerType));
        }}
      />
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

export default TurnOnBarcodeScanner;

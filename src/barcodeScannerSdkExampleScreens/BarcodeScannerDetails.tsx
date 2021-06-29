import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  Text,
  StyleSheet,
  SafeAreaView,
  Button,
  DeviceEventEmitter,
  Image,
  ScrollView,
  View,
} from 'react-native';

import {NavigationKeys} from '../constants';
import {BarcodeScannerModule} from '../BarcodeScannerModule';

import {useBarcodeScannerContext} from './BarcodeScannerContext';
import {createEditBarcodeScannerNameScreenNavDetails} from './EditBarcodeScannerName';

export const createScannerDetailsNavParams = (): [string] => [
  NavigationKeys.BARCODE_SCANNER_SDK_DETAILS,
];

const BarcodeScannerDetails = () => {
  const {barcodeScanner, setBarcodeScanner} = useBarcodeScannerContext();
  const [scannerData, setScannerData] = useState<string | null>(null);
  const {navigate} = useNavigation();
  // Listen for barcode scan event
  useEffect(() => {
    DeviceEventEmitter.addListener('BARCODE_SCAN_RESULT', scanEvent => {
      if (scanEvent.data) {
        setScannerData(scanEvent.data);
      }
    });
    return () => {
      DeviceEventEmitter.removeListener('BARCODE_SCAN_RESULT', () => {});
    };
  }, []);

  const forgetScanner = () => {
    // call the native module module to remove the bluetooth bond and remove the scanner from shared preferences
    BarcodeScannerModule.forgetScanner();
    // remove barcode scanner from global state
    setBarcodeScanner(undefined);
  };

  const goodBeep = () => {
    BarcodeScannerModule.goodBeep();
  };

  const badBeep = () => {
    BarcodeScannerModule.badBeep();
  };

  const forgetSavedScanners = async () => {
    await BarcodeScannerModule.forgetSavedScanners();
  };

  return (
    <>
      {barcodeScanner ? (
        <ScrollView contentContainerStyle={styles.container}>
          <Text
            style={
              styles.titleStyle
            }>{`Scanner name: ${barcodeScanner.name}`}</Text>
          <Text
            style={
              styles.textStyle
            }>{`Scanner connected: ${barcodeScanner.connected}`}</Text>
          <Text
            style={
              styles.textStyle
            }>{`Scanner battery level: ${barcodeScanner.batteryLevel}`}</Text>
          <Button title="Forget Scanner" onPress={forgetScanner} />
          <Button
            title="Remove all scanners from local storage"
            onPress={forgetSavedScanners}
          />
          <Button title="Good beep" onPress={goodBeep} />
          <Button title="Bad beep" onPress={badBeep} />
          <Text style={styles.titleStyle}>
            Scan the following barcode to test your scanner
          </Text>
          <Text style={styles.textStyle}>
            You should hear the scanner beep and then the screen will render
            "You just scanned a barcode"
          </Text>
          <Text style={styles.textStyle}>1d barcode</Text>
          <Image
            style={styles.imageStyle}
            source={require('./barcodes/linear-barcode.png')}
          />
          <Text style={styles.textStyle}>2d barcode</Text>
          <Image
            style={styles.imageStyle}
            source={require('./barcodes/2d-barcode.png')}
          />
          {scannerData ? (
            <Text style={styles.textStyle}>{scannerData}</Text>
          ) : null}
          <Button
            title="Edit scanner name"
            onPress={() => {
              navigate(...createEditBarcodeScannerNameScreenNavDetails());
            }}
          />
          <Button
            title="Done"
            onPress={() => {
              navigate(NavigationKeys.BARCODE_SCANNER_SDK);
            }}
          />
        </ScrollView>
      ) : (
        <SafeAreaView style={styles.container}>
          <Text style={styles.titleStyle}>
            There are currently no barcode scanners connected
          </Text>
          <Button
            title="Done"
            onPress={() => {
              navigate(NavigationKeys.BARCODE_SCANNER_SDK);
            }}
          />
        </SafeAreaView>
      )}
    </>
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
  textStyle: {
    textAlign: 'center',
    margin: 10,
  },
  imageStyle: {
    margin: 10,
  },
});

export default BarcodeScannerDetails;

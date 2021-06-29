import React, {useEffect} from 'react';
import {Button, SafeAreaView, Text, View, StyleSheet} from 'react-native';
import {createTurnOnScannerNavParams} from './TurnOnBarcodeScanner';
import BluetoothDeviceModule from './bluetooth/BluetoothDeviceModule';
import {useBarcodeScannerContext} from './BarcodeScannerContext';
import {createScannerDetailsNavParams} from './BarcodeScannerDetails';
import {
  BarcodeScannerModule,
  BarcodeScannerState,
} from '../BarcodeScannerModule';
import {useNavigation} from '@react-navigation/native';

const BarcodeScannerSdkScreen = () => {
  // Init the bluetooth module and register listeners to discover bluetooth devices
  BluetoothDeviceModule.init();
  const {barcodeScanner, setBarcodeScanner} = useBarcodeScannerContext();

  // init the barcode scanner module and register listeners to receive scanner updates
  // when the app unmounts we call BarcodeScannerModule.destroy() to clear the listeners
  // this screen is acting as the main entry point to your application
  // Usually the BarcodeScannerModule will be initialized in App.tsx
  type ListenerType = 'orders' | 'products';
  const listenerTypePriorities: ListenerType[] = ['products', 'orders'];
  const onDeviceStateChanged = (barcodeScannerState?: BarcodeScannerState) => {
    if (barcodeScannerState) {
      setBarcodeScanner(barcodeScannerState);
    } else {
      setBarcodeScanner(undefined);
    }
  };
  useEffect(() => {
    BarcodeScannerModule.init(listenerTypePriorities, onDeviceStateChanged);
    return () => {
      BarcodeScannerModule.destroy();
    };
  }, []);

  const {navigate} = useNavigation();
  const PairedScanner = () => {
    return (
      <View>
        <Text>Looks like you have a paired scanner</Text>
        <Button
          title="Go to scanner details"
          onPress={() => {
            navigate(...createScannerDetailsNavParams());
          }}
        />
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleStyle}>Select Scanner Type</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="1d scanner"
          onPress={() => {
            navigate(...createTurnOnScannerNavParams('1d'));
          }}
        />
        <Button
          title="2d scanner"
          onPress={() => {
            navigate(...createTurnOnScannerNavParams('2d'));
          }}
        />
      </View>
      {barcodeScanner ? <PairedScanner /> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  titleStyle: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});
export default BarcodeScannerSdkScreen;

import React, {useState} from 'react';
import {TextInput, StyleSheet, Button, View} from 'react-native';

import {useBarcodeScannerContext} from './BarcodeScannerContext';
import {useNavigation} from '@react-navigation/native';
import {
  BarcodeScannerModule,
  BarcodeScannerState,
} from '../BarcodeScannerModule';
import {NavigationKeys} from '../constants';

export const createEditBarcodeScannerNameScreenNavDetails = (): [string] => [
  NavigationKeys.BARCODE_SCANNER_SDK_EDIT_BARCODE_SCANNER_NAME,
];

const EditBarcodeScannerNameScreen = () => {
  const {goBack} = useNavigation();
  const {barcodeScanner, setBarcodeScanner} = useBarcodeScannerContext();

  const updateScannerNameOnSave = (
    barcodeScanner: BarcodeScannerState,
    updatedName: string,
  ) => {
    // call native module to update scanner name
    BarcodeScannerModule.updateScannerName(updatedName);
    // update global state variable
    setBarcodeScanner({...barcodeScanner, name: updatedName});
    goBack();
  };
  const [scannerName, onChangeScannerName] = useState('');
  return (
    <View>
      <TextInput
        style={styles.input}
        value={scannerName}
        onChangeText={onChangeScannerName}
      />
      <Button
        title="Done"
        onPress={() => {
          if (barcodeScanner && scannerName.length > 0) {
            updateScannerNameOnSave(barcodeScanner, scannerName);
          } else {
            goBack();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
  },
});

export default EditBarcodeScannerNameScreen;

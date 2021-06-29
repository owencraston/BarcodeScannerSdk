import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {Text, StyleSheet, SafeAreaView, Button} from 'react-native';
import {SocketScannerTurnOff} from '../BarcodeScannerModule';
import {NavigationKeys} from '../constants';

export const createTroubleShootPairScannerNavDetails = (): [string] => [
  NavigationKeys.BARCODE_SCANNER_SDK_TROUBLESHOOT_PAIRING,
];

const TroubleShootPairScanner = () => {
  const {goBack} = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleStyle}>Troubleshoot pairing</Text>
      <Text>
        If you are not seeing your barcode scanner, reset your barcode scanner
        and try again:
      </Text>
      <Text>
        1: Press and hold the scan and power buttons at the same time until you
        hear 3 high-to-low beeps, and the barcode scanner turns off.
      </Text>
      <Text>
        2: If your scanner is paired with this or another device, go to the
        device’s Bluetooth settings and forget the barcode scanner.
      </Text>
      <Text>3: Turn on the barcode scanner.</Text>
      <Text>
        4: Scan the barcode below. You’ll hear 3 low-to-high beeps followed by 5
        high-to-low beeps, and the barcode scanner will turn off.
      </Text>
      <Text>5: Turn on the barcode scanner and try pairing again.</Text>
      <SocketScannerTurnOff />
      <Button
        title="Go Back"
        onPress={() => {
          goBack();
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

export default TroubleShootPairScanner;

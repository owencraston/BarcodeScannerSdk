import React from 'react';
import {
  Text,
  StyleSheet,
  SafeAreaView,
  Button,
  ScrollView,
  View,
} from 'react-native';

import useBluetoothDiscovery from './hooks/useBluetoothDiscovery';
import {createScannerConnectionNavDetails} from './BarcodeScannerConnectionState';
import {createTroubleShootPairScannerNavDetails} from './TroubleShootPairScanner';
import {useNavigation} from '@react-navigation/native';

export const createPairScannerNavDetails = (): [string] => [
  'PairBarcodeScanner',
];

const FILTER = 'Socket';

const PairBarcodeScanner = () => {
  const devices = useBluetoothDiscovery(FILTER);
  const {navigate} = useNavigation();

  const BluetoothDeviceList = () => {
    return (
      <ScrollView style={styles.scrollView}>
        {devices.map((device, index) => (
          <View key={device.name}>
            <Button
              title={device.name}
              onPress={() => {
                navigate(...createScannerConnectionNavDetails(device));
              }}
            />
          </View>
        ))}
      </ScrollView>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleStyle}>Pair scanner</Text>
      {devices.length > 0 ? (
        <BluetoothDeviceList />
      ) : (
        <Text>no devices available</Text>
      )}
      <Button
        title="Need help?"
        onPress={() => navigate(...createTroubleShootPairScannerNavDetails())}
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
  scrollView: {
    flex: 1,
  },
});

export default PairBarcodeScanner;

import React, {useCallback, useState} from 'react';
import {Button, Platform, SafeAreaView, StyleSheet, Text} from 'react-native';

import {PermissionResult, requestAndroidLocationPermissions} from './utils';
import {createPairScannerNavDetails} from './PairBarcodeScanner';
import {NavigationKeys} from '../constants';
import {useNavigation} from '@react-navigation/native';

export const createBarcodeLocationPermissionNavDetails = (): [string] => [
  NavigationKeys.BARCODE_SCANNER_SDK_BARCODE_LOCATION_PERMISSION,
];

const BarcodeLocationPermission = () => {
  const {navigate} = useNavigation();
  const [permissionResult, setPermissionResult] = useState<
    undefined | PermissionResult
  >(undefined);

  const onGranted = useCallback(() => {
    navigate(...createPairScannerNavDetails());
  }, [navigate]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const result = await requestAndroidLocationPermissions();
      setPermissionResult(result);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleStyle}>
        Location permissions are required to discover and pair bluetooth
        devices.
      </Text>
      <Button
        title={
          permissionResult === 'granted'
            ? 'Continue pairing'
            : 'Allow location permissions'
        }
        onPress={() => {
          if (permissionResult === 'granted') {
            onGranted();
          } else {
            requestPermission();
          }
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

export default BarcodeLocationPermission;

import {
  createStackNavigator,
  StackNavigationOptions,
  TransitionPreset,
} from '@react-navigation/stack';
import React from 'react';
import {Easing} from 'react-native';

import BarcodeScannerSdkScreen from '../BarcodeScannerSdkScreen';
import TurnOnBarcodeScanner from '../TurnOnBarcodeScanner';
import TurnOnPairing from '../TurnOnPairing';
import PairBarcodeScanner from '../PairBarcodeScanner';
import BarcodeLocationPermission from '../BarcodeLocationPermission';
import BarcodeScannerConnectionState from '../BarcodeScannerConnectionState';
import TroubleShootPairScanner from '../TroubleShootPairScanner';
import BarcodeScannerDetails from '../BarcodeScannerDetails';
import EditBarcodeScannerName from '../EditBarcodeScannerName';
import {NavigationKeys} from '../../constants';

const easing = Easing.out(Easing.poly(4));

const transitionSpec: TransitionPreset['transitionSpec'] = {
  open: {
    animation: 'timing',
    config: {
      duration: 250,
      easing,
    },
  },
  close: {
    animation: 'timing',
    config: {
      duration: 200,
      easing,
    },
  },
};

const ScreenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyle: {
    backgroundColor: undefined,
  },
  cardOverlayEnabled: true,
  transitionSpec,
};

const Stack = createStackNavigator();
const SelectHardwareContainer = () => {
  return (
    <Stack.Navigator screenOptions={ScreenOptions}>
      {/* Default screen to start flow  */}
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK}
        component={BarcodeScannerSdkScreen}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_TURN_ON_SCANNER}
        component={TurnOnBarcodeScanner}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_TURN_ON_PAIRING}
        component={TurnOnPairing}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_PAIR_SCANNER}
        component={PairBarcodeScanner}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_BARCODE_LOCATION_PERMISSION}
        component={BarcodeLocationPermission}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_TROUBLESHOOT_PAIRING}
        component={TroubleShootPairScanner}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_CONNECTION_STATE}
        component={BarcodeScannerConnectionState}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_DETAILS}
        component={BarcodeScannerDetails}
      />
      <Stack.Screen
        name={NavigationKeys.BARCODE_SCANNER_SDK_EDIT_BARCODE_SCANNER_NAME}
        component={EditBarcodeScannerName}
      />
    </Stack.Navigator>
  );
};

export default SelectHardwareContainer;

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationKeys} from './constants';
import SelectHardwareContainer from './barcodeScannerSdkExampleScreens/navigation/BarcodeScannerSdkContainer';
import {BarcodeScannerContextProvider} from './barcodeScannerSdkExampleScreens/BarcodeScannerContext';

const Stack = createStackNavigator();

const NavigationTree = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name={NavigationKeys.BARCODE_SCANNER_SDK}
          component={SelectHardwareContainer}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <>
      <BarcodeScannerContextProvider>
        <NavigationTree />
      </BarcodeScannerContextProvider>
    </>
  );
};

export default App;

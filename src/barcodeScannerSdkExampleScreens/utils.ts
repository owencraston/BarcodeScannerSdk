import {PermissionsAndroid} from 'react-native';

export type ScannerType = '1d' | '2d';

export interface ScannerParams {
  scannerType: ScannerType;
}

export type PermissionResult = 'granted' | 'denied' | 'never_ask_again';

export const requestAndroidLocationPermissions: () => Promise<PermissionResult> =
  async () => {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    if (
      results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED
    ) {
      return 'granted';
    }
    if (
      results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.DENIED ||
      results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.DENIED
    ) {
      return 'denied';
    } else if (
      results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
      results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ) {
      return 'never_ask_again';
    }
    return 'denied';
  };

export const checkLocationPermissions: () => Promise<boolean> = async () => {
  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
};

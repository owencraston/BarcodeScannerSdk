import {DeviceEventEmitter, NativeModules} from 'react-native';

import {
  BARCODE_DEVICE_EVENT,
  BARCODE_SCAN_RESULT,
  BarcodeScannerModule,
} from '../BarcodeScannerModule';

const mockPlatform = 'android';

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  ...jest.requireActual<any>('react-native/Libraries/Utilities/Platform'),
  OS: mockPlatform,
}));

const mockNativeBarcodeScannerSdkModule = {
  connect: jest.fn(),
  badBeep: jest.fn(),
  goodBeep: jest.fn(),
  forgetScanner: jest.fn(),
  updateScannerName: jest.fn(),
  forgetSavedScanners: jest.fn(),
  onSessionStarted: jest.fn(),
  onSessionStopped: jest.fn(),
};

type ListenerType = 'test1' | 'test2';
const listenerTypePriorities: ListenerType[] = ['test1', 'test2'];

const barcode = '1230123012';
const mockBarcodeScannerState = {
  scannerName: barcode,
  connected: true,
  batteryLevel: 100,
};

describe('BarcodeScannerModule', () => {
  beforeEach(() => {
    NativeModules.BarcodeScannerSdkModule = {
      ...mockNativeBarcodeScannerSdkModule,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializing the BarcodeScannerModule calls the native onSessionStarted method', () => {
    BarcodeScannerModule.init(listenerTypePriorities, () => {});
    expect(
      mockNativeBarcodeScannerSdkModule.onSessionStarted,
    ).toHaveBeenCalled();
  });

  it('destroy calls the native onSessionStopped method', () => {
    BarcodeScannerModule.destroy();
    expect(
      mockNativeBarcodeScannerSdkModule.onSessionStopped,
    ).toHaveBeenCalled();
  });

  it('connect calls the native connect method', () => {
    BarcodeScannerModule.connect();
    expect(mockNativeBarcodeScannerSdkModule.connect).toHaveBeenCalled();
  });

  it('badBeep calls the native badBeep method', () => {
    BarcodeScannerModule.badBeep();
    expect(mockNativeBarcodeScannerSdkModule.badBeep).toHaveBeenCalled();
  });

  it('goodBeep calls the native goodBeep method', () => {
    BarcodeScannerModule.goodBeep();
    expect(mockNativeBarcodeScannerSdkModule.goodBeep).toHaveBeenCalled();
  });

  it('updateScannerName calls the native updateScannerName method', () => {
    const updatedName = 'new name';
    BarcodeScannerModule.updateScannerName(updatedName);
    expect(
      mockNativeBarcodeScannerSdkModule.updateScannerName,
    ).toHaveBeenCalledWith(updatedName);
  });

  it('forgetSavedScanners calls the native forgetSavedScanners method', () => {
    BarcodeScannerModule.forgetSavedScanners();
    expect(
      mockNativeBarcodeScannerSdkModule.forgetSavedScanners,
    ).toHaveBeenCalled();
  });

  it('logs message when BARCODE_SCAN_RESULT initialized', () => {
    const spy = jest.spyOn(console, 'log');
    BarcodeScannerModule.init(listenerTypePriorities, () => {});
    DeviceEventEmitter.emit(BARCODE_SCAN_RESULT, {data: barcode});
    expect(spy).toHaveBeenCalledWith(`Got barcode: ${barcode}`);
  });

  it('logs message BARCODE_DEVICE_EVENT when initialized', () => {
    const spy = jest.spyOn(console, 'log');
    BarcodeScannerModule.init(listenerTypePriorities, () => {});
    DeviceEventEmitter.emit(BARCODE_DEVICE_EVENT, mockBarcodeScannerState);
    expect(spy).toHaveBeenCalledWith(
      `${BARCODE_DEVICE_EVENT} with ${mockBarcodeScannerState} state`,
    );
  });
});

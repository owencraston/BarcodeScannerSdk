import type {ReactNode, Dispatch, SetStateAction} from 'react';
import React, {createContext, useContext, useState, useMemo} from 'react';
import { BarcodeScannerState } from '../BarcodeScannerModule';

interface BarcodeScannerContextValue {
  barcodeScanner?: BarcodeScannerState;
  setBarcodeScanner: Dispatch<SetStateAction<BarcodeScannerState | undefined>>;
}

const BarcodeScannerContext = createContext<
  BarcodeScannerContextValue | undefined
>(undefined);

export const useBarcodeScannerContext = () => {
  const context = useContext(BarcodeScannerContext);
  if (context === undefined) {
    throw new Error(
      "BarcodeScannerContext isn't set, is <BarcodeScannerContextProviderProps> ancestor in the component tree?",
    );
  }
  return context;
};

interface BarcodeScannerContextProviderProps {
  children: ReactNode;
}

export const BarcodeScannerContextProvider = ({children}: BarcodeScannerContextProviderProps) => {
  const [barcodeScanner, setBarcodeScanner] = useState<BarcodeScannerState>();
  const value = useMemo(
    () => ({barcodeScanner, setBarcodeScanner}),
    [barcodeScanner, setBarcodeScanner],
  );

  return (
    <BarcodeScannerContext.Provider value={value}>
      {children}
    </BarcodeScannerContext.Provider>
  );
};

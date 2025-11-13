import React, { createContext, useContext } from "react";
import { showAlert as baseShowAlert } from "../utils/AlertManager";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const showAlert = (key, params) => baseShowAlert(key, params);
  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

// Hook para usar en cualquier screen
export const useAlert = () => useContext(AlertContext);
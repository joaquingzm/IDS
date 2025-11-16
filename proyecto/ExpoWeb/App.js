import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./navigation/AppNavigator";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import { Platform } from "react-native";
import { Toaster } from "burnt/web";
import Toast from "react-native-toast-message";
import { toastConfig } from "./utils/ToastConfig";
import { ConfirmProvider } from "./utils/ConfirmService";

export default function App() {
  return (
    <ConfirmProvider>
    <AuthProvider>
      <AlertProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>  
        {Platform.OS === "web" && <Toaster />}
        <Toast config={toastConfig} position="top" />
      </AlertProvider>
    </AuthProvider>
    </ConfirmProvider>
  );
}

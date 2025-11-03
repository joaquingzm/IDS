// AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Mis pantallas
import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
    initialRouteName="Login" 
    screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
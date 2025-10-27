import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // 1. Importá el Tab Navigator
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { openCameraAndTakePhoto } from '../utils/cameraUtils';

// Importá tus pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen'; // Asegurate de crear este archivo
import CartScreen from '../screens/CartScreen';     // Asegurate de crear este archivo
import ProfileScreen from '../screens/ProfileScreen'; // Asegurate de crear este archivo
import { theme } from '../styles/theme';         // Importá tus colores

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator(); // 2. Creá el Tab Navigator

// Función vacía para la pestaña central
function PlaceholderScreen() {
  return <View />;
}

// Función para el botón central personalizado (igual que antes)
function CustomTabBarButton({ children, onPress }) {
  return (
    <TouchableOpacity
      style={styles.cameraButtonContainer}
      onPress={onPress}
    >
      <View style={styles.cameraButton}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

// 3. CREÁ UN COMPONENTE PARA LAS PESTAÑAS (dentro del mismo archivo)
function MainTabs() {
  // Función para manejar la cámara (deberías tenerla aquí o importarla)
  const handleCameraPress = async () => {
    console.log("Abrir cámara...");
    const uri = await openCameraAndTakePhoto();
    // if (uri) console.log(uri);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          // Ajusta los nombres de las rutas si los cambias abajo
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          if (route.name === 'CameraPlaceholder') return null; // No mostramos ícono para el botón central

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* Definí tus pestañas */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="CameraPlaceholder" // Pestaña "falsa" para el botón
        component={PlaceholderScreen}
        options={{
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} onPress={handleCameraPress}>
              <Ionicons name="camera" size={28} color={theme.colors.background} />
            </CustomTabBarButton>
          ),
        }}
      />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 4. TU NAVEGADOR PRINCIPAL (STACK) AHORA USA EL COMPONENTE DE PESTAÑAS
export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      {/* Después del Login, vas al componente que contiene las pestañas */}
      <Stack.Screen name="MainAppTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

// 5. ESTILOS PARA LA BARRA (igual que antes)
const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    height: 70,
  },
  cameraButtonContainer: {
    top: -35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
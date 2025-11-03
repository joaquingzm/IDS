import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; 
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { openCameraAndTakePhoto } from '../utils/cameraUtils';

// Importá tus pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen'; 
import OfertsScreen from '../screens/OfertsScreen';     
import ProfileScreen from '../screens/ProfileScreen'; 
import { theme } from '../styles/theme';        
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator(); 


function PlaceholderScreen() {
  return <View />;
}


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


function MainTabs() {
  const handleCameraPress = async () => {
    console.log("Abrir cámara...");
    const uri = await openCameraAndTakePhoto();
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
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Oferts') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          if (route.name === 'CameraPlaceholder') return null;

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="CameraPlaceholder" 
        component={PlaceholderScreen}
        options={{
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} onPress={handleCameraPress}>
              <Ionicons name="camera" size={28} color={theme.colors.background} />
            </CustomTabBarButton>
          ),
        }}
      />
      <Tab.Screen name="Oferts" component={OfertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainAppTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}


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
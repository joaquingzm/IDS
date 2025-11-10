import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; 
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Image, Alert, Platform } from 'react-native';
import { openCameraAndTakePhoto } from '../utils/cameraUtils';
import { theme } from '../styles/theme';
import { COLECCION_PEDIDO_FARMACIA, CAMPOS_PEDIDO_FARMACIA } from "../dbConfig";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";  
import { uploadImageToCloudinary } from "../context/uploadImage";
import { useNavigation } from "@react-navigation/native";
import {getUsuarioByEmail,getUsuarioByUid, crearPedido} from "../utils/firestoreService"

// Import de las  pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen'; 
import OfertsScreen from '../screens/OfertsScreen';     
import ProfileScreen from '../screens/ProfileScreen';        
import RegisterScreen from '../screens/RegisterScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OfertsPendingScreen from '../screens/OfertsPendingScreen';
import firestoreService from '../utils/firestoreService';

import {
  COLECCION_USUARIOS,
  CAMPOS_USUARIO,
  COLECCION_FARMACIAS,
  CAMPOS_FARMACIA,
  COLECCION_PEDIDO,
  CAMPOS_PEDIDO,
  COLECCION_OFERTA,
  CAMPOS_OFERTA,
  ESTADOS_PEDIDO,
  ESTADOS_OFERTA,
} from "../dbConfig";

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
  const [photoUri, setPhotoUri] = useState(null);
  const navigation = useNavigation();
  const handleCameraPress = async () => {
  console.log("Abrir cámara...");
  const uri = await openCameraAndTakePhoto();
  if (uri) {
    // ENVIAR AL BACKEND
    try {
      // DESPUÉS: PROCESAR OCR (código intacto como estaba)
      const formData = new FormData();

      // IMPORTANTE: Formato según plataforma
      let fileType = { type: "image/jpeg" };

      if (Platform.OS === "web") {
        // En web: convertir blob a File
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("file", blob, `photo_${Date.now()}.jpg`);
      } else {
        // En móvil: usar uri local
        formData.append("file", {
          uri,
          name: `photo_${Date.now()}.jpg`,
          type: "image/jpeg",
        });
      }

      const res = await fetch("http://10.0.2.15:8000/ocr", {
        //IP LOCAL DE LA MAQUINA
        method: "POST",
        body: formData,
      });

      const resultOCR = await res.json();
      console.log("Respuesta del backend:", resultOCR);

      console.log("Subiendo imagen a Cloudinary...");
      const imageUrl = await uploadImageToCloudinary(uri);
      console.log("Imagen subida con éxito:", imageUrl);
        //----------------------------------------------------------------------------
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert("Error", "Usuario no autenticado");
          return;
        }

        console.log("Intentando crear pedido para usuario:", currentUser.email);
        const usuario = await getUsuarioByUid(currentUser.uid);

        // Crear el documento en "PedidosFarmacia"
        const idPedido = await crearPedido({
          // Info cliente
          [CAMPOS_PEDIDO.USER_ID]: currentUser.uid,
          [CAMPOS_PEDIDO.NOMBRE_USUARIO]: usuario[CAMPOS_USUARIO.NOMBRE],
          [CAMPOS_PEDIDO.APELLIDO_USUARIO]: usuario[CAMPOS_USUARIO.APELLIDO],
          [CAMPOS_PEDIDO.OBRASOCIAL]: usuario[CAMPOS_USUARIO.OBRASOCIAL],
          [CAMPOS_PEDIDO.DIRECCION]: usuario[CAMPOS_USUARIO.DIRECCION],

          // Info pedido
          [CAMPOS_PEDIDO.IMAGEN]: imageUrl,
          [CAMPOS_PEDIDO.OCR]: resultOCR,
          [CAMPOS_PEDIDO.FECHA_PEDIDO]: Date(),

          // Estado pedido
          [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.ENTRANTE, // entrante, pendiente, activo, realizado, rechazado
          [CAMPOS_PEDIDO.OFERTA_ACEPTADA_ID]: "ofertaAceptadaId",
          [CAMPOS_PEDIDO.FARMACIA_ASIGANADA_ID]: "farmaciaAsignadaID",

          // Ofertas
          [CAMPOS_PEDIDO.OFERTAS_IDS]: "ofertasId",
        });
        console.log("Pedido guardado en Firestore correctamente, id: " + idPedido);
        //------------------------------------------------------------------------------------
          if (Platform.OS === 'web') {
          window.alert("Pedido registrado.\nEstamos esperando ofertas hechas por las farmacias.");
          navigation.navigate("OfertsPending");
        } else {
          Alert.alert(
            "Pedido registrado",
            "Estamos esperando ofertas hechas por las farmacias",
            [{ text: "OK", onPress: () => navigation.navigate("OfertsPending") }]
          );
        }
      } catch (firestoreError) {
        console.error(" Error guardando pedido en Firestore:", firestoreError);
        Alert.alert("Error", "No se pudo guardar el pedido en la base de datos");
        return;
      }

    } catch (error) {
      console.error("Error enviando imagen:", error);
      Alert.alert("Error", "No se pudo procesar la imagen");
    }
  }
};


  return (<View style={styles.container}>
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

      {/* IMAGEN FLOTANTE: ABAJO A LA DERECHA */}
      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={styles.floatingThumbnail}
        />
      )}
    </View>);
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OfertsPending" component={OfertsPendingScreen} />
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
  floatingThumbnail: { //Todo esto es para que se vea la imagen abajo a la derecha, no hace falta pero esta piola
    position: 'absolute',
    bottom: 90,           // Arriba del tab bar (ajusta si tu tab bar es alto)
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,         // Asegura que esté encima
  },
  container: {
    flex: 1,
    position: 'relative', // Necesario para que absolute funcione
  },
});
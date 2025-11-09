import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; 
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Image, Alert, Platform } from 'react-native';
import { openCameraAndTakePhoto } from '../utils/cameraUtils';
import { theme } from '../styles/theme';
import { COLECCION_PEDIDO_FARMACIA, CAMPOS_PEDIDO_FARMACIA } from "../dbConfig";
import { COLECCION_USUARIOS, CAMPOS_USUARIO } from "../dbConfig";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";  
import { uploadImageToCloudinary } from "../context/uploadImage";

// Import de las  pantallas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen'; 
import OfertsScreen from '../screens/OfertsScreen';     
import ProfileScreen from '../screens/ProfileScreen';        
import RegisterScreen from '../screens/RegisterScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OfertsPendingScreen from '../screens/OfertsPendingScreen';

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
  const handleCameraPress = async () => {
  console.log("Abrir cámara...");
  const uri = await openCameraAndTakePhoto();
  if (uri) {
    //setPhotoUri(uri); Para que se vea abajo a la derecha, no hace falta;
    // ENVIAR AL BACKEND
    try {

      console.log("Subiendo imagen a Cloudinary...");
      const imageUrl = await uploadImageToCloudinary(uri);
      console.log("Imagen subida con éxito:", imageUrl);

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert("Error", "Usuario no autenticado");
          return;
        }

        console.log("Intentando crear pedido para usuario:", currentUser.email);
        // Buscar datos del usuario en la colección usuarios
        const q = query(
          collection(db, COLECCION_USUARIOS),
          where(CAMPOS_USUARIO.EMAIL, "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("Error", "No se encontró el usuario en la base de datos");
          return;
        }
        console.log("Resultado de query usuarios:", querySnapshot.docs.map(d => d.data()));
        const userData = querySnapshot.docs[0].data();

        // Crear el documento en "PedidosFarmacia"
        await addDoc(collection(db, COLECCION_PEDIDO_FARMACIA), {
          [CAMPOS_PEDIDO_FARMACIA.IMAGEN]: imageUrl, // la URL de Cloudinary
          [CAMPOS_PEDIDO_FARMACIA.NOMBRE_USUARIO]: userData[CAMPOS_USUARIO.NOMBRE],
          [CAMPOS_PEDIDO_FARMACIA.APELLIDO_USUARIO]: userData[CAMPOS_USUARIO.APELLIDO],
          [CAMPOS_PEDIDO_FARMACIA.DIRECCION]: userData[CAMPOS_USUARIO.DIRECCION],
          [CAMPOS_PEDIDO_FARMACIA.OBRASOCIAL]: userData[CAMPOS_USUARIO.OBRASOCIAL],
          [CAMPOS_PEDIDO_FARMACIA.USER_ID]: currentUser.uid,
          [CAMPOS_PEDIDO_FARMACIA.FECHA_PEDIDO]: serverTimestamp(),
        });

        console.log("Pedido guardado en Firestore correctamente");
        Alert.alert("Éxito", "Pedido creado correctamente");
      } catch (firestoreError) {
        console.error(" Error guardando pedido en Firestore:", firestoreError);
        Alert.alert("Error", "No se pudo guardar el pedido en la base de datos");
        return;
      }

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

      const data = await res.json();
      console.log("Respuesta del backend:", data);

      if (data.resultado) {
        Alert.alert("Éxito", data.resultado); //RESULTADO DEL OCR!!, JSON HAY QUE VER COMO USARLO
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
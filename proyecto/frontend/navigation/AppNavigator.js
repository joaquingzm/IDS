import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Image, Alert, Platform, Modal, ActivityIndicator, Text } from 'react-native';
import { openCameraAndTakePhoto } from '../utils/cameraUtils';
import { theme } from '../styles/theme';
import { COLECCION_PEDIDO_FARMACIA, CAMPOS_PEDIDO_FARMACIA } from "../dbConfig";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadImageToCloudinary } from "../context/uploadImage";
import { useNavigation } from "@react-navigation/native";
import { checkPedidoExistente, getUsuarioByUid, crearPedido } from "../utils/firestoreService"
import { confirm } from "../utils/ConfirmService";


// Import de las  pantallas
import LoginScreen from '../screens/Login';
import HomeScreen from '../screens/Inicio';
import SearchScreen from '../screens/Busqueda';
import OfertsScreen from '../screens/Pedidos';
import ProfileScreen from '../screens/Perfil';
import RegisterScreen from '../screens/Registro';
import OrderHistoryScreen from '../screens/Historial';
import OfertsPendingScreen from '../screens/Ofertas';
import firestoreService from '../utils/firestoreService';
import { useAlert } from "../context/AlertContext";

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
  const [loading, setLoading] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState("");
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  let resultOCR = '';

  const handleCameraPress = async () => {
    setPhotoUri(null);
    const currentUser = auth.currentUser;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const { pedidoExistente } = await checkPedidoExistente(currentUser.uid);
    if (pedidoExistente) {
      showAlert("pedido_error", { message: "Ya tiene un pedido en curso. Espere a que finalice antes de cargar una nueva receta." });
      return
    }

    const urii = await openCameraAndTakePhoto();
    setEstadoCarga("Subiendo imagen ...");
    setLoading(true);
    await sleep(1500);

    if (!urii) {
      setLoading(false);
      showAlert("pedido_error", { message: "No se pudo cargar la receta. Intente nuevamente." });
      return;
    }
    setLoading(false);
    setPhotoUri(urii);

    const ok = await confirm("confirmar_eliminar_pedido", { id: "Holaaaa", image: urii });

    if (!ok) {
      showAlert("pedido_error", { title: "Aviso", message: "Receta no cargada." });
      return
    }
    // ENVIAR AL BACKEND
    setLoading(true);
    try {

      console.log("Convirtiendo URI a blob...", urii);
      const responseUri = await fetch(urii);
      const blob = await responseUri.blob();
      console.log("Blob creado, size:", blob.size, "type:", blob.type);

      // DESPUÉS: PROCESAR OCR (código intacto como estaba)
      const formData = new FormData();

      formData.append("file", blob, `photo_${Date.now()}.jpg`);
      console.log("Enviando imagen al backend OCR...");
      const formDataOCR = new FormData();
      // convert URI -> blob
      const resp = await fetch(urii);
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        setLoading(false);
        throw new Error(`No se pudo leer la imagen localmente. status=${resp.status} body=${txt}`);
      }
      const blobOCR = await resp.blob();
      formDataOCR.append("file", blobOCR, `photo_${Date.now()}.jpg`);

      setEstadoCarga("Procesando receta ...");
      const OCR_URL = "http://163.10.141.132:8000/ocr";
      const ocrRes = await fetch(OCR_URL, {
        method: "POST",
        body: formDataOCR,
      });



      if (!ocrRes.ok) {
        const body = await ocrRes.text().catch(() => null);
        console.error("OCR backend error:", ocrRes.status, body);
        setLoading(false);
        throw new Error();
      }


      resultOCR = await ocrRes.json().catch(() => null);
      console.log("Respuesta OCR:", resultOCR);

    } catch (error) {
      console.error("Error OCR:", error);
      // continuar para intentar subir/crear pedido o terminar
    }

    // 👇 2) Subir imagen a Cloudinary (usamos la función mejorada)
    console.log("Subiendo imagen a Cloudinary...");
    const imageUrl = await uploadImageToCloudinary(urii); // usa la función mejorada
    console.log("Imagen subida con éxito:", imageUrl);
    setEstadoCarga("Creando pedido ...");

    try {
      if (!currentUser) {
        setLoading(false);
        throw new Error();
      }

      // Obtener datos del usuario
      const usuario = await getUsuarioByUid(currentUser.uid);
      if (!usuario) {
        setLoading(false);
        throw new Error();
      }


      // Preparar payload (crearPedido ya coloca serverTimestamp() internamente)
      const payload = {
        [CAMPOS_PEDIDO.USER_ID]: currentUser.uid,
        [CAMPOS_PEDIDO.NOMBRE_USUARIO]: usuario[CAMPOS_USUARIO.NOMBRE] || "",
        [CAMPOS_PEDIDO.APELLIDO_USUARIO]: usuario[CAMPOS_USUARIO.APELLIDO] || "",
        [CAMPOS_PEDIDO.OBRASOCIAL]: usuario[CAMPOS_USUARIO.OBRASOCIAL] || "",
        [CAMPOS_PEDIDO.OBRASOCIAL_NUM]: usuario[CAMPOS_USUARIO.OBRASOCIAL_NUM] || "",
        [CAMPOS_PEDIDO.DIRECCION]: usuario[CAMPOS_USUARIO.DIRECCION] || "",
        [CAMPOS_PEDIDO.IMAGEN]: imageUrl,
        [CAMPOS_PEDIDO.OCR]: resultOCR || null,
        // no seteamos FECHA_PEDIDO (crearPedido lo hace con serverTimestamp)
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.ENTRANTE,
      };



      const idPedido = await crearPedido(payload);
      console.log("Pedido guardado en Firestore correctamente, id:", idPedido);
      setLoading(false);
      showAlert("pedido_success", { message: "La receta fue subida correctamente. Pedido generado." });
    } catch {
      showAlert("pedido_error", { message: "No se pudo cargar la receta. Intente nuevamente." });
      setLoading(false);
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
          if (route.name === "CameraPlaceholder") return null;

          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Oferts") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          const labels = {
            Home: "Inicio",
            Search: "Busqueda",
            Oferts: "Pedidos",
            Profile: "Perfil",
          };

          return (
            <View style={styles.tabItem}>
              <Ionicons name={iconName} size={focused ? 30 : 24} color={color} />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color,
                    fontWeight: focused ? 700 : 400, // Texto más fuerte cuando está activo
                    fontSize: focused ? 12 : 11,
                  },
                ]}
              >
                {labels[route.name]}
              </Text>
            </View>
          );
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

    {/* UN SOLO MODAL COMBINADO: se muestra SOLO cuando loading === true */}
    <Modal
      visible={loading}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        {/* Imagen arriba */}
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.fullImage} resizeMode="contain" />
        ) : null}

        {/* Texto + spinner debajo de la imagen */}
        <View style={{ marginTop: 18, alignItems: 'center' }}>
          <Text style={styles.mensaje}>{estadoCarga}</Text>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    </Modal>

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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    height: 80,
    paddingBottom: 8,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 70,
  },

  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  mensaje: {
    color: theme.colors.primary,
    fontSize: 16,
    marginBottom: 10, // 🔹 separación entre el texto y el spinner
    textAlign: "center",
  },
  modalContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "60%",
    borderRadius: 12,
    marginBottom: 8,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },

  modalSubtitle: {
    color: "white",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
});

import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image,Modal, ActivityIndicator } from "react-native";
import { AuthContext } from "../context/AuthContext.js";
import { theme } from "../styles/theme";
import Logo from "../assets/LogoRappiFarma.png";
import useNav from "../hooks/UseNavigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth} from "../firebase";
import { useAlert } from "../context/AlertContext";
import firestoreService, { getFarmaciaById } from "../utils/firestoreService";


export default function LoginScreen({navigation}) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { goRegister } = useNav();
  const { showAlert } = useAlert();
  const [loading, setLoading]= useState(false);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function handleLogin() {
    setLoading(true);
    if (!email || !password) {
     setLoading(false);
      showAlert("campos_incompletos");
      return;
    }

    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      // Usamos el servicio centralizado para obtener el documento del usuario
      let usuario = null;
      try {
        if (typeof firestoreService.getFarmaciaById === "function") {
          usuario = await firestoreService.getFarmaciaById(uid);
        }
      } catch (err) {
        setLoading(false);
        console.warn("Error obteniendo usuario desde firestoreService:", err);
        showAlert("registro_error",{ message: "Error al obtener usuario" });
      }

      if (!usuario) {
        // No existe el perfil en la colección de usuarios -> desloguear y avisar
        await auth.signOut();
        showAlert("registro_error",{ message: "Credenciales inválidas. Verifique sus datos e intente nuevamente" });
        setLoading(false);
        return;
      }

      // Guardar en contexto (si existe)
      try {
        if (typeof login === "function") {
          login({ uid, email: user.email, profile: usuario });
        }
      } catch (err) {
        setLoading(false);
        console.warn("AuthContext.login falló:", err);
      }
      setLoading(false);
      showAlert("registro_success",{ message: "Inicio de sesión exitoso" });
      navigation.replace("Main");
    } catch (error) {
      console.log("Error al iniciar sesión:", error?.message ?? error);
      setLoading(false); 
      showAlert("registro_error",{ message: "Credenciales inválidas. Verifique sus datos e intente nuevamente" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.img} />
      <Text style={styles.title}>Iniciar sesión</Text>
      <View style={styles.card} >
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={theme.colors.mutedForeground}
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

    </View>
    <View>
      
      <TouchableOpacity onPress={goRegister}>
        <Text style={styles.registerText}>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
    <Modal
              visible={loading}
              transparent={true}
              animationType="fade"
              statusBarTranslucent={true}
              >
              <View style={styles.overlay}>
              {/* 🔹 Spinner de carga */}
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
      </Modal>
  </View>
  
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: theme.typography.fontSize["3xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  img: {
    marginVertical: theme.spacing.md,
    width: 150,
    height:150,
    alignSelf: "center",
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.foreground,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginTop: theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
  },
  registerText: {
    marginTop: theme.spacing.xl,
    color: theme.colors.mutedForeground,
    textAlign: "center",
  },
   card: {
    backgroundColor: theme.colors.Background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3, 
  },
  card: {
    backgroundColor: theme.colors.Background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xl,
    shadows:theme.shadows.sm,
    elevation: 3, 
  },
   overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
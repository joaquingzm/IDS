import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { theme } from "../styles/theme";
import Logo from "../assets/LogoRappiFarma.png";
import useNav from "../hooks/UseNavigation";
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail  } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { COLECCION_USUARIOS } from "../dbConfig";
import firestoreService from "../utils/firestoreService";
import * as Burnt from "burnt";
import { alertPresets } from "../utils/alertPresets";
import { useAlert } from "../context/AlertContext";

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { goRegister } = useNav();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();


  async function handleLogin() {
    
    if (!email || !password) {
      showAlert("login_error", { message: "Campos vacios" });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      // Usamos el servicio centralizado para obtener el documento del usuario
      let usuario = null;
      try {
        if (typeof firestoreService.getUsuarioByUid === "function") {
          usuario = await firestoreService.getUsuarioByUid(uid);
        }
      } catch (err) {
        console.warn("Error obteniendo usuario desde firestoreService:", err);
        showAlert("error_red", { message: "Error al obtener usuario" });
      }

      if (!usuario) {
        // No existe el perfil en la colección de usuarios -> desloguear y avisar
        await auth.signOut();
        showAlert("error_red", { message: "Credenciales inválidas. Verifique sus datos e intente nuevamente." });
        setLoading(false);
        return;
      }

      // Opcional: si querés validar rol, descomenta esto
      // if ((usuario.rol || usuario[CAMPOS_USUARIO.ROL]) !== "user") {
      //   await auth.signOut();
      //   Alert.alert("Error", "Esta cuenta no es de tipo usuario.");
      //   setLoading(false);
      //   return;
      // }

      // Guardar en contexto (si existe)
      try {
        if (typeof login === "function") {
          login({ uid, email: user.email, profile: usuario });
        }
      } catch (err) {
        console.warn("AuthContext.login falló:", err);
      }
      
      showAlert("login_success", { message: "Inicio de sesión exitoso." });
      navigation.replace("MainAppTabs");
    } catch (error) {
      console.log("Código de error:", error.code);
      showAlert("login_error", { message: "Credenciales inválidas. Verifique sus datos e intente nuevamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image source={Logo} style={styles.logo} />
          <Text style={styles.appName}>RappiFarma</Text>
          <Text style={styles.subtitle}>Tu salud, más cerca que nunca</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>

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
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Ingresar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={goRegister}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta?{" "}
            <Text style={styles.registerHighlight}>Crear cuenta</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    marginBottom: theme.spacing.sm,
  },
  appName: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
    textAlign: "center",
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
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
  },
  registerText: {
    textAlign: "center",
    marginTop: theme.spacing.lg,
    color: theme.colors.mutedForeground,
  },
  registerHighlight: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

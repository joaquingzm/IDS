import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { AuthContext } from "../context/AuthContext.js";
import { theme } from "../styles/theme";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { COLECCION_FARMACIAS, CAMPOS_FARMACIA } from "../dbConfig";
import useNav from "../hooks/UseNavigation";
import { createFarmacia } from "../utils/firestoreService.js";
import { useAlert } from "../context/AlertContext";
import { checkFarmaciaExistente } from "../utils/firestoreService";

export default function RegisterScreen({navigation}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const { goLogin } = useNav();
   const { showAlert } = useAlert();
  
  const handleRegister = async () => {
  try {
    // Validaciones de campos
    if (!nombre.trim() || !direccion.trim() || !email.trim() || !password.trim() || !telefono.trim()) {
      showAlert("campos_incompletos");
      return;
    }
    if (password.length < 6) {
      showAlert("campo_invalido", { message: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert("campo_invalido", { message: "El correo electrónico no tiene un formato válido." });
      return;
    }
    const telefonoRegex = /^[0-9]+$/;
    if (!telefonoRegex.test(telefono)) {
      showAlert("campo_invalido", { message: "El teléfono debe contener solo números." });
      return;
    }

    // Verifica duplicados en Firestore
    const { emailExistente, direccionExistente, telefonoExistente } =
      await checkFarmaciaExistente({ email, direccion, telefono });

    if (emailExistente) {
      showAlert("error", { message: "Ya existe una farmacia registrada con ese correo electrónico." });
      return;
    }
    if (direccionExistente) {
      showAlert("error", { message: "Ya existe una farmacia registrada en esa dirección." });
      return;
    }
    if (telefonoExistente) {
      showAlert("error", { message: "Ya existe una farmacia registrada con ese teléfono." });
      return;
    }

    // Crear usuario en Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await signInWithEmailAndPassword(auth, email, password); // 🔐 fuerza autenticación activa

    const user = auth.currentUser;

    // Crear farmacia en Firestore
    await createFarmacia(
      { email, nombre, direccion, rol: "farmacia", telefono },
      user.uid
    );

    console.log("Usuario registrado:", user.uid);
    showAlert("success", { message: "Registro exitoso" });
    goLogin();
  } catch (error) {
    showAlert("error", { message: "Error al registrar el usuario: " + error.message });
    console.log("Error al registrar:", error);
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.card}>
      <Text style={styles.title}>Registro</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        placeholderTextColor={theme.colors.mutedForeground}
        autoCapitalize="none"
        value={nombre}
        onChangeText={setNombre}
      />

           <TextInput
        style={styles.input}
        placeholder="Direccion"
        placeholderTextColor={theme.colors.mutedForeground}
        autoCapitalize="none"
        value={direccion}
        onChangeText={setDireccion}
      />

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
      

       <TextInput
        style={styles.input}
        placeholder="Telefono"
        placeholderTextColor={theme.colors.mutedForeground}
        autoCapitalize="none"
        keyboardType="numeric"
        value={telefono}
        onChangeText={setTelefono}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

       <Text
        style={styles.buttonTextSesion}
        onPress={() => navigation.navigate("Login")}
      >
        ¿Ya tenés cuenta? Iniciá sesión
      </Text>
    </View>
    <View>
    </View>
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: "center",
  },
  buttonTextSesion: {
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    padding: theme.spacing.md,
    textAlign: "center",
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
  backgroundColor: theme.colors.card,
  borderRadius: theme.borderRadius.lg,
  padding: theme.spacing.lg,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
  },
});
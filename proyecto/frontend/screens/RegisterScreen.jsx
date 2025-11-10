import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, Platform } from "react-native";
import { theme } from "../styles/theme";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import useNav from "../hooks/UseNavigation";
import { crearUsuario } from "../utils/firestoreService";


export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dni, setDni] = useState("");
  const [obraSocial, setObraSocial] = useState("");
  const [direccion, setDireccion] = useState("");
  const {navigation} = useNav();
 
  

 const handleRegister = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await crearUsuario(
      { email, nombre, apellido, rol: "cliente", obraSocial, dni, direccion },
      user.uid 
    );

   
    if (Platform.OS === 'web') {
      window.alert("Registro exitoso\nTu cuenta se creó correctamente");
      navigation.navigate("Login");
    } else {
   
      Alert.alert(
        "Registro exitoso", 
        "Tu cuenta se creó correctamente", 
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate("Login") 
          }
        ]
      );
    }

  } catch (error) {
    
    if (Platform.OS === 'web') {
      if (error.code === "auth/email-already-in-use") {
        window.alert("Correo ya registrado\nEste correo ya está registrado. Iniciá sesión o usá otro correo.");
      } else if (error.code === "auth/weak-password") {
        window.alert("Contraseña débil\nLa contraseña debe tener al menos 6 caracteres");
      } else if (error.code === "auth/invalid-email") {
        window.alert("Email inválido\nEl formato del email no es correcto");
      } else {
        window.alert("Error: " + error.message);
      }
    } else {
    
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Correo ya registrado",
          "Este correo ya está registrado. Iniciá sesión o usá otro correo."
        );
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "El email no tiene un formato válido");
      } else {
        Alert.alert("Error al registrar usuario", error.message);
      }
    }
  }
};


  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.title}>Crear cuenta</Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Completá tus datos para continuar</Text>

          <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={theme.colors.mutedForeground} value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor={theme.colors.mutedForeground} value={apellido} onChangeText={setApellido} />
          <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor={theme.colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor={theme.colors.mutedForeground} secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="DNI" placeholderTextColor={theme.colors.mutedForeground} keyboardType="numeric" value={dni} onChangeText={setDni} />
          <TextInput style={styles.input} placeholder="Obra Social (opcional)" placeholderTextColor={theme.colors.mutedForeground} value={obraSocial} onChangeText={setObraSocial} />
          <TextInput style={styles.input} placeholder="Dirección" placeholderTextColor={theme.colors.mutedForeground} value={direccion} onChangeText={setDireccion} />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>

          <Text style={styles.loginText}>
            ¿Ya tenés cuenta?{" "}
            <Text style={styles.linkText} onPress={() => navigation.navigate("Login")}>
              Iniciá sesión
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
     backgroundColor: theme.colors.accent,
  },
  container: {
    flex: 1,
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  img: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize["3xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    borderRadius: theme.borderRadius.xl,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loginText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.mutedForeground,
    textAlign: "center",
    fontSize: theme.typography.fontSize.base,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { AuthContext } from "../context/AuthContext.js";
import { theme } from "../styles/theme";
import Logo from "../assets/LogoRappiFarma.png";
import useNav from "../hooks/UseNavigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { COLECCION_USUARIOS, COLECCION_FARMACIAS } from "../dbConfig";
import { doc, getDoc } from "firebase/firestore";

export default function LoginScreen({navigation}) {
  const { login } = useContext(AuthContext);


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { goRegister } = useNav();
  const { goMain } = useNav();

  async function handleLogin() {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const farmaciaRef = doc(db, COLECCION_FARMACIAS, user.uid);
    const farmaciaSnap = await getDoc(farmaciaRef);

    if (farmaciaSnap.exists()) {
      navigation.replace("MainAppTabsFarmacia");
      return;
    }

    await auth.signOut();
    alert("Email o contraseña incorrectos");

  } catch (error) {
    alert("Email o contraseña incorrectos");
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
});
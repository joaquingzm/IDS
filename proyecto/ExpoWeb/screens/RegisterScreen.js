import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { AuthContext } from "../context/AuthContext.js";
import { theme } from "../styles/theme";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { COLECCION_FARMACIAS, CAMPOS_FARMACIA } from "../dbConfig";
import useNav from "../hooks/UseNavigation";

export default function RegisterScreen({navigation}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const { goLogin } = useNav();
  const handleRegister = async() => {
    try{
        const UserCredential = await createUserWithEmailAndPassword(auth,email,password);
        const user = UserCredential.user;
        
        
        await new Promise((resolve) => {
          const unsub = auth.onAuthStateChanged((u) => {
            if (u) {
              unsub();
              resolve();
            }
          });
        });

        await setDoc(doc(db, COLECCION_FARMACIAS,user.uid),{
        [CAMPOS_FARMACIA.EMAIL]: email,
        [CAMPOS_FARMACIA.NOMBRE]: nombre,
        [CAMPOS_FARMACIA.TELEFONO]: telefono,
        [CAMPOS_FARMACIA.ROL]: "Farmacia",
        [CAMPOS_FARMACIA.FECHA_REGISTRO]: new Date(),
        [CAMPOS_FARMACIA.DIRECCION]: direccion,
       });

     console.log("Usuario registrado:", user.uid);
      alert("Registro exitoso");
      goLogin();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Este correo ya está registrado. Iniciá sesión o usá otro correo.");
         } else {
          alert("Error al registrar el usuario: " + error.message);
            }
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
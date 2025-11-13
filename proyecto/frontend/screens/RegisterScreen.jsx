import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, Platform, Modal, ActivityIndicator } from "react-native";
import { theme } from "../styles/theme";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import useNav from "../hooks/UseNavigation";
import { crearUsuario, checkUsuarioExistente } from "../utils/firestoreService";
import { useAlert } from "../context/AlertContext";


export default function RegisterScreen() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dni, setDni] = useState("");
  const [obraSocial, setObraSocial] = useState("");
  const [obraSocialNum, setObraSocialNum] = useState("");
  const [direccion, setDireccion] = useState("");
  const {navigation} = useNav();
  const [loading, setLoading]= useState(false);
  const { showAlert } = useAlert();
 
  

 const handleRegister = async () => {
  setLoading(true);
  if (
  !nombre.trim() ||
  !apellido.trim() ||
  !email.trim() ||
  !password.trim() ||
  !dni.trim() ||
  !direccion.trim()) {
  showAlert("registro_error", { message: "Campos obligatorios en blanco." });
  setLoading(false);
  return;
}
try {
  const {emailExistente, dniExistente, obraExistente} = await checkUsuarioExistente(email, dni, obraSocial, obraSocialNum);

  if (emailExistente){
    showAlert("registro_error", { message: "El mail ya está registrado." });
    setLoading(false);
    return
  }

  if (dniExistente){
    showAlert("registro_error", { message: "El DNI ya está registrado." });
    setLoading(false);
    return
  }

  if (obraSocial.trim() && obraSocialNum.trim()){
    if (obraExistente){
      showAlert("registro_error", { message: "El número de afiliado de "+obraSocial+" ya está registrado." });
      setLoading(false);
      return
    }
  }else{
    setObraSocial(undefined);
    setObraSocialNum(undefined);
  }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Antes de crear");
    await crearUsuario(
      { email, nombre, apellido, rol: "cliente", obraSocial, obraSocialNum, dni, direccion },
      user.uid 
    );
      showAlert("registro_success",nombre);
      setLoading(false);
      navigation.navigate("Login");
  } catch (error) {
    showAlert("registro_error", { message: "Hubo un error al crear el Usuario, intentelo nuevamente." });
    console.log(error)
    setLoading(false);
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
          <TextInput style={styles.input} placeholder="Numero Obra Social (opcional)" placeholderTextColor={theme.colors.mutedForeground} value={obraSocialNum} onChangeText={setObraSocialNum} />
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

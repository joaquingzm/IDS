import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, TextInput,Alert,SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme'; 
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth'; 
import { useNavigation } from 'expo-router';


export default function ProfileScreen({}) {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dontSaveCredentials, setDontSaveCredentials] = useState(false);
  const navigation = useNavigation();

  const showToast = (message) => {
    Alert.alert("Información", message);
  };

 
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    }); 
      })
      .catch((error) => {
        console.error("Error al cerrar sesión: ", error);
        Alert.alert("Error", "No se pudo cerrar la sesión.");
      });
  };

  return (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Información de cuenta</Text>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value="Farmacia Don Roberto"
            editable={false}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            value="Av 1 e 30 y 36 Nro 1675"
            editable={false}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mail</Text>
          <TextInput
            value={auth.currentUser ? auth.currentUser.email : "..."}
            editable={false}
            style={styles.input}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Teléfono</Text>
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nro de teléfono</Text>
          <TextInput
            value="123456789"
            editable={false}
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={() => showToast('Función de actualización de Nro de teléfono próximamente disponible')}
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={styles.outlineButtonText}>Actualizar número de teléfono</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => showToast('Redirigiendo a cambiar contraseña')}
        style={({ pressed }) => [
          styles.outlineButton,
          pressed && { backgroundColor: theme.colors.card },
        ]}
      >
        <Text style={styles.outlineButtonText}>Cambiar contraseña</Text>
      </Pressable>

      
               <TouchableOpacity 
          style={[styles.outlineButton, { borderColor: theme.colors.destructive, marginTop: theme.spacing.md }]}
          onPress={handleLogout}
        >
          <Text style={[styles.outlineButtonText, { color: theme.colors.destructive }]}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>   
      </ScrollView>
    </SafeAreaView>
);
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing["2xl"],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    textAlign: "center",
    borderBottomWidth: 2,
    borderColor: theme.colors.mutedForeground,
    paddingBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.foreground,
    fontSize: 16,
  },
  outlineButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
    transition: "background-color 0.2s ease",
  },
  outlineButtonText: {
    color: theme.colors.foreground,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.md,
  },
  destructiveButton: {
    borderColor: theme.colors.destructive,
    marginTop: theme.spacing.lg,
  },
  destructiveText: {
    color: theme.colors.destructive,
  },
});


// ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, SafeAreaView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigation } from 'expo-router';
import { useAlert } from "../context/AlertContext";
import { getFarmaciaById } from "../utils/firestoreService";

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { showAlert } = useAlert();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Cargar datos del usuario 
  useEffect(() => {
    const loadData = async () => {
      try {
        const uid = auth.currentUser?.uid;

        if (!uid) {
          showAlert("error", { message: "No hay usuario logueado" });
          return;
        }

        const doc = await getFarmaciaById(uid);
        if (doc) {
          setUserData(doc);
        } else {
          showAlert("error", { message: "No se encontraron datos del usuario" });
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        showAlert("error");
      } finally {
        setLoadingUser(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await sleep(300);

    signOut(auth)
      .then(() => {
        setLoading(false);
        showAlert("signout_success");
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error al cerrar sesión: ", error);
        showAlert("signout_error");
      });
  };

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
              value={userData?.nombre_farmacia || ""}
              editable={false}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>

            <TextInput
              value={userData?.Direccion || ""}
              editable={false}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mail</Text>
            <TextInput
              value={auth.currentUser?.email || "..."}
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
              value={userData?.["Telefono comercial"] || ""}
              editable={false}
              style={styles.input}
            />
          </View>

          <Pressable
            onPress={() =>
              showAlert("info", { message: "Función de actualización de Nro de teléfono próximamente disponible" })
            }
            style={({ pressed }) => [
              styles.outlineButton,
              pressed && { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={styles.outlineButtonText}>Actualizar número de teléfono</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => showAlert("info", { message: "Redirigiendo a cambiar contraseña" })}
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && { backgroundColor: theme.colors.card },
          ]}
        >
          <Text style={styles.outlineButtonText}>Cambiar contraseña</Text>
        </Pressable>

        <Modal visible={loading} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Modal>

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
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContainer: { flex: 1 },
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
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: 14, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs },
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
  },
  outlineButtonText: {
    color: theme.colors.foreground,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

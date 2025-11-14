// screens/ProfileScreen.jsx
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { AuthContext } from '../context/AuthContext';
import { CAMPOS_USUARIO } from '../dbConfig';
import firestoreService from '../utils/firestoreService'; // ruta según tu proyecto
import { useAlert } from "../context/AlertContext";

export default function ProfileScreen({ navigation }) {
  const { showAlert } = useAlert();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dontSaveCredentials, setDontSaveCredentials] = useState(false);

  const { user } = useContext(AuthContext); // user = { uid, email, profile } si lo guardaste en Login
  const [profile, setProfile] = useState(user?.profile ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // si no hay profile en el contexto, intentar obtenerlo desde Firestore
    async function fetchProfileIfMissing() {
      if (!profile && auth.currentUser) {
        setLoading(true);
        try {
          if (typeof firestoreService.getUsuarioByUid === 'function') {
            const p = await firestoreService.getUsuarioByUid(auth.currentUser.uid);
            if (p) setProfile(p);
          }
        } catch (err) {
          console.warn('No se pudo obtener perfil desde Firestore:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchProfileIfMissing();
  }, [profile]);

  const showToast = (message) => {
    Alert.alert("Información", message);
  };

  const handleLogout = async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    await signOut(auth);

    showAlert("signout_success");
    setLoading(true);

    await sleep(400);

    setLoading(false);
    navigation.replace("Login");
  } catch (error) {
    console.error("Error al cerrar sesión: ", error);
    showAlert("signout_error");
  }
};

  // helpers para leer campos con fallback (soportando distintas estructuras)
  const getField = (keyConst, altKey) => {
    if (!profile) return '';
    // profile puede venir como { nombre: 'X' } o { nombreUsuario: 'X' } u otras keys,
    // probamos con la constante y con altKey y con la misma key en camelCase
    return profile[keyConst] ?? profile[altKey] ?? profile[altKey?.toLowerCase()] ?? profile[keyConst?.toLowerCase()] ?? '';
  };

  const nombre = getField(CAMPOS_USUARIO.NOMBRE, 'nombre');
  const apellido = getField(CAMPOS_USUARIO.APELLIDO, 'apellido');
  const dni = getField(CAMPOS_USUARIO.DNI, 'dni');
  const email = auth.currentUser?.email ?? getField(CAMPOS_USUARIO.EMAIL, 'email');
  const direccion = getField(CAMPOS_USUARIO.DIRECCION, 'direccion');
  const obraSocial = getField(CAMPOS_USUARIO.OBRASOCIAL, 'obraSocial');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil y configuración</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Seguridad</Text>
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <Ionicons name="finger-print-outline" size={22} color={theme.colors.mutedForeground} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Autenticación biométrica</Text>
              <Text style={styles.settingDescription}>Usa huella o Face ID</Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={setIsBiometricEnabled}
              thumbColor={isBiometricEnabled ? theme.colors.primary : "#f4f3f4"}
              trackColor={{ false: "#767577", true: theme.colors.accent }}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.settingItem}>
            <Ionicons name="eye-off-outline" size={22} color={theme.colors.mutedForeground} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>No guardar credenciales</Text>
              <Text style={styles.settingDescription}>Mayor seguridad</Text>
            </View>
            <Switch
              value={dontSaveCredentials}
              onValueChange={setDontSaveCredentials}
              thumbColor={dontSaveCredentials ? theme.colors.primary : "#f4f3f4"}
              trackColor={{ false: "#767577", true: theme.colors.accent }}
            />
          </View>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Cerrar sesiones remotas</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Información de cuenta</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput value={nombre} editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput value={apellido} editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DNI</Text>
            <TextInput value={dni} editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mail</Text>
            <TextInput value={email} editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput value={direccion} editable={false} style={styles.input} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Obra Social</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Obra social</Text>
            <TextInput value={obraSocial} editable={false} style={styles.input} />
          </View>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => showToast('Función de actualización de obra social próximamente disponible')}
          >
            <Text style={styles.outlineButtonText}>Actualizar obra social</Text>
          </TouchableOpacity>

          <View style={styles.alertBox}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.alertText}>
              Si no tienes obra social, puedes agregarla desde esta opción
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => showToast('Redirigiendo a cambiar contraseña')}
        >
          <Text style={styles.outlineButtonText}>Cambiar contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: theme.colors.destructive, marginTop: theme.spacing.md }]}
          onPress={handleLogout}
        >
          <Text style={[styles.outlineButtonText, { color: theme.colors.destructive }]}>
            Cerrar sesión
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* ... (mantené tus estilos tal cual los tenías) ... */
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.foreground,
    fontWeight: theme.typography.fontWeight.medium,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  outlineButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  outlineButtonText: {
    color: theme.colors.foreground,
    fontWeight: theme.typography.fontWeight.medium,
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
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  alertText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: '#1e40af',
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

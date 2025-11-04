import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TextInput,
  Alert,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme'; // Asumo que la ruta es correcta
import { auth } from '../firebase'; // Importamos 'auth'
import { signOut } from 'firebase/auth'; // Importamos la función 'signOut'

// Este componente recibe 'navigation' automáticamente desde AppNavigator
export default function ProfileScreen({ navigation }) {
  // Estados para los switches (simulados)
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dontSaveCredentials, setDontSaveCredentials] = useState(false);

  // Función para simular el "toast" de Sonner (usamos Alert nativo)
  const showToast = (message) => {
    Alert.alert("Información", message);
  };

  // Función para manejar el logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace('Login'); 
      })
      .catch((error) => {
        console.error("Error al cerrar sesión: ", error);
        Alert.alert("Error", "No se pudo cerrar la sesión.");
      });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Naranja (estilo de tu app) */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()} 
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil y configuración</Text>
      </View>

      {/* Contenido con Scroll */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* ---- Card de Seguridad ---- */}
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

        {/* ---- Card de Información de Cuenta ---- */}
        <Text style={styles.sectionTitle}>Información de cuenta</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput value="María" editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellido</Text>
            <TextInput value="González" editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DNI</Text>
            <TextInput value="38.456.789" editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mail</Text>
            <TextInput value={auth.currentUser ? auth.currentUser.email : "..."} editable={false} style={styles.input} />
          </View>
        </View>

        {/* ---- Card de Obra Social ---- */}
        <Text style={styles.sectionTitle}>Obra Social</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nro de afiliado</Text>
            <TextInput value="123456789" editable={false} style={styles.input} />
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

        {/* ---- Botones de Acción Finales ---- */}
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
    </SafeAreaView>
  );
}

// --- ESTILOS SIMPLIFICADOS (Usando tu theme.js) ---
const styles = StyleSheet.create({
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
    paddingBottom: 100, // Espacio para la barra de pestañas
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
    flex: 1, // Permite que el texto se ajuste si es largo
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
    color: theme.colors.foreground, // Color del texto
    fontSize: 16,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff', // bg-blue-50 (inferido)
    borderColor: '#dbeafe', // border-blue-200 (inferido)
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  alertText: {
    flex: 1, 
    marginLeft: theme.spacing.sm,
    color: '#1e40af', // text-blue-800 (inferido)
  },
});
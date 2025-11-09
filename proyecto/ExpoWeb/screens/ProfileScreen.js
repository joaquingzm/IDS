import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, TextInput,Alert,SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme'; 
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth'; 


export default function ProfileScreen({ navigation }) {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [dontSaveCredentials, setDontSaveCredentials] = useState(false);

  const showToast = (message) => {
    Alert.alert("Información", message);
  };

 
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
      

   
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >

        <Text style={styles.sectionTitle}>Información de cuenta</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput value="Farmacia Don Roberto" editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Direccion</Text>
            <TextInput value="Av 1 e 30 y 36 Nro 1675" editable={false} style={styles.input} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mail</Text>
            <TextInput value={auth.currentUser ? auth.currentUser.email : "..."} editable={false} style={styles.input} />
          </View>
        </View>


        <Text style={styles.sectionTitle}>Telefono</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nro de telefono</Text>
            <TextInput value="123456789" editable={false} style={styles.input} />
          </View>
          <TouchableOpacity 
            style={styles.outlineButton}
            onPress={() => showToast('Función de actualización de Nro de telefono próximamente disponible')}
          >
            <Text style={styles.outlineButtonText}>Actualizar numero de telefono</Text>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
}


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
});
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme'; // Opcional, si querés usar tus estilos

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Perfil</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background, // O un color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.foreground, // O un color
  },
});
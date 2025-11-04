import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme'; 

export default function OrdersActiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de ordenes activas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.foreground, 
  },
});
import React, { useState } from 'react'; // 1. Importá useState
import { View, Text, StyleSheet, TextInput, SafeAreaView } from 'react-native'; // 2. Importá TextInput y SafeAreaView
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons'; // Para el ícono de búsqueda (opcional)

export default function SearchScreen() {
  // 3. Creá un estado para guardar lo que el usuario escribe
  const [searchQuery, setSearchQuery] = useState('');

  return (
    // SafeAreaView para evitar el notch/barra de estado
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Buscar productos sin receta</Text>

        {/* 4. Agregá el TextInput */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.mutedForeground}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Escribe el nombre del medicamento..."
            placeholderTextColor={theme.colors.mutedForeground}
            value={searchQuery} // Conecta el valor al estado
            onChangeText={setSearchQuery} // Actualiza el estado al escribir
            autoFocus={true} // Opcional: abre el teclado automáticamente al entrar
            returnKeyType="search" // Cambia el botón "Enter" por "Buscar"
            onSubmitEditing={() => console.log("Buscando:", searchQuery)} // Acción al presionar "Buscar"
          />
        </View>

        {/* Aquí podrías mostrar los resultados de la búsqueda */}
        {/* <Text>Resultados para: {searchQuery}</Text> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    // justifyContent: 'center', // Ya no centramos todo
    //alignItems: 'center', // Ya no centramos todo
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg, // Espacio debajo del título
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm, // Padding interno horizontal
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1, // Para que ocupe el espacio restante
    paddingVertical: theme.spacing.md, // Padding interno vertical
    fontSize: 16,
    color: theme.colors.foreground,
  },
});
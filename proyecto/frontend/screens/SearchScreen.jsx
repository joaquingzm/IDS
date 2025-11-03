import React, { useState } from 'react'; 
import { View, Text, StyleSheet, TextInput, SafeAreaView } from 'react-native'; 
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons'; 

export default function SearchScreen() {
  
  const [searchQuery, setSearchQuery] = useState('');

  return (
    
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Buscar productos sin receta</Text>


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
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            autoFocus={true} 
            returnKeyType="search" 
            onSubmitEditing={() => console.log("Buscando:", searchQuery)} 
          />
        </View>

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
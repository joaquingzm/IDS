import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../styles/theme";

export default function CustomSidebar({ activeTab, setActiveTab }) {
  return (
    <View style={styles.container}>
      

      <TouchableOpacity
        onPress={() => setActiveTab("Inicio")}
        style={[
          styles.button,
          activeTab === "Inicio" && styles.activeButton,
        ]}
      >
        <Text style={styles.buttonText}>🏠 Inicio</Text>
      </TouchableOpacity>

        
      <TouchableOpacity
        onPress={() => setActiveTab("Pedidos Activos")}
        style={[
          styles.button,
          activeTab === "Pedidos Activos" && styles.activeButton,
        ]}
      >
        <Text style={styles.buttonText}>🛒 Pedidos Activos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setActiveTab("Pedidos Pendientes")}
        style={[
          styles.button,
          activeTab === "Pedidos Pendientes" && styles.activeButton,
        ]}
      >
        <Text style={styles.buttonText}>🛒 Pedidos pendientes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setActiveTab("Perfil")}
        style={[
          styles.button,
          activeTab === "Perfil" && styles.activeButton,
        ]}
      >
        <Text style={styles.buttonText}>👤 Perfil</Text>
      </TouchableOpacity>
        
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Pedidos Hoy</Text>
        <Text style={styles.statsValue}>24</Text>
        <Text style={styles.statsPending}>Pendientes: 5</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: theme.colors.sidebar,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.sidebarForeground,
    marginBottom: theme.spacing.xl,
  },
  button: {
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  activeButton: {
    backgroundColor: theme.colors.sidebarAccent,
  },
  buttonText: {
    color: theme.colors.sidebarForeground,
    fontSize: theme.typography.fontSize.lg,
  },
  statsCard: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xxl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  statsValue: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
  },
  statsPending: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.accentForeground,
  },
});
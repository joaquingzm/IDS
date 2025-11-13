import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import { Feather as Icon } from "@expo/vector-icons";

export default function CustomSidebar({ activeTab, setActiveTab }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
               {[
          { key: "Pedidos Disponibles", label: "Pedidos Disponibles" },
          { key: "Ofertas Enviadas", label: "Ofertas Enviadas" },
          { key: "Pedidos en curso", label: "Pedidos en curso" },
          { key: "Historial de Pedidos", label: "Historial de Pedidos" },
          { key: "Perfil", label: "Perfil" },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setActiveTab(item.key)}
            style={[
              styles.cardButton,
              activeTab === item.key && styles.activeCardButton,
            ]}
          >
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}

          <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Icon name="clock" size={26} color={theme.colors.destructiveForeground} />
            <Text style={styles.statsTitle}>Pedidos Disponibles:</Text>
          </View>
          <Text style={styles.statsValue}>5</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Icon name="package" size={26} color={theme.colors.destructiveForeground} />
            <Text style={styles.statsTitle}>Pedidos Activos:</Text>
          </View>
          <Text style={styles.statsValue}>24</Text>
        </View>
      </View>

  
      <View style={styles.blackBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    height: "100%",
  },
  container: {
    flex: 1,
    width: 260,
    backgroundColor: theme.colors.sidebar,
    padding: theme.spacing.lg,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.2)",
  },

  
  cardButton: {
    backgroundColor: theme.colors.sidebarAccent,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignItems: "flex-start", 
  },
  activeCardButton: {
    backgroundColor: theme.colors.primary,
  },
  cardText: {
    color: theme.colors.sidebarForeground,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
  },


  statsCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xxl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.secondaryForeground,
  },
  statsValue: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.destructiveForeground,
    marginTop: 4,
  },

  blackBar: {
    width: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
});

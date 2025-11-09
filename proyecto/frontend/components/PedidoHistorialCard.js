import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_HISTORIAL } from "../dbConfig";

export default function HistorialCard({ pedido }) {
  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{pedido[CAMPOS_HISTORIAL.MONTO]} $</Text>
        <Text style={styles.text}>
          Farmacia: {pedido[CAMPOS_HISTORIAL.NOMBRE_FARMACIA]}
        </Text>
        <Text style={styles.text}>
          Medicamentos: {pedido[CAMPOS_HISTORIAL.MEDICAMENTOS]}
        </Text>
        <Text style={styles.text}>
          Fecha de llegada: {pedido[CAMPOS_HISTORIAL.FECHA_LLEGADA]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    alignSelf: "center",
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  infoContainer: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
});

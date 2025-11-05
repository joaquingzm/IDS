import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../styles/theme";

export default function PedidoCard({ pedido }) {
  return (
    <View style={styles.card}>
      {pedido ? (
        <>
          <Text style={styles.title}>Pedido #{pedido.id}</Text>
          <Text style={styles.text}>Producto: {pedido.producto}</Text>
          <Text style={styles.text}>Cantidad: {pedido.cantidad}</Text>
          <Text style={styles.text}>Estado: {pedido.estado}</Text>
          <Text style={styles.text}>Fecha: {pedido.fecha}</Text>
          <Text style={styles.text}>Horario: {pedido.horario}</Text>
        </>
      ) : (
        <Text style={styles.noPedido}>No se tiene un pedido actual</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  noPedido: {
    fontSize: theme.typography.fontSize.base,
    fontStyle: "italic",
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

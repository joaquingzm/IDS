import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_FARMACIA, CAMPOS_OFERTA, CAMPOS_PEDIDO } from "../dbConfig";

export default function PedidoUsuarioCard({ pedido, oferta, farmacia }) {
  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>
          Estado: {pedido[CAMPOS_PEDIDO.ESTADO] || "Desconocido"}
        </Text>

        <Text style={styles.text}>
          Farmacia: {farmacia[CAMPOS_FARMACIA.NOMBRE]}
        </Text>

        <Text style={styles.text}>
          Medicamentos: {oferta[CAMPOS_OFERTA.MEDICAMENTO]}
        </Text>

        <Text style={styles.text}>
          Fecha de pedido: {oferta[CAMPOS_OFERTA.FECHA_OFERTA]}
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
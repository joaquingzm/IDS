import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_PEDIDO_HISTORIAL } from "../dbConfig"; // asegúrate de importar correctamente

export default function PedidoCard({ pedido }) {
  if (!pedido) {
    return (
      <View style={styles.card}>
        <Text style={styles.noPedido}>No se tiene un pedido actual</Text>
      </View>
    );
  }

  const nombre = pedido[CAMPOS_PEDIDO_HISTORIAL.NOMBRE_USUARIO];
  const apellido = pedido[CAMPOS_PEDIDO_HISTORIAL.APELLIDO_USUARIO];
  const fechaPedido = pedido[CAMPOS_PEDIDO_HISTORIAL.FECHA_PEDIDO]?.toDate?.() || null;
  const direccion = pedido[CAMPOS_PEDIDO_HISTORIAL.DIRECCION];
  const obraSocial = pedido[CAMPOS_PEDIDO_HISTORIAL.OBRASOCIAL];
  const medicamentos = pedido[CAMPOS_PEDIDO_HISTORIAL.MEDICAMENTOS];
  const monto = pedido[CAMPOS_PEDIDO_HISTORIAL.MONTO];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Pedido de {nombre} {apellido}
      </Text>

      {fechaPedido && (
        <Text style={styles.text}>
          📅 Fecha: {fechaPedido.toLocaleDateString()}{" "}
          {fechaPedido.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      )}

      {direccion && <Text style={styles.text}>📍 Dirección: {direccion}</Text>}

      {obraSocial && <Text style={styles.text}>🏥 Obra social: {obraSocial}</Text>}

      {medicamentos && (
        <Text style={styles.text}>💊 Medicamentos: {medicamentos}</Text>
      )}

      {monto && <Text style={styles.text}>💰 Monto: ${monto}</Text>}
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
    textAlign: "center",
  },
});
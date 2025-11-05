import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { theme } from "../styles/theme";

export default function PedidoActivaCard({ pedidoData }) {
  const [pedido, setPedido] = useState(pedidoData);
  const [expandido, setExpandido] = useState(false);

  const avanzarEstado = () => {
    const siguienteEstado = {
      Pendiente: "En camino",
      "En camino": "Entregado",
      Entregado: "Finalizado",
    }[pedido.estado];

    if (siguienteEstado) {
      setPedido((prev) => ({ ...prev, estado: siguienteEstado }));
    }
  };

  const cancelarPedido = () => {
    setPedido((prev) => ({ ...prev, estado: "Cancelado" }));
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        pedido.estado === "Finalizado" && styles.cardFinalizado,
        pedido.estado === "Cancelado" && styles.cardCancelado,
      ]}
      onPress={() => setExpandido(!expandido)}
      activeOpacity={0.8}
    >
      {/* Imagen del producto */}
      {pedido.imagen && <Image source={{ uri: pedido.imagen }} style={styles.imagen} />}

      <View style={styles.infoContainer}>
        <Text style={styles.title}>#{pedido.id} - {pedido.producto}</Text>
        <Text style={styles.text}>Cliente: {pedido.cliente}</Text>
        <Text style={styles.text}>Cantidad: {pedido.cantidad}</Text>
        <Text style={styles.text}>Dirección: {pedido.direccion}</Text>

        <Text
          style={[
            styles.estado,
            pedido.estado === "Pendiente" && { color: theme.colors.primary },
            pedido.estado === "En camino" && { color: theme.colors.secondaryForeground },
            pedido.estado === "Entregado" && { color: theme.colors.success },
            pedido.estado === "Cancelado" && { color: theme.colors.destructive },
          ]}
        >
          Estado: {pedido.estado}
        </Text>

        {/* Si está expandido, mostramos los botones */}
        {expandido && pedido.estado !== "Finalizado" && pedido.estado !== "Cancelado" && (
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonPrimario]}
              onPress={avanzarEstado}
            >
              <Text style={styles.botonTexto}>Avanzar estado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonSecundario]}
              onPress={cancelarPedido}
            >
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {pedido.estado === "Finalizado" && (
          <Text style={styles.finalizado}> Pedido completado</Text>
        )}

        {pedido.estado === "Cancelado" && (
          <Text style={styles.cancelado}> Pedido cancelado</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardFinalizado: {
    opacity: 0.8,
  },
  cardCancelado: {
    opacity: 0.6,
  },
  imagen: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  estado: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  botonesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
  },
  boton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  botonPrimario: {
    backgroundColor: theme.colors.primary,
  },
  botonSecundario: {
    backgroundColor: theme.colors.destructive,
  },
  botonTexto: {
    color: "#fff",
    fontWeight: theme.typography.fontWeight.medium,
  },
  finalizado: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.bold,
  },
  cancelado: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.destructive,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

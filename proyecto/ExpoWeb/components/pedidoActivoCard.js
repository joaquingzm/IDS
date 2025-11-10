import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { theme } from "../styles/theme";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { COLECCION_PEDIDO, CAMPOS_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";

export default function PedidoActivaCard({ pedidoData, onPedidoEliminado }) {
  const [pedido, setPedido] = useState(pedidoData);
  const [expandido, setExpandido] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const moverAHistorial = async () => {
    if (procesando) return;
    setProcesando(true);

    try {
      const pedidoRef = doc(db, COLECCION_PEDIDO, pedido.id);

      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.REALIZADO,
      });

      setPedido((prev) => ({ ...prev, estado: "Finalizado" }));
      console.log(" Pedido marcado como realizado en Firestore");

      if (onPedidoEliminado) onPedidoEliminado(pedido.id);

      Alert.alert("Pedido completado", "El pedido fue finalizado correctamente.");
    } catch (error) {
      console.error(" Error al actualizar pedido:", error);
      Alert.alert("Error", "No se pudo marcar el pedido como finalizado.");
    } finally {
      setProcesando(false);
    }
  };

 
  const cancelarPedido = async () => {
    if (procesando) return;
    setProcesando(true);

    try {
      const pedidoRef = doc(db, COLECCION_PEDIDO, pedido.id);

      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
      });

      setPedido((prev) => ({ ...prev, estado: "Rechazado" }));

      if (onPedidoEliminado) onPedidoEliminado(pedido.id);

      Alert.alert("Pedido rechazado", "El pedido fue marcado como rechazado correctamente.");
    } catch (error) {
      console.error("Error al rechazar pedido:", error);
      Alert.alert("Error", "No se pudo rechazar el pedido.");
    } finally {
      setProcesando(false);
    }
  };

  const avanzarEstado = () => {
    const siguienteEstado = {
      Pendiente: "En camino",
      "En camino": "Entregado",
      Entregado: "Finalizado",
    }[pedido.estado || "Pendiente"];

    if (siguienteEstado) {
      if (siguienteEstado === "Finalizado") {
        moverAHistorial();
      } else {
        setPedido((prev) => ({ ...prev, estado: siguienteEstado }));
      }
    }
  };

  const producto = pedido.Medicamentos || "Medicamentos no especificados";
  const cliente = `${pedido.nombreUsuario || ""} ${pedido.apellidoUsuario || ""}`.trim() || "Cliente no especificado";
  const direccion = pedido.direccionUsuario || "Dirección no especificada";
  const monto = pedido.Monto ? `$${pedido.Monto}` : "Monto no especificado";
  const obraSocial = pedido.obraSocialUsuario || "Obra social no especificada";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        pedido.estado === "Finalizado" && styles.cardFinalizado,
        pedido.estado === "Rechazado" && styles.cardCancelado,
        procesando && styles.cardProcesando,
      ]}
      onPress={() => setExpandido(!expandido)}
      activeOpacity={0.8}
      disabled={procesando}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Pedido #{pedido.id?.substring(0, 8) || "N/A"}</Text>

        <View style={styles.detallesContainer}>
          <Text style={styles.text}><Text style={styles.label}>Cliente:</Text> {cliente}</Text>
          <Text style={styles.text}><Text style={styles.label}>Dirección:</Text> {direccion}</Text>
          <Text style={styles.text}><Text style={styles.label}>Obra social:</Text> {obraSocial}</Text>
          <Text style={styles.text}><Text style={styles.label}>Monto:</Text> {monto}</Text>
          <Text style={styles.text}><Text style={styles.label}>Medicamentos:</Text> {producto}</Text>

          {pedido.fechaPedido && (
            <Text style={styles.text}>
              <Text style={styles.label}>Fecha:</Text>{" "}
              {pedido.fechaPedido.toDate?.().toLocaleDateString() || "Fecha no disponible"}
            </Text>
          )}
        </View>

        <Text
          style={[
            styles.estado,
            (pedido.estado === "Pendiente" || !pedido.estado) && { color: theme.colors.primary },
            pedido.estado === "En camino" && { color: theme.colors.secondaryForeground },
            pedido.estado === "Entregado" && { color: theme.colors.success },
            pedido.estado === "Rechazado" && { color: theme.colors.destructive },
            procesando && { color: theme.colors.mutedForeground },
          ]}
        >
          Estado: {procesando ? "Procesando..." : pedido.estado || "Pendiente"}
        </Text>

        {expandido && pedido.estado !== "Finalizado" && pedido.estado !== "Rechazado" && !procesando && (
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonPrimario]}
              onPress={avanzarEstado}
              disabled={procesando}
            >
              <Text style={styles.botonTexto}>
                {pedido.estado === "Entregado" ? "Finalizar pedido" : "Avanzar estado"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonSecundario]}
              onPress={cancelarPedido}
              disabled={procesando}
            >
              <Text style={styles.botonTexto}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        )}

        {procesando && <Text style={styles.procesando}>Actualizando pedido...</Text>}

        {pedido.estado === "Finalizado" && !procesando && (
          <Text style={styles.finalizado}>Pedido completado</Text>
        )}

        {pedido.estado === "Rechazado" && !procesando && (
          <Text style={styles.cancelado}>Pedido rechazado</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    backgroundColor: theme.colors.success + "20",
  },
  cardCancelado: {
    opacity: 0.6,
    backgroundColor: theme.colors.destructive + "20",
  },
  cardProcesando: {
    opacity: 0.7,
    backgroundColor: theme.colors.muted + "20",
  },
  infoContainer: { flex: 1 },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  detallesContainer: { marginBottom: 8 },
  text: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  label: {
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.foreground,
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
  botonPrimario: { backgroundColor: theme.colors.primary },
  botonSecundario: { backgroundColor: theme.colors.destructive },
  botonTexto: {
    color: "#fff",
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.sm,
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
  procesando: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.mutedForeground,
    fontStyle: "italic",
    textAlign: "center",
  },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { theme } from "../styles/theme";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { COLECCION_PEDIDO_HISTORIAL, CAMPOS_PEDIDO_HISTORIAL } from "../dbConfig";

export default function PedidoActivaCard({ pedidoData, onPedidoEliminado }) {
  const [pedido, setPedido] = useState(pedidoData);
  const [expandido, setExpandido] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const moverAHistorial = async () => {
    if (procesando) return;
    
    setProcesando(true);
    try {
      // Crear documento en PedidosHistorial
      const pedidoHistorial = {
        [CAMPOS_PEDIDO_HISTORIAL.NOMBRE_USUARIO]: pedido.nombreUsuario || "",
        [CAMPOS_PEDIDO_HISTORIAL.APELLIDO_USUARIO]: pedido.apellidoUsuario || "",
        [CAMPOS_PEDIDO_HISTORIAL.DIRECCION]: pedido.direccionUsuario || "",
        [CAMPOS_PEDIDO_HISTORIAL.USER_ID]: pedido.userId || "",
        [CAMPOS_PEDIDO_HISTORIAL.OBRASOCIAL]: pedido.obraSocialUsuario || "",
        [CAMPOS_PEDIDO_HISTORIAL.FECHA_PEDIDO]: pedido.fechaPedido || new Date(),
        [CAMPOS_PEDIDO_HISTORIAL.MEDICAMENTOS]: pedido.Medicamentos || "",
        [CAMPOS_PEDIDO_HISTORIAL.MONTO]: pedido.Monto || "",
        fechaFinalizacion: new Date(),
        estado: "Finalizado"
      };

      await setDoc(doc(db, COLECCION_PEDIDO_HISTORIAL, pedido.id), pedidoHistorial);
      
      // CORREGIDO: Borrar de "PedidosAceptados" en lugar de "PedidosActivos"
      await deleteDoc(doc(db, "PedidosAceptados", pedido.id));
      
      console.log("✅ Pedido movido a historial correctamente");
      
      // Notificar al padre que este pedido fue eliminado
      if (onPedidoEliminado) {
        onPedidoEliminado(pedido.id);
      }
      
    } catch (error) {
      console.error("❌ Error al mover pedido a historial:", error);
      Alert.alert("Error", "No se pudo completar el pedido");
    } finally {
      setProcesando(false);
    }
  };

  const avanzarEstado = () => {
    const siguienteEstado = {
      "Pendiente": "En camino",
      "En camino": "Entregado", 
      "Entregado": "Finalizado",
    }[pedido.estado || "Pendiente"];

    if (siguienteEstado) {
      // Si el siguiente estado es "Finalizado", mover a historial
      if (siguienteEstado === "Finalizado") {
        moverAHistorial();
      } else {
        // Solo actualizar el estado local
        setPedido((prev) => ({ ...prev, estado: siguienteEstado }));
      }
    }
  };

  const cancelarPedido = () => {
    setPedido((prev) => ({ ...prev, estado: "Cancelado" }));
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
        pedido.estado === "Cancelado" && styles.cardCancelado,
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
              <Text style={styles.label}>Fecha:</Text> {pedido.fechaPedido.toDate?.().toLocaleDateString() || "Fecha no disponible"}
            </Text>
          )}
        </View>

        <Text
          style={[
            styles.estado,
            (pedido.estado === "Pendiente" || !pedido.estado) && { color: theme.colors.primary },
            pedido.estado === "En camino" && { color: theme.colors.secondaryForeground },
            pedido.estado === "Entregado" && { color: theme.colors.success },
            pedido.estado === "Cancelado" && { color: theme.colors.destructive },
            procesando && { color: theme.colors.mutedForeground },
          ]}
        >
          Estado: {procesando ? "Procesando..." : (pedido.estado || "Pendiente")}
        </Text>

        {expandido && pedido.estado !== "Finalizado" && pedido.estado !== "Cancelado" && !procesando && (
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
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {procesando && (
          <Text style={styles.procesando}>Moviendo a historial...</Text>
        )}

        {pedido.estado === "Finalizado" && !procesando && (
          <Text style={styles.finalizado}> Pedido completado</Text>
        )}

        {pedido.estado === "Cancelado" && !procesando && (
          <Text style={styles.cancelado}> Pedido cancelado</Text>
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
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  detallesContainer: {
    marginBottom: 8,
  },
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
  botonPrimario: {
    backgroundColor: theme.colors.primary,
  },
  botonSecundario: {
    backgroundColor: theme.colors.destructive,
  },
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
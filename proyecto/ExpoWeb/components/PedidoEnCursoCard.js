import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { theme } from "../styles/theme";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { COLECCION_PEDIDO, CAMPOS_PEDIDO, ESTADOS_PEDIDO, CAMPOS_OFERTA } from "../dbConfig";

export default function pedidoEnCursoCard({ pedidoData, oferta, onPedidoEliminado }) {
  const [pedido, setPedido] = useState(pedidoData);
  const [expandido, setExpandido] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const safeClone = (obj) => {
    try {
      return obj ? JSON.parse(JSON.stringify(obj)) : {};
    } catch {
      return { ...(obj || {}) };
    }
  };

  // Avanza estados locales/servidor:
  // - Pendiente -> En camino -> Entregado -> (DB: CONFIRMACION) -> espera usuario
  // No existe más "Finalizado" desde la farmacia; la confirmación final la hace el usuario (REALIZADO)
  const avanzarEstado = async () => {
    if (procesando) return;
    const estadoActual = pedido?.estado || pedidoData?.estado || "Pendiente";

    // si ya está en confirmacion o realizado o rechazado, no avanzar
    if (
      estadoActual === ESTADOS_PEDIDO.CONFIRMACION ||
      estadoActual === ESTADOS_PEDIDO.REALIZADO ||
      estadoActual === ESTADOS_PEDIDO.RECHAZADO
    ) {
      return;
    }

    // Determinamos siguiente estado lógico (solo para UI local)
    const orden = ["Pendiente", "En camino", "Entregado"];
    const idx = orden.indexOf(estadoActual);
    const siguienteString = orden[idx + 1] || orden[orden.length - 1];

    // Si siguiente es "Entregado" -> debemos marcar en DB CONFIRMACION y dejar esperando al usuario
    const confirmar =
      Platform.OS === "web"
        ? window.confirm(`¿Marcar pedido como "${siguienteString}" y esperar confirmación del cliente?`)
        : await new Promise((resolve) =>
            Alert.alert(
              "Confirmar",
              `¿Marcar pedido como "${siguienteString}" y esperar confirmación del cliente?`,
              [
                { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                { text: "Aceptar", onPress: () => resolve(true) },
              ],
              { cancelable: true }
            )
          );

    if (!confirmar) return;

    setProcesando(true);

    try {
      // para "Entregado" actualizamos DB a ESTADOS_PEDIDO.CONFIRMACION
      if (siguienteString === "Entregado") {
        const base = pedido ?? pedidoData ?? {};
        const pedidoRef = doc(db, COLECCION_PEDIDO, base.id);
        await updateDoc(pedidoRef, {
          [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.CONFIRMACION,
        });

        const newPedido = { ...safeClone(base), estado: ESTADOS_PEDIDO.CONFIRMACION };
        setPedido(newPedido);
        // no llamamos a onPedidoEliminado: se queda en lista esperando confirmación del usuario
        if (Platform.OS === "web") window.alert("Pedido marcado como entregado. Esperando confirmación del cliente.");
        else Alert.alert("Ok", "Pedido marcado como entregado. Esperando confirmación del cliente.");
        return;
      }

      // si siguiente es "En camino" (o otros) sólo actualizamos UI local (como en tu flujo previo)
      const newLocal = { ...(pedido ?? pedidoData ?? {}), estado: siguienteString };
      setPedido(newLocal);
    } catch (error) {
      console.error("Error avanzando estado:", error);
      Alert.alert("Error", "No se pudo avanzar el estado del pedido.");
    } finally {
      setProcesando(false);
    }
  };

  const cancelarPedido = async () => {
    if (procesando) return;

    const confirmar =
      Platform.OS === "web"
        ? window.confirm("¿Rechazar este pedido?")
        : await new Promise((resolve) =>
            Alert.alert(
              "Confirmar rechazo",
              "¿Estás seguro de rechazar este pedido?",
              [
                { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                { text: "Rechazar", style: "destructive", onPress: () => resolve(true) },
              ],
              { cancelable: true }
            )
          );

    if (!confirmar) return;

    setProcesando(true);
    try {
      const base = pedido ?? pedidoData ?? {};
      const newPedido = { ...safeClone(base), estado: "Rechazado" };

      const pedidoRef = doc(db, COLECCION_PEDIDO, newPedido.id);
      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
      });

      setPedido(newPedido);

      if (onPedidoEliminado) onPedidoEliminado(newPedido.id);

      if (Platform.OS === "web") window.alert("Pedido rechazado correctamente");
      else Alert.alert("Pedido rechazado", "Se marcó como rechazado correctamente");
    } catch (error) {
      console.error("Error al rechazar pedido:", error);
      Alert.alert("Error", "No se pudo rechazar el pedido.");
    } finally {
      setProcesando(false);
    }
  };

  const producto = oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "Medicamentos no especificados";
  const cliente =
    `${pedido?.[CAMPOS_PEDIDO.NOMBRE_USUARIO] || ""} ${pedido?.[CAMPOS_PEDIDO.APELLIDO_USUARIO] || ""}`.trim() ||
    "Cliente no especificado";
  const direccion = pedido?.[CAMPOS_PEDIDO.DIRECCION] || "Dirección no especificada";
  const monto = oferta?.[CAMPOS_OFERTA.MONTO] ? `$${oferta[CAMPOS_OFERTA.MONTO]}` : "Monto no especificado";
  const obraSocial = pedido?.[CAMPOS_PEDIDO.OBRASOCIAL] || "Obra social no especificada";

  const formatFecha = (f) => {
    try {
      if (!f) return "Fecha no disponible";
      if (typeof f?.toDate === "function") return f.toDate().toLocaleString();
      const d = new Date(f);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return "Fecha no disponible";
    } catch {
      return "Fecha no disponible";
    }
  };

  // Mostrar texto amigable según estado real (usando constantes DB cuando corresponde)
  const estadoReal = pedido?.estado ?? pedidoData?.estado ?? "Pendiente";
  const estadoLabel =
    estadoReal === ESTADOS_PEDIDO.CONFIRMACION
      ? "Entregado, esperando confirmacion del cliente"
      : estadoReal === ESTADOS_PEDIDO.REALIZADO
      ? "Entrega confirmada"
      : estadoReal === ESTADOS_PEDIDO.RECHAZADO
      ? "Rechazado"
      : estadoReal; // para otros (Pendiente, En camino, etc.) mostramos tal cual

  return (
    <TouchableOpacity
      style={[
        styles.card,
        (estadoReal === ESTADOS_PEDIDO.REALIZADO) && styles.cardFinalizado,
        (estadoReal === ESTADOS_PEDIDO.RECHAZADO) && styles.cardCancelado,
        procesando && styles.cardProcesando,
      ]}
      onPress={() => setExpandido(!expandido)}
      activeOpacity={0.8}
      disabled={procesando}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.title}>
          Pedido #{(pedido?.id ?? pedidoData?.id ?? "N/A").substring?.(0, 8) || "N/A"}
        </Text>

        <View style={styles.detallesContainer}>
          <Text style={styles.text}>
            <Text style={styles.label}>Cliente: </Text>
            {cliente}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Dirección: </Text>
            {direccion}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Obra social: </Text>
            {obraSocial}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Monto: </Text>
            {monto}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.label}>Medicamentos: </Text>
            {producto}
          </Text>

          {pedido?.fechaPedido && (
            <Text style={styles.text}>
              <Text style={styles.label}>Fecha: </Text>
              {formatFecha(pedido.fechaPedido)}
            </Text>
          )}
        </View>

        <Text
          style={[
            styles.estado,
            estadoReal === "Pendiente" && { color: theme.colors.primary },
            estadoReal === "En camino" && { color: theme.colors.secondaryForeground },
            estadoReal === ESTADOS_PEDIDO.CONFIRMACION && { color: theme.colors.secondaryForeground },
            estadoReal === ESTADOS_PEDIDO.REALIZADO && { color: theme.colors.success },
            estadoReal === ESTADOS_PEDIDO.RECHAZADO && { color: theme.colors.destructive },
          ]}
        >
          Estado: {estadoLabel}
        </Text>

        {/* botones: solo cuando no esté en confirmación/realizado/rechazado */}
        {expandido &&
          estadoReal !== ESTADOS_PEDIDO.CONFIRMACION &&
          estadoReal !== ESTADOS_PEDIDO.REALIZADO &&
          estadoReal !== ESTADOS_PEDIDO.RECHAZADO && (
            <View style={styles.botonesContainer}>
              <TouchableOpacity
                style={[styles.boton, styles.botonPrimario]}
                onPress={avanzarEstado}
                disabled={procesando}
              >
                <Text style={styles.botonTexto}>
                  {estadoReal === "Entregado" ? "Marcar entregado" : "Avanzar estado"}
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
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardFinalizado: { opacity: 0.8, backgroundColor: theme.colors.success + "20" },
  cardCancelado: { opacity: 0.6, backgroundColor: theme.colors.destructive + "20" },
  cardProcesando: { opacity: 0.7, backgroundColor: theme.colors.muted + "20" },
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
});

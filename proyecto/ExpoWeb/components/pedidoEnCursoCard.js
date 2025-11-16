import React, { useState, useEffect } from "react";
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
import {
  COLECCION_PEDIDO,
  CAMPOS_PEDIDO,
  ESTADOS_PEDIDO,
  CAMPOS_OFERTA,
} from "../dbConfig";

export default function PedidoEnCursoCard({ pedidoData, oferta, onPedidoEliminado }) {
  // Si pedidoData trae estado lo usamos; si no, mostramos EN_PREPARACION localmente.
  const initialEstado =
    pedidoData?.estado && String(pedidoData.estado).length > 0
      ? pedidoData.estado
      : ESTADOS_PEDIDO.EN_PREPARACION;

  const [pedido, setPedido] = useState(pedidoData ? { ...pedidoData, estado: initialEstado } : { estado: initialEstado });
  const [expandido, setExpandido] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    // Mantener sincronizado con cambios externos en pedidoData (si vienen)
    if (pedidoData && pedidoData.id !== pedido?.id) {
      setPedido({ ...pedidoData, estado: pedidoData.estado ?? ESTADOS_PEDIDO.EN_PREPARACION });
    } else if (pedidoData) {
      // si el parent actualiza el pedidoData (p.e. por snapshot), actualizamos estado local
      setPedido((prev) => ({ ...(prev || {}), ...(pedidoData || {}) }));
    }
  }, [pedidoData]);

  const safeClone = (obj) => {
    try {
      return obj ? JSON.parse(JSON.stringify(obj)) : {};
    } catch {
      return { ...(obj || {}) };
    }
  };

  // Avanzar estado:
  const avanzarEstado = async () => {
  if (procesando) return;

  const estadoActual = pedido?.estado ?? ESTADOS_PEDIDO.PENDIENTE;

  if (
    estadoActual === ESTADOS_PEDIDO.CONFIRMACION ||
    estadoActual === ESTADOS_PEDIDO.REALIZADO ||
    estadoActual === ESTADOS_PEDIDO.RECHAZADO
  ) {
    return;
  }

  let siguienteEstado;
  if (estadoActual === ESTADOS_PEDIDO.EN_PREPARACION) {
    siguienteEstado = ESTADOS_PEDIDO.EN_CAMINO;
  } else if (estadoActual === ESTADOS_PEDIDO.EN_CAMINO) {
    siguienteEstado = ESTADOS_PEDIDO.CONFIRMACION;
  } else {
    siguienteEstado = ESTADOS_PEDIDO.EN_PREPARACION;
  }

  const labelMap = {
    [ESTADOS_PEDIDO.EN_PREPARACION]: "En preparación",
    [ESTADOS_PEDIDO.EN_CAMINO]: "En camino",
    [ESTADOS_PEDIDO.CONFIRMACION]: "Entregado (esperando confirmación)",
  };
  const nextLabel = labelMap[siguienteEstado] ?? String(siguienteEstado);

  const confirmar =
    Platform.OS === "web"
      ? window.confirm(`¿Marcar pedido como "${nextLabel}"?`)
      : await new Promise((resolve) =>
          Alert.alert(
            "Confirmar",
            `¿Marcar pedido como "${nextLabel}"?`,
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
    const base = pedido ?? pedidoData ?? {};
    const pedidoRef = doc(db, COLECCION_PEDIDO, base.id);

    // -------------------------------
    // 🔥 CAMPOS EXTRAS SEGÚN ESTADO
    // -------------------------------
    let camposExtra = {};

    if (siguienteEstado === ESTADOS_PEDIDO.EN_CAMINO) {
      camposExtra[CAMPOS_PEDIDO.FECHA_EN_CAMINO] = new Date();
    }

    if (siguienteEstado === ESTADOS_PEDIDO.CONFIRMACION) {
      camposExtra[CAMPOS_PEDIDO.FECHA_ENTREGADO] = new Date();
    }

    // Actualizamos Firestore con estado + fechas si corresponde
    await updateDoc(pedidoRef, {
      [CAMPOS_PEDIDO.ESTADO]: siguienteEstado,
      ...camposExtra,
    });

    const newLocal = {
      ...(base || {}),
      estado: siguienteEstado,
      ...camposExtra,
    };

    setPedido(newLocal);

    if (Platform.OS === "web") {
      window.alert(`Pedido marcado como "${nextLabel}".`);
    } else {
      Alert.alert("Ok", `Pedido marcado como "${nextLabel}".`);
    }
  } catch (error) {
    console.error("Error avanzando estado:", error);
    if (Platform.OS === "web") window.alert("No se pudo avanzar el estado del pedido.");
    else Alert.alert("Error", "No se pudo avanzar el estado del pedido.");
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
      const pedidoRef = doc(db, COLECCION_PEDIDO, base.id);

      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
      });

      const newPedido = { ...safeClone(base), estado: ESTADOS_PEDIDO.RECHAZADO };
      setPedido(newPedido);

      if (typeof onPedidoEliminado === "function") {
        onPedidoEliminado(newPedido.id);
      }

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
  const monto = oferta?.[CAMPOS_OFERTA.MONTO] ? `${formatCurrencyLocal(oferta[CAMPOS_OFERTA.MONTO])}` : "Monto no especificado";
  const obraSocial = pedido?.[CAMPOS_PEDIDO.OBRASOCIAL] || "Obra social no especificada";

  function formatCurrencyLocal(n) {
    try {
      const num = Number(n) || 0;
      return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(num);
    } catch {
      return `$${n}`;
    }
  }

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

  // Estado real actual
  const estadoReal = pedido?.estado ?? pedidoData?.estado ?? ESTADOS_PEDIDO.EN_PREPARACION;
  const estadoLabel =
    estadoReal === ESTADOS_PEDIDO.CONFIRMACION
      ? "Entregado, esperando confirmación del cliente"
      : estadoReal === ESTADOS_PEDIDO.REALIZADO
      ? "Entrega confirmada"
      : estadoReal === ESTADOS_PEDIDO.RECHAZADO
      ? "Rechazado"
      : estadoReal === ESTADOS_PEDIDO.EN_PREPARACION
      ? "En preparación"
      : estadoReal === ESTADOS_PEDIDO.EN_CAMINO
      ? "En camino"
      : estadoReal === ESTADOS_PEDIDO.PENDIENTE
      ? "Pendiente"
      : String(estadoReal);

  // Cuando estamos en CONFIRMACION / REALIZADO / RECHAZADO: no mostramos botones
  const botonesVisibles =
    expandido &&
    estadoReal !== ESTADOS_PEDIDO.CONFIRMACION &&
    estadoReal !== ESTADOS_PEDIDO.REALIZADO &&
    estadoReal !== ESTADOS_PEDIDO.RECHAZADO;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        estadoReal === ESTADOS_PEDIDO.REALIZADO && styles.cardFinalizado,
        estadoReal === ESTADOS_PEDIDO.RECHAZADO && styles.cardCancelado,
        procesando && styles.cardProcesando,
      ]}
      onPress={() => setExpandido((s) => !s)}
      activeOpacity={0.8}
      disabled={procesando}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.title}>
          Pedido #{String(pedido?.id ?? pedidoData?.id ?? "N/A").substring(0, 8) || "N/A"}
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
            estadoReal === ESTADOS_PEDIDO.PENDIENTE && { color: theme.colors.primary },
            estadoReal === ESTADOS_PEDIDO.EN_CAMINO && { color: theme.colors.secondaryForeground },
            estadoReal === ESTADOS_PEDIDO.CONFIRMACION && { color: theme.colors.secondaryForeground },
            estadoReal === ESTADOS_PEDIDO.REALIZADO && { color: theme.colors.success },
            estadoReal === ESTADOS_PEDIDO.RECHAZADO && { color: theme.colors.destructive },
          ]}
        >
          Estado: {estadoLabel}
        </Text>

        {botonesVisibles && (
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonPrimario, procesando && { opacity: 0.7 }]}
              onPress={avanzarEstado}
              disabled={procesando}
            >
              <Text style={styles.botonTexto}>
                {estadoReal === ESTADOS_PEDIDO.EN_CAMINO ? "Marcar entregado" : "Avanzar estado"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonSecundario, procesando && { opacity: 0.7 }]}
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

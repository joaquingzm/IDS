import React, { useState, useEffect } from "react";
import { confirm } from "../utils/ConfirmService";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { useAlert } from "../context/AlertContext";

export default function PedidoEnCursoCard({ pedidoData, oferta, onPedidoEliminado }) {
  const { showAlert } = useAlert();
  const initialEstado =
    pedidoData?.estado && String(pedidoData.estado).length > 0
      ? pedidoData.estado
      : ESTADOS_PEDIDO.EN_PREPARACION;

  const [pedido, setPedido] = useState(
    pedidoData ? { ...pedidoData, estado: initialEstado } : { estado: initialEstado }
  );
  const [expandido, setExpandido] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (pedidoData && pedidoData.id !== pedido?.id) {
      setPedido({
        ...pedidoData,
        estado: pedidoData.estado ?? ESTADOS_PEDIDO.EN_PREPARACION,
      });
    } else if (pedidoData) {
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

    const confirmar = await confirm("confirm_change_state", {
      message: `Se cambiará el estado a "${nextLabel}".`,
    });

    if (!confirmar) return;

    setProcesando(true);

    try {
      const base = pedido ?? pedidoData ?? {};
      const pedidoRef = doc(db, COLECCION_PEDIDO, base.id);

      let camposExtra = {};

      if (siguienteEstado === ESTADOS_PEDIDO.EN_CAMINO) {
        camposExtra[CAMPOS_PEDIDO.FECHA_EN_CAMINO] = new Date();
      }

      if (siguienteEstado === ESTADOS_PEDIDO.CONFIRMACION) {
        camposExtra[CAMPOS_PEDIDO.FECHA_ENTREGADO] = new Date();
      }

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

      showAlert("cambio_success", { message: `Pedido marcado como "${nextLabel}".` });
    } catch (error) {
      showAlert("error", { message: "No se pudo avanzar el estado." });
    } finally {
      setProcesando(false);
    }
  };

  const cancelarPedido = async () => {
    if (procesando) return;

    const confirmar = await confirm("rechazar_pedido", {
      message: "¿Estás seguro de rechazar este pedido?",
    });
    if (!confirmar) return;

    setProcesando(true);

    try {
      const base = pedido ?? pedidoData ?? {};
      const pedidoRef = doc(db, COLECCION_PEDIDO, base.id);

      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
        [CAMPOS_PEDIDO.FECHA_CANCELACION]: new Date(),
        [CAMPOS_PEDIDO.CANCELADO_POR]: "farmacia",
      });

      const newPedido = {
        ...safeClone(base),
        estado: ESTADOS_PEDIDO.RECHAZADO,
        [CAMPOS_PEDIDO.FECHA_CANCELACION]: new Date(),
        [CAMPOS_PEDIDO.CANCELADO_POR]: "farmacia",
      };

      setPedido(newPedido);

      if (typeof onPedidoEliminado === "function") {
        onPedidoEliminado(newPedido.id);
      }

      showAlert("pedido_rechazado_success");
    } catch (error) {
      showAlert("error", { message: "No se pudo rechazar el pedido." });
    } finally {
      setProcesando(false);
    }
  };

  // --- FORMATEADORES Y LISTAS ---
  const parseMonto = (value) => {
    if (value == null || value === "") return 0;
    if (typeof value === "number") return value;
    const s = String(value).trim();
    if (s === "") return 0;

    if (s.includes(",") && s.includes(".")) {
      return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
    }
    if (s.includes(",") && !s.includes(".")) {
      return Number(s.replace(",", ".")) || 0;
    }
    if (s.includes(" ")) {
      return Number(s.replace(/\s/g, "")) || 0;
    }
    return Number(s) || 0;
  };

  const formatCurrency = (value) => {
    const n = Number(value) || 0;
    try {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      return `$${n.toFixed(2)}`;
    }
  };

  const medicamentosList = Array.isArray(oferta?.[CAMPOS_OFERTA.MEDICAMENTO])
    ? oferta[CAMPOS_OFERTA.MEDICAMENTO]
    : oferta?.[CAMPOS_OFERTA.MEDICAMENTO]
    ? [oferta[CAMPOS_OFERTA.MEDICAMENTO]]
    : [];

  const montosList = Array.isArray(oferta?.[CAMPOS_OFERTA.MONTO])
    ? oferta[CAMPOS_OFERTA.MONTO]
    : oferta?.[CAMPOS_OFERTA.MONTO]
    ? [oferta[CAMPOS_OFERTA.MONTO]]
    : [];

  const rows = medicamentosList.map((med, idx) => ({
    medicamento: med,
    montoNum: parseMonto(montosList[idx] ?? 0),
  }));

  const total = rows.reduce((acc, r) => acc + r.montoNum, 0);

  const producto =
    oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "Medicamentos no especificados";
  const cliente =
    `${pedido?.[CAMPOS_PEDIDO.NOMBRE_USUARIO] || ""} ${
      pedido?.[CAMPOS_PEDIDO.APELLIDO_USUARIO] || ""
    }`.trim() || "Cliente no especificado";
  const direccion =
    pedido?.[CAMPOS_PEDIDO.DIRECCION] || "Dirección no especificada";
  const obraSocial =
    pedido?.[CAMPOS_PEDIDO.OBRASOCIAL] || "Obra social no especificada";
  const NumAfiliado =
    pedido?.[CAMPOS_PEDIDO.OBRASOCIAL_NUM] || "Numero de afiliado no especificado";

  function formatFecha(f) {
    try {
      if (!f) return "Fecha no disponible";
      if (typeof f?.toDate === "function") return f.toDate().toLocaleString();
      const d = new Date(f);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return "Fecha no disponible";
    } catch {
      return "Fecha no disponible";
    }
  }

  const estadoReal =
    pedido?.estado ??
    pedidoData?.estado ??
    ESTADOS_PEDIDO.EN_PREPARACION;

  const estadoLabel =
    estadoReal === ESTADOS_PEDIDO.CONFIRMACION
      ? "Entregado, esperando confirmación"
      : estadoReal === ESTADOS_PEDIDO.REALIZADO
      ? "Entrega confirmada"
      : estadoReal === ESTADOS_PEDIDO.RECHAZADO
      ? "Rechazado"
      : estadoReal === ESTADOS_PEDIDO.EN_PREPARACION
      ? "En preparación"
      : estadoReal === ESTADOS_PEDIDO.EN_CAMINO
      ? "En camino"
      : "Pendiente";

  // --- LÓGICA DE BOTONES ---
  const botonesVisibles =
    expandido &&
    estadoReal !== ESTADOS_PEDIDO.CONFIRMACION &&
    estadoReal !== ESTADOS_PEDIDO.REALIZADO &&
    estadoReal !== ESTADOS_PEDIDO.RECHAZADO;

  const rechazarVisible = estadoReal === ESTADOS_PEDIDO.EN_PREPARACION;

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
          Pedido #
          {String(pedido?.id ?? pedidoData?.id ?? "N/A").substring(0, 8)}
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
            <Text style={styles.label}>Número de afiliado: </Text>
            {NumAfiliado}
          </Text>
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <Text style={[styles.label, { fontSize: 16 }]}>
              Medicamentos ofrecidos:
            </Text>

            {rows.map((r, idx) => (
              <View key={idx} style={styles.row}>
                <Text style={styles.medicamentoName}>{r.medicamento}</Text>
                <Text style={styles.monto}>{formatCurrency(r.montoNum)}</Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

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
              style={[
                styles.boton,
                styles.botonPrimario,
                procesando && { opacity: 0.7 },
              ]}
              onPress={avanzarEstado}
              disabled={procesando}
            >
              <Text style={styles.botonTexto}>
                {estadoReal === ESTADOS_PEDIDO.EN_CAMINO
                  ? "Marcar entregado"
                  : "Avanzar estado"}
              </Text>
            </TouchableOpacity>

            {rechazarVisible && (
              <TouchableOpacity
                style={[
                  styles.boton,
                  styles.botonSecundario,
                  (procesando || !rechazarVisible) && { opacity: 0.5 },
                ]}
                onPress={cancelarPedido}
                disabled={procesando || !rechazarVisible}
              >
                <Text style={styles.botonTexto}>Rechazar</Text>
              </TouchableOpacity>
            )}
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

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#e1e1e1",
  },

  medicamentoName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginRight: 10,
  },

  monto: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 80,
    textAlign: "right",
    color: "#333",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },

  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});

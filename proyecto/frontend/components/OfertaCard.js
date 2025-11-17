// OfertaCard.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { theme } from "../styles/theme";
import {
  ESTADOS_OFERTA,
  CAMPOS_OFERTA,
  CAMPOS_PEDIDO,
  ESTADOS_PEDIDO,
} from "../dbConfig";
import { aceptarOfertaBatch, updatePedido } from "../utils/firestoreService";
// Ajusta la ruta si ConfirmService está en otra carpeta
import { confirm } from "../utils/ConfirmService";
import { serverTimestamp } from "firebase/firestore";

/**
 * OfertaCard
 * Props:
 * - oferta: object (oferta)
 * - pedidoId: string
 * - pedidoData: object (pedido completo)
 * - onAccepted: function(pedidoId, ofertaId) -> callback para que el padre actualice UI
 */
export default function OfertaCard({ oferta = {}, pedidoId, pedidoData, onAccepted }) {
  const [procesando, setProcesando] = useState(false);

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

  const maxLen = Math.max(medicamentosList.length, montosList.length);
  const rows = Array.from({ length: maxLen }).map((_, i) => {
    const raw = montosList[i];
    const montoNum = parseMonto(raw);
    return {
      medicamento: medicamentosList[i] ?? "—",
      montoRaw: raw ?? 0,
      montoNum,
    };
  });

  const total = rows.reduce((acc, r) => acc + (Number(r.montoNum) || 0), 0);

  const fechaTexto = (() => {
    const f = oferta?.[CAMPOS_OFERTA.FECHA_OFERTA];
    try {
      if (!f) return "Fecha no disponible";
      if (typeof f?.toDate === "function") return f.toDate().toLocaleString();
      if (f?.seconds) return new Date(f.seconds * 1000).toLocaleString();
      return String(f);
    } catch {
      return "Fecha no disponible";
    }
  })();

  const farmaciaNombre = oferta?.[CAMPOS_OFERTA.NOMBRE_FARMACIA] ?? "Farmacia";
  const ofertaImage = oferta?.[CAMPOS_OFERTA.IMAGEN] ?? oferta?.image ?? null;

  const handleAceptar = async () => {
    if (procesando) return;
    setProcesando(true);

    try {
      const totalFormatted = formatCurrency(total);

      // Confirmación con ConfirmService (preset 'confirm_accept_offer' debe existir en alertPresets)
      const confirmed = await confirm("confirm_accept_offer", {
        id: pedidoId,
        farmaciaNombre,
        total: totalFormatted,
        image: ofertaImage,
      });

      if (!confirmed) {
        setProcesando(false);
        return;
      }

      // 1) Ejecutar aceptación en Firestore (batch que marca la oferta aceptada y rechaza las demás)
      await aceptarOfertaBatch(pedidoId, oferta.id, oferta.farmaciaId, { rejectOthers: true });

      // 2) SETEAR la fecha de aceptación en el pedido y cambiar estado a EN_PREPARACION
      // Nota: aceptarOfertaBatch ya actualiza pedido (según tu implementación) pero dejamos esta actualización
      // adicional para forzar FECHA_ACEPTACION con serverTimestamp y estado consistente (EN_PREPARACION).
      try {
        await updatePedido(pedidoId, {
          [CAMPOS_PEDIDO.FECHA_ACEPTACION]: serverTimestamp(),
          [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.EN_PREPARACION,
          [CAMPOS_PEDIDO.OFERTA_ACEPTADA_ID]: oferta.id,
          [CAMPOS_PEDIDO.FARMACIA_ASIGANADA_ID]: oferta.farmaciaId ?? null,
        });
      } catch (errUpdate) {
        console.error("Error seteando FECHA_ACEPTACION / ESTADO en el pedido:", errUpdate);
        // Informar al usuario (no bloquea la UX)
        if (Platform.OS === "web") window.alert("Oferta aceptada pero no se pudo actualizar completamente el pedido.");
        else Alert.alert("Aviso", "Oferta aceptada pero no se pudo actualizar completamente el pedido.");
      }

      // 3) Notificar al padre para que actualice UI inmediatamente (optimistic)
      try {
        if (typeof onAccepted === "function") {
          onAccepted(pedidoId, oferta.id);
        }
      } catch (err) {
        console.warn("onAccepted callback lanzó error:", err);
      }
    } catch (error) {
      console.error("Error en handleAceptar:", error);
      if (Platform.OS === "web") window.alert("Ocurrió un error al aceptar la oferta. Intenta nuevamente.");
      else Alert.alert("Error", "Ocurrió un error al aceptar la oferta. Intenta nuevamente.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.farmaciaHeader}>
        <View style={styles.farmaciaInfo}>
          <Text style={styles.farmaciaNombre}>{farmaciaNombre}</Text>
          <Text style={styles.tiempoEspera}>
            ⏱ {oferta?.[CAMPOS_OFERTA.TIEMPO_ESPERA] ?? "20"} min
          </Text>
        </View>

        <View style={styles.montoContainer}>
          <Text style={styles.montoLabel}>Total</Text>
          <Text style={styles.monto}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.medicamentosContainer}>
        <Text style={styles.medicamentosTitle}>Medicamentos ofrecidos:</Text>

        {rows.map((r, idx) => (
          <View key={idx} style={styles.medicamentoRow}>
            <Text style={styles.medicamentoName} numberOfLines={1}>
              {r.medicamento}
            </Text>
            <Text style={styles.medicamentoPrecio}>
              {formatCurrency(r.montoNum)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.fecha}>Ofertado el: {fechaTexto}</Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.aceptarButton, procesando && { opacity: 0.7 }]}
          onPress={handleAceptar}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.aceptarButtonText}>Aceptar</Text>
          )}
        </TouchableOpacity>
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
    borderWidth: Platform.OS === "web" ? 0.5 : 1,
    borderColor: theme.colors.border,
  },
  farmaciaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.md },
  farmaciaInfo: { flex: 1 },
  farmaciaNombre: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.foreground, marginBottom: 4 },
  tiempoEspera: { fontSize: theme.typography.fontSize.sm, color: theme.colors.mutedForeground },
  montoContainer: { backgroundColor: theme.colors.primary + "10", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center", minWidth: 92 },
  montoLabel: { fontSize: theme.typography.fontSize.xs, color: theme.colors.mutedForeground },
  monto: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary },
  medicamentosContainer: { marginBottom: theme.spacing.md },
  medicamentosTitle: { fontSize: theme.typography.fontSize.base, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs },
  medicamentoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: theme.spacing.xs, borderBottomWidth: 1, borderColor: theme.colors.border },
  medicamentoName: { flex: 1, fontSize: theme.typography.fontSize.base, color: theme.colors.foreground, marginRight: theme.spacing.sm },
  medicamentoPrecio: { fontSize: theme.typography.fontSize.base, fontWeight: theme.typography.fontWeight.medium, color: theme.colors.foreground, textAlign: "right", minWidth: 80 },
  fecha: { fontSize: theme.typography.fontSize.xs, color: theme.colors.mutedForeground, fontStyle: "italic", marginBottom: theme.spacing.md },
  actionsContainer: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.sm },
  button: { flex: 1, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center" },
  aceptarButton: { backgroundColor: theme.colors.primary },
  aceptarButtonText: { color: theme.colors.background, fontSize: theme.typography.fontSize.base, fontWeight: theme.typography.fontWeight.medium },
});

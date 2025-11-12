import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform
} from "react-native";
import { theme } from "../styles/theme";
import { ESTADOS_OFERTA, CAMPOS_OFERTA } from "../dbConfig";
import { aceptarOfertaBatch } from "../utils/firestoreService";

export default function OfertaCard({ oferta, pedidoId, pedidoData }) {

  const handleAceptar = async () => {
    try {
      // ✅ Web no soporta bien Alert.prompt / Alert con callbacks múltiples
      if (Platform.OS === "web") {
        const confirmar = window.confirm(
          `¿Aceptar la oferta de ${oferta.nombreFarmacia} por $${oferta.monto}?`
        );

        if (!confirmar) return;

        await aceptarOfertaBatch(
          pedidoId,
          oferta.id,
          oferta.farmaciaId,
          { rejectOthers: true }
        );

        window.alert(
          `Has aceptado la oferta de ${oferta.nombreFarmacia}. La farmacia será notificada.`
        );
        return;
      }

      // ✅ En móviles (Android/iOS)
      Alert.alert(
        "Confirmar oferta",
        `¿Aceptar la oferta de ${oferta.nombreFarmacia} por $${oferta.monto}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Aceptar",
            onPress: async () => {
              try {
                await aceptarOfertaBatch(
                  pedidoId,
                  oferta.id,
                  oferta.farmaciaId,
                  { rejectOthers: true }
                );

                Alert.alert(
                  "Oferta aceptada",
                  `Has aceptado la oferta de ${oferta.nombreFarmacia}. La farmacia será notificada.`,
                  [{ text: "OK" }]
                );
              } catch (error) {
                console.error("Error al aceptar oferta:", error);
                Alert.alert("Error", "No se pudo aceptar la oferta. Intenta nuevamente.");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error en handleAceptar:", error);
      Alert.alert("Error", "Ocurrió un error al procesar tu solicitud.");
    }
  };

  return (
    <View style={styles.card}>
      {/* Encabezado de la farmacia */}
      <View style={styles.farmaciaHeader}>
        <View style={styles.farmaciaInfo}>
          <Text style={styles.farmaciaNombre}>
            {oferta[CAMPOS_OFERTA.NOMBRE_FARMACIA]}
          </Text>
          <Text style={styles.tiempoEspera}>
            ⏱ {oferta[CAMPOS_OFERTA.TIEMPO_ESPERA] || "20"} min
          </Text>
        </View>

        <View style={styles.montoContainer}>
          <Text style={styles.monto}>
            ${oferta[CAMPOS_OFERTA.MONTO]}
          </Text>
        </View>
      </View>

      {/* Medicamentos */}
      <View style={styles.medicamentosContainer}>
        <Text style={styles.medicamentosTitle}>
          Medicamentos ofrecidos: {oferta[CAMPOS_OFERTA.MEDICAMENTO]}
        </Text>
      </View>

      {/* Fecha */}
      <Text style={styles.fecha}>
        Ofertado el:{" "}
        {oferta[CAMPOS_OFERTA.FECHA_OFERTA]?.toDate?.().toLocaleDateString?.() ||
          "Fecha no disponible"}
      </Text>

      {/* Botón de acción */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.aceptarButton]}
          onPress={handleAceptar}
        >
          <Text style={styles.aceptarButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 💅 Estilos compatibles para web y móvil
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderWidth: Platform.OS === "web" ? 0.5 : 1,
    borderColor: theme.colors.border,
    boxShadow: Platform.OS === "web" ? "0px 4px 8px rgba(0,0,0,0.1)" : undefined,
    cursor: Platform.OS === "web" ? "pointer" : "default",
  },
  farmaciaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  farmaciaInfo: { flex: 1 },
  farmaciaNombre: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  tiempoEspera: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  montoContainer: {
    backgroundColor: theme.colors.primary + "20",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  monto: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  medicamentosContainer: { marginBottom: theme.spacing.md },
  medicamentosTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  fecha: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.mutedForeground,
    fontStyle: "italic",
    marginBottom: theme.spacing.md,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  aceptarButton: {
    backgroundColor: theme.colors.primary,
  },
  aceptarButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { theme } from "../styles/theme";
import { ESTADOS_OFERTA } from "../dbConfig";
import { aceptarOfertaBatch,} from "../utils/firestoreService";


export default function OfertaCard({ oferta, pedidoId, pedidoData }) {
  const handleAceptar = async () => {
    try {
      Alert.alert(
        "Confirmar oferta",
        `¿Aceptar la oferta de ${oferta.nombreFarmacia} por $${oferta.monto}?`,
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Aceptar",
            onPress: async () => {
              try {
                // Usar la función batch que actualiza todo
                await aceptarOfertaBatch(
                  pedidoId, 
                  oferta.id, 
                  oferta.farmaciaId,
                  { rejectOthers: true }
                );
                
                Alert.alert(
                  " Oferta aceptada",
                  `Has aceptado la oferta de ${oferta.nombreFarmacia}. La farmacia será notificada.`,
                  [{ text: "OK" }]
                );
              } catch (error) {
                console.error("Error al aceptar oferta:", error);
                Alert.alert("Error", "No se pudo aceptar la oferta. Intenta nuevamente.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error en handleAceptar:", error);
      Alert.alert("Error", "Ocurrió un error al procesar tu solicitud.");
    }
  };

  return (
    <View style={styles.card}>
      
      <View style={styles.farmaciaHeader}>
        <View style={styles.farmaciaInfo}>
          <Text style={styles.farmaciaNombre}>{oferta.nombreFarmacia}</Text>
          <Text style={styles.tiempoEspera}>
            ⏱ {oferta.tiempoEspera || '--'} min
          </Text>
        </View>
        <View style={styles.montoContainer}>
          <Text style={styles.monto}>${oferta.monto}</Text>
        </View>
      </View>

      
      {oferta.medicamento && oferta.medicamento.length > 0 && (
        <View style={styles.medicamentosContainer}>
          <Text style={styles.medicamentosTitle}>Medicamentos ofrecidos:</Text>
          {oferta.medicamento.map((med, index) => (
            <Text key={index} style={styles.medicamento}>
              • {med}
            </Text>
          ))}
        </View>
      )}

   
      <Text style={styles.fecha}>
        Ofertado el: {oferta.fechaOferta?.toDate?.().toLocaleDateString() || 'Fecha no disponible'}
      </Text>

      
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  farmaciaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  farmaciaInfo: {
    flex: 1,
  },
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
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  monto: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  medicamentosContainer: {
    marginBottom: theme.spacing.md,
  },
  medicamentosTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  medicamento: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.foreground,
    marginLeft: theme.spacing.xs,
  },
  fecha: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.mutedForeground,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
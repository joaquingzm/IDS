import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_USUARIO, CAMPOS_OFERTA, CAMPOS_PEDIDO } from "../dbConfig";

export default function HistorialCard({ pedido, oferta}) {
  if (!pedido) {
    return (
      <View style={styles.card}>
        <Text style={styles.noPedido}>No se tiene un pedido actual</Text>
      </View>
    );
  }

  // Protección si oferta/usuario faltan
  const nombreUsuario = pedido?.[CAMPOS_PEDIDO.NOMBRE_USUARIO] ?? "Desconocido";
  const apellidoUsuario = pedido?.[CAMPOS_PEDIDO.APELLIDO_USUARIO] ?? "";
  const direccion = pedido?.[CAMPOS_PEDIDO.DIRECCION] ?? "No disponible";
  const obraSocial = pedido?.[CAMPOS_PEDIDO.OBRASOCIAL] ?? "No informado";

  // Manejo seguro de fecha (Firestore Timestamp o {seconds, nanoseconds})
  const fechaRaw = oferta?.[CAMPOS_OFERTA.FECHA_OFERTA];
  let fechaTexto = "Sin fecha";
  if (fechaRaw) {
    if (typeof fechaRaw.toDate === "function") {
      // Firestore Timestamp
      fechaTexto = fechaRaw.toDate().toLocaleString();
    } else if (fechaRaw.seconds != null) {
      // Objeto plain { seconds, nanoseconds }
      fechaTexto = new Date(fechaRaw.seconds * 1000).toLocaleString();
    } else {
      fechaTexto = String(fechaRaw);
    }
  }

  // Medicamentos puede ser array o string
  const medicamentosRaw = oferta?.[CAMPOS_OFERTA.MEDICAMENTO];
  const medicamentos =
    Array.isArray(medicamentosRaw) ? medicamentosRaw.join(", ") : String(medicamentosRaw ?? "No informado");

  const monto = oferta?.[CAMPOS_OFERTA.MONTO] ?? "No informado";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Pedido de {nombreUsuario} {apellidoUsuario}
      </Text>

      <Text style={styles.text}>Fecha de llegada: {fechaTexto}</Text>
      <Text style={styles.text}>Dirección: {direccion}</Text>
      <Text style={styles.text}>Obra social: {obraSocial}</Text>
      <Text style={styles.text}>Medicamentos: {medicamentos}</Text>
      <Text style={styles.text}>Monto: {monto}</Text>
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

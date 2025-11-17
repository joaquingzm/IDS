import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_OFERTA, CAMPOS_PEDIDO } from "../dbConfig";

export default function HistorialCard({ pedido, oferta }) {
  if (!pedido) {
    return (
      <View style={styles.card}>
        <Text style={styles.noPedido}>No se tiene un pedido actual</Text>
      </View>
    );
  }

  const nombreUsuario = pedido?.[CAMPOS_PEDIDO.NOMBRE_USUARIO] ?? "Desconocido";
  const apellidoUsuario = pedido?.[CAMPOS_PEDIDO.APELLIDO_USUARIO] ?? "";
  const direccion = pedido?.[CAMPOS_PEDIDO.DIRECCION] ?? "No disponible";
  const obraSocial = pedido?.[CAMPOS_PEDIDO.OBRASOCIAL] ?? "No informado";
  const NumAfiliado = pedido?.[CAMPOS_PEDIDO.OBRASOCIAL_NUM] ?? "No informado";
  const Estado = pedido?.[CAMPOS_PEDIDO.ESTADO] ?? "No informado";
  const Cancelado = pedido?.[CAMPOS_PEDIDO.CANCELADO_POR] ?? "No informado";

  // Fecha segura
  const fechaRaw = oferta?.[CAMPOS_OFERTA.FECHA_OFERTA];
  let fechaTexto = "Sin fecha";
  if (fechaRaw) {
    if (typeof fechaRaw.toDate === "function") {
      fechaTexto = fechaRaw.toDate().toLocaleString();
    } else if (fechaRaw.seconds != null) {
      fechaTexto = new Date(fechaRaw.seconds * 1000).toLocaleString();
    }
  }

  /** ----------------------------------------
   * Copiado de CardPedidoPendiente
   ---------------------------------------- */
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
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 2,
    }).format(n);
  };

  const medicamentosRaw = oferta?.[CAMPOS_OFERTA.MEDICAMENTO];
  const medicamentosList = Array.isArray(medicamentosRaw)
    ? medicamentosRaw
    : medicamentosRaw
    ? [medicamentosRaw]
    : [];

  const montosRaw = oferta?.[CAMPOS_OFERTA.MONTO];
  const montosList = Array.isArray(montosRaw)
    ? montosRaw
    : montosRaw
    ? [montosRaw]
    : [];

  const maxLen = Math.max(medicamentosList.length, montosList.length);

  const rows = Array.from({ length: maxLen }).map((_, i) => ({
    medicamento: medicamentosList[i] ?? "—",
    montoNum: parseMonto(montosList[i]),
  }));

  const total = rows.reduce((acc, r) => acc + (Number(r.montoNum) || 0), 0);

  /** ---------------------------------------- */

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Pedido de {nombreUsuario} {apellidoUsuario}
      </Text>

      <Text style={styles.text}>Fecha de llegada: {fechaTexto}</Text>
      <Text style={styles.text}>Dirección: {direccion}</Text>
      <Text style={styles.text}>Obra social: {obraSocial}</Text>
      <Text style={styles.text}>Número de afiliado: {NumAfiliado}</Text>
      <Text style={styles.text}>Estado: {Estado}</Text>
      {Estado === "rechazado" && (
        <Text style={styles.text}>Cancelado por: {Cancelado}</Text>
      )}
      

      {/* --- BLOQUE DE MEDICAMENTOS (copiado igual al de CardPedidoPendiente) --- */}
      <View style={{ marginTop: 10, marginBottom: 10 }}>
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

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>
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

  /* COPIADOS DE CardPedidoPendiente */
  medicamentosTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  medicamentoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#e1e1e1",
  },
  medicamentoName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  medicamentoPrecio: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    minWidth: 80,
    textAlign: "right",
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

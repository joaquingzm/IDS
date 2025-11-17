import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import {
  CAMPOS_PEDIDO,
  CAMPOS_FARMACIA,
  CAMPOS_OFERTA,
  ESTADOS_PEDIDO,
} from "../dbConfig";

export default function HistorialCard({ pedido, oferta, farmacia }) {
  if (!pedido) {
    return (
      <View style={styles.card}>
        <Text style={styles.noPedido}>No hay información disponible</Text>
      </View>
    );
  }

  /* Helpers */
  const parseFecha = (raw) => {
    if (!raw) return null;
    if (typeof raw.toDate === "function") return raw.toDate().toLocaleString();
    if (raw.seconds != null) return new Date(raw.seconds * 1000).toLocaleString();
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toLocaleString();
    } catch (e) {}
    return null;
  };

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

  /* Datos base */
  const estado = pedido[CAMPOS_PEDIDO.ESTADO];
  const fechaPedido = parseFecha(pedido[CAMPOS_PEDIDO.FECHA_PEDIDO]);

  /* RECHAZADO: diferenciar cliente / farmacia */
  if (estado === ESTADOS_PEDIDO.RECHAZADO) {
    const fechaCancelacion = parseFecha(pedido[CAMPOS_PEDIDO.FECHA_CANCELACION]);
    const canceladoPorRaw = pedido[CAMPOS_PEDIDO.CANCELADO_POR] ?? "";
    const cpLower = String(canceladoPorRaw).toLowerCase();

    const isFarmacia = /farmacia/i.test(cpLower);
    const isCliente = /cliente/i.test(cpLower);

    let titleCancelled = "CANCELADO";
    if (isFarmacia) titleCancelled = "CANCELADO POR FARMACIA";
    else if (isCliente) titleCancelled = "CANCELADO POR CLIENTE";

    return (
      <View style={styles.card}>
        <Text style={styles.titleCancelled}>{titleCancelled}</Text>

        {/* Si hay un valor libre y no es la simple palabra 'farmacia'/'cliente', mostrarlo como detalle */}
        {canceladoPorRaw &&
        !/^(cliente|farmacia)$/i.test(String(canceladoPorRaw).trim()) ? (
          <Text style={[styles.text, styles.cancelDetail]}>{String(canceladoPorRaw)}</Text>
        ) : null}

        {/* Fecha cancelación y fecha del pedido (si existen) */}
        {fechaCancelacion ? (
          <Text style={styles.text}>Fecha cancelación: {fechaCancelacion}</Text>
        ) : null}
        {fechaPedido ? <Text style={styles.text}>Fecha del pedido: {fechaPedido}</Text> : null}

        {/* Si fue cancelado por FARMACIA mostramos también la farmacia y la oferta (si existen) */}
        {isFarmacia ? (
          <>
            {/* Farmacia */}
            {farmacia?.[CAMPOS_FARMACIA.NOMBRE] ? (
              <Text style={[styles.text, styles.farmaciaName]}>
                {farmacia[CAMPOS_FARMACIA.NOMBRE]}
              </Text>
            ) : null}

            {/* Oferta: medicamentos + montos */}
            {oferta ? (
              <View style={{ marginTop: 10, marginBottom: 10 }}>
                <Text style={styles.medicamentosTitle}>Medicamentos (oferta):</Text>

                {(() => {
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

                  if (rows.length === 0) {
                    return <Text style={styles.text}>No hay medicamentos en la oferta</Text>;
                  }

                  return (
                    <>
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
                    </>
                  );
                })()}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    );
  }

  /* Si no está rechazado, mostrar datos normales (solo los que existan) */
  const direccion = pedido[CAMPOS_PEDIDO.DIRECCION] ?? null;
  const farmaciaNombre = farmacia?.[CAMPOS_FARMACIA.NOMBRE] ?? null;

  /* Medicamentos + montos (solo si hay oferta) */
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

  return (
    <View style={styles.card}>
      {farmaciaNombre ? <Text style={styles.title}>{farmaciaNombre}</Text> : null}
      {fechaPedido ? <Text style={styles.text}>Fecha del pedido: {fechaPedido}</Text> : null}
      {direccion ? <Text style={styles.text}>Dirección de entrega: {direccion}</Text> : null}

      {estado === ESTADOS_PEDIDO.REALIZADO ? (
        parseFecha(pedido[CAMPOS_PEDIDO.FECHA_COMPLETADO]) ? (
          <Text style={styles.text}>
            Fecha completado: {parseFecha(pedido[CAMPOS_PEDIDO.FECHA_COMPLETADO])}
          </Text>
        ) : null
      ) : null}

      {oferta && rows.length > 0 ? (
        <View style={{ marginTop: 10, marginBottom: 10 }}>
          <Text style={styles.medicamentosTitle}>Medicamentos comprados:</Text>
          {rows.map((r, idx) => (
            <View key={idx} style={styles.medicamentoRow}>
              <Text style={styles.medicamentoName} numberOfLines={1}>
                {r.medicamento}
              </Text>
              <Text style={styles.medicamentoPrecio}>{formatCurrency(r.montoNum)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    alignSelf: "center",
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },

  /* Título especial para cancelados */
  titleCancelled: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "700",
    color: "#c62828", // rojo fuerte
    marginBottom: theme.spacing.xs,
  },

  /* detalle cuando canceladoPor tiene valor no estándar */
  cancelDetail: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
    fontStyle: "italic",
  },

  farmaciaName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
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

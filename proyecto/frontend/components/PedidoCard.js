import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  Platform,
  Alert,
} from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_FARMACIA, CAMPOS_OFERTA, CAMPOS_PEDIDO, COLECCION_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { confirm } from "../utils/ConfirmService"; // <-- ConfirmService
import { useAlert } from "../context/AlertContext";

export default function PedidoUsuarioCard({ pedido, oferta, ofertas, farmacia }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [estado, setEstado] = useState("");
  const [nombreFarmacia, setNombreFarmacia] = useState("-");
  const [medicamento, setMedicamento] = useState("-");
  const [fechaPedido, setFechaPedido] = useState("Sin fecha");
  const [imagen, setImagen] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const { showAlert } = useAlert();

  // --- Helpers para montos ---
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
  // ---------------------------------------------------------------

  useEffect(() => {
    if (!pedido) {
      setEstado("");
      setNombreFarmacia("-");
      setMedicamento("-");
      setFechaPedido("Sin fecha");
      setImagen(null);
      return;
    }

    // Fecha
    const fechaRaw = pedido?.[CAMPOS_PEDIDO.FECHA_PEDIDO];
    let fechaTexto = "Sin fecha";
    if (fechaRaw) {
      try {
        if (typeof fechaRaw.toDate === "function") {
          fechaTexto = fechaRaw.toDate().toLocaleString();
        } else if (fechaRaw && typeof fechaRaw.seconds === "number") {
          fechaTexto = new Date(fechaRaw.seconds * 1000).toLocaleString();
        } else {
          fechaTexto = String(fechaRaw);
        }
      } catch (e) {
        console.warn("Error convirtiendo fecha:", e);
        fechaTexto = String(fechaRaw);
      }
    }
    setFechaPedido(fechaTexto);

    // Imagen
    const img = pedido?.[CAMPOS_PEDIDO.IMAGEN] || null;
    setImagen(img);

    const estadoRaw = pedido?.[CAMPOS_PEDIDO.ESTADO];
    if (estadoRaw === ESTADOS_PEDIDO.ENTRANTE) {
      const cantOfertas = Array.isArray(ofertas) ? ofertas.length : 0;
      setEstado(cantOfertas === 0 ? "ENTRANTE_SIN_OFERTAS" : "ENTRANTE_CON_OFERTAS");
      setNombreFarmacia("-");
      setMedicamento("-");
    } else if (estadoRaw === ESTADOS_PEDIDO.EN_PREPARACION) {
      setEstado(ESTADOS_PEDIDO.EN_PREPARACION);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const f = pedido?.[CAMPOS_PEDIDO.FECHA_ACEPTACION];
      setFechaPedido(convertFechaToString(f));
    } else if (estadoRaw === ESTADOS_PEDIDO.EN_CAMINO) {
      setEstado(ESTADOS_PEDIDO.EN_CAMINO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const f = pedido?.[CAMPOS_PEDIDO.FECHA_EN_CAMINO];
      setFechaPedido(convertFechaToString(f));
    } else if (estadoRaw === ESTADOS_PEDIDO.CONFIRMACION) {
      setEstado(ESTADOS_PEDIDO.CONFIRMACION);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const f = pedido?.[CAMPOS_PEDIDO.FECHA_ENTREGADO];
      setFechaPedido(convertFechaToString(f));
    } else if (estadoRaw === ESTADOS_PEDIDO.REALIZADO) {
      setEstado(ESTADOS_PEDIDO.REALIZADO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const f = pedido?.[CAMPOS_PEDIDO.FECHA_ENTREGADO];
      setFechaPedido(convertFechaToString(f));
    } else if (estadoRaw === ESTADOS_PEDIDO.RECHAZADO) {
      setEstado(ESTADOS_PEDIDO.RECHAZADO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const f = pedido?.[CAMPOS_PEDIDO.FECHA_CANCELACION] || pedido?.[CAMPOS_PEDIDO.FECHA_ENTREGADO];
      setFechaPedido(convertFechaToString(f));
    } else {
      setEstado(ESTADOS_PEDIDO.ACTIVO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
    }
  }, [pedido, oferta, farmacia, ofertas]);

  const convertFechaToString = (fechaRaw) => {
    try {
      if (!fechaRaw) return "Sin fecha";
      if (typeof fechaRaw?.toDate === "function") return fechaRaw.toDate().toLocaleString();
      if (fechaRaw && typeof fechaRaw.seconds === "number") return new Date(fechaRaw.seconds * 1000).toLocaleString();
      const d = new Date(fechaRaw);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return String(fechaRaw);
    } catch {
      return "Sin fecha";
    }
  };

  const confirmarEntrega = async () => {
    if (procesando) return;
    if (!pedido?.id) return;

    try {
      const ok = await confirm("confirm_entrega", { id: pedido.id, image: imagen });
      if (!ok) return;

      setProcesando(true);

      const pedidoRef = doc(db, COLECCION_PEDIDO, pedido.id);
      const fechaAhora = new Date();
      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.REALIZADO,
        [CAMPOS_PEDIDO.FECHA_COMPLETADO]: fechaAhora,
      });

      setEstado(ESTADOS_PEDIDO.REALIZADO);
      setFechaPedido(fechaAhora.toLocaleString());

      try {
        showAlert && showAlert("pedido_success", { message: "Entrega confirmada. Gracias." });
      } catch (e) {
        if (Platform.OS === "web") window.alert("Entrega confirmada. Gracias.");
        else Alert.alert("Entrega confirmada", "Gracias.");
      }
    } catch (error) {
      console.error("Error confirmando entrega:", error);
      try {
        showAlert && showAlert("pedido_error", { message: "Error al confirmar entrega." });
      } catch (e) {
        if (Platform.OS === "web") window.alert("Error al confirmar entrega.");
        else Alert.alert("Error", "No se pudo confirmar la entrega.");
      }
    } finally {
      setProcesando(false);
    }
  };

  // ------------------- Nuevo: cancelar con ConfirmService -------------------
  const cancelarPedido = async () => {
    if (procesando) return;
    if (!pedido?.id) return;

    try {
      // Usamos ConfirmService para preguntar al usuario (preset: 'confirmar_eliminar_pedido')
      const ok = await confirm("cancelar_pedido");
      if (!ok) return;

      setProcesando(true);

      const pedidoRef = doc(db, COLECCION_PEDIDO, pedido.id);
      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
        [CAMPOS_PEDIDO.FECHA_CANCELACION]: new Date(),
        [CAMPOS_PEDIDO.CANCELADO_POR]: "cliente",
      });

      setEstado(ESTADOS_PEDIDO.RECHAZADO);
      setFechaPedido(new Date().toLocaleString());

      try {
        showAlert && showAlert("pedido_success", { title:"Pedido cancelado.",message: "Pedido cancelado correctamente." });
      } catch (e) {
        if (Platform.OS === "web") window.alert("Pedido cancelado correctamente.");
        else Alert.alert("Pedido cancelado", "Se canceló el pedido correctamente.");
      }
    } catch (error) {
      console.error("Error cancelando pedido:", error);
      try {
        showAlert && showAlert("pedido_error", { message: "No se pudo cancelar el pedido." });
      } catch (e) {
        if (Platform.OS === "web") window.alert("No se pudo cancelar el pedido.");
        else Alert.alert("Error", "No se pudo cancelar el pedido.");
      }
    } finally {
      setProcesando(false);
    }
  };
  // ------------------------------------------------------------------------

  // --- Preparación de filas de medicamentos ---
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

  const rows = useMemo(() => {
    const maxLen = Math.max(medicamentosList.length, montosList.length);
    return Array.from({ length: maxLen }).map((_, i) => {
      const raw = montosList[i];
      const montoNum = parseMonto(raw);
      return {
        medicamento: medicamentosList[i] ?? "—",
        montoRaw: raw ?? 0,
        montoNum,
      };
    });
  }, [medicamentosList.join?.("|") ?? medicamentosList, montosList.join?.("|") ?? montosList]);

  const total = useMemo(() => rows.reduce((acc, r) => acc + (Number(r.montoNum) || 0), 0), [rows]);

  const ofertasCount = Array.isArray(ofertas) ? ofertas.length : 0;

  // Mostrar botón cancelar sólo si se puede
  const puedeCancelar = ![
    ESTADOS_PEDIDO.EN_CAMINO,
    ESTADOS_PEDIDO.REALIZADO,
    ESTADOS_PEDIDO.CONFIRMACION,
  ].includes(estado);

  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        {/* ENTRENTE SIN OFERTAS */}
        {estado === "ENTRANTE_SIN_OFERTAS" && (
          <Text style={styles.title}>Esperando ofertas.</Text>
        )}
        {/* ENTRENTE CON OFERTAS */}
        {estado === "ENTRANTE_CON_OFERTAS" && (
          <Text style={styles.title}>Hay ofertas disponibles.</Text>
        )}
        {estado === ESTADOS_PEDIDO.ACTIVO && <Text style={styles.title}>Activo.</Text>}
        {estado === ESTADOS_PEDIDO.EN_PREPARACION && <Text style={styles.title}>En preparación.</Text>}
        {estado === ESTADOS_PEDIDO.EN_CAMINO && <Text style={styles.title}>En camino.</Text>}
        {estado === ESTADOS_PEDIDO.CONFIRMACION && <Text style={styles.title}>Entregado.</Text>}

        <View style={styles.imageRow}>
          <TouchableOpacity
            onPress={() => {
              if (imagen) setModalVisible(true);
            }}
            activeOpacity={imagen ? 0.8 : 1}
          >
            {imagen ? (
              <Image source={{ uri: imagen }} style={styles.image} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>Sin imagen</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Contenido según estado (omitido para brevedad — lo mantenés igual que antes) */}
        {estado === "ENTRANTE_SIN_OFERTAS" && (
          <>
            <Text style={styles.text}>Tu pedido aún no recibió ofertas.</Text>
            <Text style={styles.text}>{fechaPedido}</Text>
          </>
        )}

        {estado === "ENTRANTE_CON_OFERTAS" && (
          <>
            <Text style={styles.text}>
              Hay{" "}
              <Text style={styles.ofertasNumero}>
                {ofertasCount}
              </Text>{" "}
              {ofertasCount === 1 ? "oferta" : "ofertas"} disponibles.
            </Text>

            <Text style={styles.text}>{fechaPedido}</Text>
          </>
        )}

        {estado === ESTADOS_PEDIDO.ACTIVO && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>

              <View style={styles.totalRow}>
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

            <Text style={styles.text}>{fechaPedido}</Text>
          </>
        )}

        {estado === ESTADOS_PEDIDO.EN_PREPARACION && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>

              <View style={styles.totalRow}>
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

            <Text style={styles.text}>{fechaPedido}</Text>
          </>
        )}

        {estado === ESTADOS_PEDIDO.EN_CAMINO && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>

              <View style={styles.totalRow}>
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

            <Text style={styles.text}>{fechaPedido}</Text>
          </>
        )}

        {estado === ESTADOS_PEDIDO.CONFIRMACION && (
          <>
            <Text style={styles.text}>La farmacia marcó el pedido como entregado. Por favor confirmá que lo recibiste.</Text>
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>

                <View style={styles.totalRow}>
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

              <Text style={styles.text}>{fechaPedido}</Text>
            </>
            <TouchableOpacity
              style={[styles.confirmBtn, procesando && { opacity: 0.7 }]}
              onPress={confirmarEntrega}
              disabled={procesando}
            >
              <Text style={styles.confirmText}>Confirmar Entrega</Text>
            </TouchableOpacity>
          </>
        )}

        {estado === ESTADOS_PEDIDO.REALIZADO && (
          <>
            <Text style={styles.text}>Entrega confirmada. Gracias.</Text>
            <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>
            <Text style={styles.text}>Medicamento: {medicamento}</Text>
            <Text style={styles.text}> {fechaPedido} </Text>
          </>
        )}
      </View>

      {puedeCancelar && (
        <TouchableOpacity
          style={[styles.cancelBtn, procesando && { opacity: 0.7 }]}
          onPress={cancelarPedido}
          disabled={procesando}
        >
          <Text style={styles.cancelText}>Cancelar Pedido</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          {imagen ? (
            <Image source={{ uri: imagen }} style={styles.fullImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
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
  infoContainer: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "70%",
    borderRadius: 12,
  },
  confirmBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  confirmText: {
    color: "#000000ff",
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.destructive,
    alignItems: "center",
  },
  cancelText: {
    color: theme.colors.destructive,
    fontWeight: "700",
    fontSize: 16,
  },
  ofertasNumero: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  medicamentosContainer: { marginBottom: theme.spacing.md },
  medicamentosTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  medicamentoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  medicamentoName: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginRight: theme.spacing.sm,
  },
  medicamentoPrecio: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.foreground,
    textAlign: "right",
    minWidth: 80,
  },
  totalRow: {
    alignItems: "flex-end",
    marginBottom: theme.spacing.sm,
  },
  montoLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  monto: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

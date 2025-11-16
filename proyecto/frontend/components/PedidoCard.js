import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  Alert,
  Platform,
} from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_FARMACIA, CAMPOS_OFERTA, CAMPOS_PEDIDO, COLECCION_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function PedidoUsuarioCard({ pedido, oferta, ofertas, farmacia }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [estado, setEstado] = useState("");
  const [nombreFarmacia, setNombreFarmacia] = useState("-");
  const [medicamento, setMedicamento] = useState("-");
  const [fechaPedido, setFechaPedido] = useState("Sin fecha");
  const [imagen, setImagen] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // --- Helpers para montos (copiados/adaptados de tu OfertaCard) ---
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

  // ---- IMPORTANT: ahora dependemos también de "ofertas" para que actualice en vivo ----
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
    // NUEVA LÓGICA: si está ENTRANTE evaluamos la cantidad de ofertas actuales
    if (estadoRaw === ESTADOS_PEDIDO.ENTRANTE) {
      const cantOfertas = Array.isArray(ofertas) ? ofertas.length : 0;

      if (cantOfertas === 0) {
        setEstado("ENTRANTE_SIN_OFERTAS"); // pseudo-estado interno
      } else {
        setEstado("ENTRANTE_CON_OFERTAS"); // pseudo-estado interno
      }

      setNombreFarmacia("-");
      setMedicamento("-");
    } else if (estadoRaw === ESTADOS_PEDIDO.EN_PREPARACION) {
      setEstado(ESTADOS_PEDIDO.EN_PREPARACION);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
    } else if (estadoRaw === ESTADOS_PEDIDO.EN_CAMINO) {
      setEstado(ESTADOS_PEDIDO.EN_CAMINO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
    } else if (estadoRaw === ESTADOS_PEDIDO.CONFIRMACION) {
      setEstado(ESTADOS_PEDIDO.CONFIRMACION);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
    } else if (estadoRaw === ESTADOS_PEDIDO.REALIZADO) {
      setEstado(ESTADOS_PEDIDO.REALIZADO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
    } else {
      // por defecto lo tratamos como ACTIVO
      setEstado(ESTADOS_PEDIDO.ACTIVO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
    }
  }, [pedido, oferta, farmacia, ofertas]); // <-- aquí incluimos "ofertas"

  const confirmarEntrega = async () => {
    if (procesando) return;
    if (!pedido?.id) return;

    const confirmar =
      Platform.OS === "web"
        ? window.confirm("¿Confirmar recepción del pedido?")
        : await new Promise((resolve) =>
            Alert.alert(
              "Confirmar entrega",
              "¿Confirmás que recibiste el pedido?",
              [
                { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                { text: "Confirmar", onPress: () => resolve(true) },
              ],
              { cancelable: true }
            )
          );

    if (!confirmar) return;

    setProcesando(true);
    try {
      const pedidoRef = doc(db, COLECCION_PEDIDO, pedido.id);
      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.REALIZADO,
      });

      setEstado(ESTADOS_PEDIDO.REALIZADO);
      if (Platform.OS === "web") window.alert("Entrega confirmada. Gracias.");
      else Alert.alert("Gracias", "Entrega confirmada.");
    } catch (error) {
      console.error("Error confirmando entrega:", error);
      Alert.alert("Error", "No se pudo confirmar la entrega.");
    } finally {
      setProcesando(false);
    }
  };

  // --- Preparación de filas de medicamentos para mostrar en ACTIVO ---
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

  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        {/* ENTRENTE SIN OFERTAS */}
        {estado === "ENTRANTE_SIN_OFERTAS" && (
          <Text style={styles.title}>Esperando ofertas.</Text>
        )}
        {/* ENTRENTE CON OFERTAS (antes PENDIENTE) */}
        {estado === "ENTRANTE_CON_OFERTAS" && (
          <Text style={styles.title}>Hay ofertas disponibles.</Text>
        )}
        {/* YA NO EXISTE PENDIENTE */}
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

        {/* SIN OFERTAS */}
        {estado === "ENTRANTE_SIN_OFERTAS" && (
          <>
            <Text style={styles.text}>Tu pedido aún no recibió ofertas.</Text>
            <Text style={styles.text}>{fechaPedido}</Text>
          </>
        )}

        {/* CON OFERTAS */}
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

            {/* Lista de medicamentos con precio a la derecha */}
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

            {/* Lista de medicamentos con precio a la derecha */}
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
          <Text style={styles.text}>EN_CAMINO</Text>
        )}

        {estado === ESTADOS_PEDIDO.CONFIRMACION && (
          <>
            <Text style={styles.text}>La farmacia marcó el pedido como entregado. Por favor confirmá que lo recibiste.</Text>
            <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>
            <Text style={styles.text}>Medicamento: {medicamento}</Text>
            <Text style={styles.text}> {fechaPedido} </Text>

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
  ofertasNumero: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },

  /* --- Estilos añadidos para mostrar la lista como en OfertaCard --- */
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
  /* --------------------------------------------------------------- */
});

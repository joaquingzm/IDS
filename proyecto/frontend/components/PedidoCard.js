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
} from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_FARMACIA, CAMPOS_OFERTA, CAMPOS_PEDIDO, COLECCION_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { confirm } from "../utils/ConfirmService"; // <-- IMPORT: ConfirmService (asegurate de la ruta)
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
      const fechaRaw = pedido?.[CAMPOS_PEDIDO.FECHA_ACEPTACION];
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
      setFechaPedido(fechaTexto || "");
    } else if (estadoRaw === ESTADOS_PEDIDO.EN_CAMINO) {
      setEstado(ESTADOS_PEDIDO.EN_CAMINO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const fechaRaw = pedido?.[CAMPOS_PEDIDO.FECHA_EN_CAMINO];
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
      setFechaPedido(fechaTexto || "");
    } else if (estadoRaw === ESTADOS_PEDIDO.CONFIRMACION) {
      setEstado(ESTADOS_PEDIDO.CONFIRMACION);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const fechaRaw = pedido?.[CAMPOS_PEDIDO.FECHA_ENTREGADO];
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
      setFechaPedido(fechaTexto || "");
    } else if (estadoRaw === ESTADOS_PEDIDO.REALIZADO) {
      setEstado(ESTADOS_PEDIDO.REALIZADO);
      setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
      setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
      const fechaRaw = pedido?.[CAMPOS_PEDIDO.FECHA_ENTREGADO];
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
      setFechaPedido(fechaTexto || "");
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

    try {
      // abrimos el confirm modal provisto por ConfirmService
      // USO: confirm(presetKey, params) -> Promise<boolean>
      // Ajustá 'confirm_accept_offer' por el preset que prefieras en alertPresets (podes crear uno 'confirmar_entrega').
      const ok = await confirm("confirm_entrega");

      if (!ok) {
        // usuario canceló
        return;
      }

      setProcesando(true);

      const pedidoRef = doc(db, COLECCION_PEDIDO, pedido.id);
      // Actualizamos estado y fecha de entrega
      const fechaAhora = new Date();
      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.REALIZADO,
        [CAMPOS_PEDIDO.FECHA_COMPLETADO]: fechaAhora,
      });
      showAlert("pedido_recibido_success", { message: "Pedido finalizado. Ver en el historial." });
    } catch (error) {
      console.error("Error confirmando entrega:", error);
      showAlert("pedido_recibido_error", { message: "Error al confirmar." });
    } finally {
      setProcesando(false);
    }
  };

  // 2. FUNCIÓN PARA CANCELAR EL PEDIDO (CORREGIDA)
  const cancelarPedido = async () => {
    if (procesando) return;
    if (!pedido?.id) return;

    const confirmar =
      Platform.OS === "web"
        ? window.confirm("¿Estás seguro de que querés cancelar este pedido?")
        : await new Promise((resolve) =>
            Alert.alert(
              "Cancelar Pedido",
              "¿Estás seguro de que querés cancelar este pedido? Esta acción no se puede deshacer.",
              [
                { text: "No, mantener", style: "cancel", onPress: () => resolve(false) },
                { text: "Sí, cancelar", style: "destructive", onPress: () => resolve(true) },
              ],
              { cancelable: true }
            )
          );

    if (!confirmar) return;

    setProcesando(true);
    try {
      const pedidoRef = doc(db, COLECCION_PEDIDO, pedido.id);
      
      // Aplicamos TUS REGLAS DE NEGOCIO:
      await updateDoc(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
        [CAMPOS_PEDIDO.FECHA_CANCELACION]: new Date(), // <-- Campo requerido
        [CAMPOS_PEDIDO.CANCELADO_POR]: "cliente", // <-- Campo requerido
      });
      
      setEstado(ESTADOS_PEDIDO.RECHAZADO);
      
      // (La card desaparecerá sola en OfertsScreen gracias al listener)

    } catch (error) {
      // SI SEGUÍS VIENDO EL ALERT DE "ERROR", EL PROBLEMA SON
      // TUS REGLAS DE SEGURIDAD DE FIRESTORE (PERMISOS)
      console.error("Error cancelando pedido:", error);
      Alert.alert("Error", "No se pudo cancelar el pedido. Revisa la consola.");
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
  // 3. DEFINIMOS SI EL BOTÓN DE CANCELAR DEBE MOSTRARSE
  const puedeCancelar = ![
    ESTADOS_PEDIDO.EN_CAMINO,
    ESTADOS_PEDIDO.REALIZADO, // Asumo que REALIZADO es el estado final (tu HU decía "completado")
    ESTADOS_PEDIDO.CANCELADO, // Si ya está cancelado, no se puede cancelar
    ESTADOS_PEDIDO.CONFIRMACION // Si está esperando confirmación, ya no se puede cancelar
  ].includes(estado);

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
      {/* 4. MOSTRAMOS EL BOTÓN DE CANCELAR SI 'puedeCancelar' ES TRUE */}
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
    borderColor: theme.colors.destructive, // Borde rojo
    alignItems: "center",
  },
  cancelText: {
    color: theme.colors.destructive, // Texto rojo
    fontWeight: "700",
    fontSize: 16,
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

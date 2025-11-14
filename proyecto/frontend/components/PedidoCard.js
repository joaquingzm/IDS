import React, { useState, useEffect } from "react";
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

export default function PedidoUsuarioCard({ pedido, oferta, farmacia }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [estado, setEstado] = useState("");
  const [nombreFarmacia, setNombreFarmacia] = useState("-");
  const [medicamento, setMedicamento] = useState("-");
  const [fechaPedido, setFechaPedido] = useState("Sin fecha");
  const [imagen, setImagen] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (!pedido) {
      setEstado("");
      setNombreFarmacia("-");
      setMedicamento("-");
      setFechaPedido("Sin fecha");
      setImagen(null);
      return;
    }

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

    const img = pedido?.[CAMPOS_PEDIDO.IMAGEN] || null;
    setImagen(img);

    const estadoRaw = pedido?.[CAMPOS_PEDIDO.ESTADO];
    if (estadoRaw === ESTADOS_PEDIDO.ENTRANTE) {
      setEstado(ESTADOS_PEDIDO.ENTRANTE);
      setNombreFarmacia("-");
      setMedicamento("-");
    } else if (estadoRaw === ESTADOS_PEDIDO.PENDIENTE) {
      setEstado(ESTADOS_PEDIDO.PENDIENTE);
      setNombreFarmacia("-");
      setMedicamento("-");
    } else if (estadoRaw === ESTADOS_PEDIDO.CONFIRMACION) {
      // cuando la farmacia marcó entregado y espera confirmación
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
  }, [pedido, oferta, farmacia]);

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

  return (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        {estado === ESTADOS_PEDIDO.ENTRANTE && <Text style={styles.title}>Esperando ofertas.</Text>}
        {estado === ESTADOS_PEDIDO.PENDIENTE && <Text style={styles.title}>Esperando confirmacion.</Text>}
        {(estado === ESTADOS_PEDIDO.ACTIVO || estado === ESTADOS_PEDIDO.CONFIRMACION) && (
          <Text style={styles.title}>
            {estado === ESTADOS_PEDIDO.CONFIRMACION ? "En preparación (entregado por la farmacia)" : "En preparación."}
          </Text>
        )}
        {estado === ESTADOS_PEDIDO.REALIZADO && <Text style={styles.title}>Entrega confirmada.</Text>}

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

        {estado === ESTADOS_PEDIDO.ENTRANTE && (
          <>
            <Text style={styles.text}>Tu pedido aún no recibió ofertas.</Text>
            <Text style={styles.text}> {fechaPedido} </Text>
          </>
        )}

        {estado === ESTADOS_PEDIDO.PENDIENTE && (
          <>
            <Text style={styles.text}>Hay ofertas disponibles.</Text>
            <Text style={styles.text}> {fechaPedido} </Text>
          </>
        )}

        {estado === ESTADOS_PEDIDO.ACTIVO && (
          <>
            <Text style={styles.text}>Tu pedido está en curso en la farmacia.</Text>
            <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>
            <Text style={styles.text}>Medicamento: {medicamento}</Text>
          </>
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
});

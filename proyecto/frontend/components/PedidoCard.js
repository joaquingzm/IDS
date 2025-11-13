import React, {useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, modalVisible, Image, Timestamp } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_FARMACIA, CAMPOS_OFERTA, CAMPOS_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";

export default function PedidoUsuarioCard({ pedido, oferta, farmacia }) {

const [modalVisible, setModalVisible] = useState(false);
const [estado, setEstado] = useState("");
const [nombreFarmacia, setNombreFarmacia] = useState("-");
const [medicamento, setMedicamento] = useState("-");
const [fechaPedido, setFechaPedido] = useState('');
const [imagen, setImagen] = useState(pedido[CAMPOS_PEDIDO.IMAGEN]);

useEffect(() => {
  const fechaRaw = pedido?.[CAMPOS_PEDIDO.FECHA_PEDIDO];
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
  setFechaPedido(fechaTexto);
  // Actualizamos estado según el estado del pedido
  if (ESTADOS_PEDIDO.ENTRANTE === pedido[CAMPOS_PEDIDO.ESTADO]) {
    setEstado("Esperando ofertas.");
    setNombreFarmacia("-");
    setMedicamento("-");
  } else if (ESTADOS_PEDIDO.PENDIENTE === pedido[CAMPOS_PEDIDO.ESTADO]) {
    setEstado("Hay ofertas esperando.");
    setNombreFarmacia("-");
    setMedicamento("-");
  } else {
    setEstado("Activo.");
    setNombreFarmacia(farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "-");
    setMedicamento(oferta?.[CAMPOS_OFERTA.MEDICAMENTO] || "-");
  }
}, [pedido, oferta, farmacia]);


return (
  <View style={styles.card}>
    <View style={styles.infoContainer}>
      <Text style={styles.title}>Estado: {estado}</Text>
      <Text style={styles.text}>Farmacia: {nombreFarmacia}</Text>
      <Text style={styles.text}>Medicamentos: {medicamento}</Text>
      <Text style={styles.text}>Fecha del pedido: {fechaPedido}</Text>
    </View>
    {/* Imagen + texto superior */}
          <View style={styles.imageRow}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              {imagen ? (
                <Image source={{ uri: imagen }} style={styles.image} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
    {/* Modal con imagen ampliada */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setModalVisible(false)}
            >
              <Image source={{ uri: imagen }} style={styles.fullImage} resizeMode="contain" />
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
});
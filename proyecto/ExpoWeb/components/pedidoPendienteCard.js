import React ,{ useState } from "react";
import { View, Text, StyleSheet, Image, Modal, Pressable } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_OFERTA, CAMPOS_PEDIDO } from "../dbConfig";

export default function CardPedidoPendiente({ pedido, oferta }) {
  const [modalVisible, setModalVisible] = useState(false);
  const nombre = pedido[CAMPOS_PEDIDO.NOMBRE_USUARIO] || "No especificado";
  const apellido = pedido[CAMPOS_PEDIDO.APELLIDO_USUARIO] || "No especificado";
  const direccion = pedido[CAMPOS_PEDIDO.DIRECCION] || "No especificado";
  const obraSocial = pedido[CAMPOS_PEDIDO.OBRASOCIAL] || "No especificado";
  const fechaPedido = pedido[CAMPOS_PEDIDO.FECHA_PEDIDO]?.toDate?.() || null;
  const imagen = pedido[CAMPOS_PEDIDO.IMAGEN];
  const monto = oferta[CAMPOS_OFERTA.MONTO]; //Hay que traerse la oferta;
  const medicamentos = oferta[CAMPOS_OFERTA.MEDICAMENTO] || "No especificado";

  return (
    <View style={styles.card}>
      {/* Imagen + texto superior */}
      <View style={styles.imageRow}>
        {imagen ? (
          <Pressable onPress={() => setModalVisible(true)}>
            <Image source={{ uri: imagen }} style={styles.image} />
          </Pressable>
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}

        <View style={styles.extraTextContainer}>
          <Text style={styles.extraText}>🕓 Esperando a ser aceptado por el usuario</Text>
          <Text style={styles.extraSubText}>Farmacia Central</Text>
        </View>
      </View>

      {/* Info básica */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>
          Pedido de {nombre} {apellido}
        </Text>
        {direccion && <Text style={styles.text}>Dirección: {direccion}</Text>}
        {obraSocial && <Text style={styles.text}>Obra social: {obraSocial}</Text>}
        {monto && <Text style={styles.text}>Monto: ${monto}</Text>}
        {medicamentos && <Text style={styles.text}>Medicamentos: {medicamentos}</Text>}
        {fechaPedido && (
          <Text style={styles.text}>
            Fecha de llegada: {fechaPedido.toLocaleDateString()}{" "}
            {fechaPedido.toLocaleTimeString()}
          </Text>
        )}
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

// Estilos
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
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
    marginRight: 12,
  },
  placeholderText: {
    color: "#666",
  },
  extraTextContainer: {
    flex: 1,
  },
  extraText: {
    color: "#222",
    fontSize: 16,
    fontWeight: "bold",
  },
  extraSubText: {
    color: "#555",
    fontSize: 14,
    marginTop: 4,
  },
  infoContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
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
});

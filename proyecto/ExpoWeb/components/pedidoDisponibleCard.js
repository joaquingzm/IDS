import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Pressable, Modal } from "react-native";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc , serverTimestamp } from "firebase/firestore";
import { theme } from "../styles/theme";
import {
  COLECCION_USUARIOS,
  CAMPOS_USUARIO,
  COLECCION_FARMACIAS,
  CAMPOS_FARMACIA,
  COLECCION_PEDIDO,
  CAMPOS_PEDIDO,
  COLECCION_OFERTA,
  CAMPOS_OFERTA,
  ESTADOS_PEDIDO,
  ESTADOS_OFERTA,
} from "../dbConfig";
import { updatePedido , crearOferta } from "../utils/firestoreService";
import { auth } from "../firebase";

export default function pedidoDisponibleCard({ pedido , farmacia , tiempoEspera }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [medicamentos, setMedicamentos] = useState("");
  const [monto, setMonto] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const farmaciaId = auth.currentUser?.uid;

  const handleAceptarPress = () => {
    setMostrarFormulario(true);
  };

  const handleConfirmarAceptar = async () => {
    if (!medicamentos.trim() || !monto.trim()) {
      alert("Por favor, completa ambos campos");
      return;
    }

    try {

      await updatePedido(pedido.id, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.PENDIENTE,
        [CAMPOS_PEDIDO.FARMACIA_ASIGNADA_ID]: farmaciaId,
      });

      await crearOferta(pedido.id, {
        [CAMPOS_OFERTA.FARMACIA_ID]: farmaciaId || "",
        [CAMPOS_OFERTA.NOMBRE_FARMACIA]: farmacia[CAMPOS_FARMACIA.NOMBRE] || "",
        [CAMPOS_OFERTA.MONTO]: monto || 0,
        [CAMPOS_OFERTA.MEDICAMENTO]: medicamentos || [],
        [CAMPOS_OFERTA.TIEMPO_ESPERA]: tiempoEspera || null,
        [CAMPOS_OFERTA.FECHA_OFERTA]: serverTimestamp(),
        [CAMPOS_OFERTA.ESTADO]: ESTADOS_OFERTA?.PENDIENTE || "pendiente",
      });



      console.log(" Pedido aceptado y movido correctamente a PedidosAceptados");
      alert("Pedido aceptado con éxito");

      // Resetear el estado
      setMostrarFormulario(false);
      setMedicamentos("");
      setMonto("");
    } catch (error) {
      console.error("Error al aceptar pedido:", error);
      alert(`Error al aceptar el pedido: ${error.message}`);
    }
  };

  const handleCancelarAceptar = () => {
    setMostrarFormulario(false);
    setMedicamentos("");
    setMonto("");
  };

  const handleRechazar = async () => {
    try {
      await updatePedido(pedido.id, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
      });
      console.log(" Pedido rechazado y eliminado");
      alert("Pedido rechazado y eliminado");
    } catch (error) {
      console.error("Error al rechazar pedido:", error);
      alert("Error al rechazar el pedido.");
    }
  };


  const nombre = pedido[CAMPOS_PEDIDO.NOMBRE_USUARIO] || "No especificado";
  const apellido = pedido[CAMPOS_PEDIDO.APELLIDO_USUARIO] || "No especificado";
  const direccion = pedido[CAMPOS_PEDIDO.DIRECCION] || "No especificado";
  const obraSocial = pedido[CAMPOS_PEDIDO.OBRASOCIAL] || "No especificado";
  const fechaPedido = pedido[CAMPOS_PEDIDO.FECHA_PEDIDO]?.toDate?.() || null;
  const imagen = pedido[CAMPOS_PEDIDO.IMAGEN];
  const textOCR = pedido[CAMPOS_PEDIDO.OCR];


  return (
    <View style={styles.card}>
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

        <View style={styles.extraTextContainer}>
          <Text style={styles.extraText}>🕓 Pendiente de confirmación</Text>
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
        {/*MODIFICAR*/}
        {textOCR && <Text style={styles.text}>Medicamento detectado: {Object.values(textOCR).join(" , ")}</Text>}
        {fechaPedido && (
          <Text style={styles.text}>
            Fecha de llegada: {fechaPedido.toLocaleDateString()}{" "}
            {fechaPedido.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Formulario o botones */}
      {mostrarFormulario ? (
        <View style={styles.formularioContainer}>
          <Text style={styles.formularioTitulo}>Completar información del pedido</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Medicamentos</Text>
            <TextInput
              style={styles.textInput}
              value={medicamentos}
              onChangeText={setMedicamentos}
              placeholder={"Sugerencia " + Object.values(textOCR).join(", ")}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Monto</Text>
            <View style={styles.montoContainer}>
              <Text style={styles.pesoSign}>$</Text>
              <TextInput
                style={[styles.textInput, styles.montoInput]}
                value={monto}
                onChangeText={setMonto}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formularioActions}>
            <TouchableOpacity
              style={[styles.button, styles.confirmar]}
              onPress={handleConfirmarAceptar}
            >
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelar]}
              onPress={handleCancelarAceptar}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.aceptar]}
            onPress={handleAceptarPress}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.rechazar]}
            onPress={handleRechazar}
          >
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}

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
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formularioContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  formularioTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#000",
  },
  montoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pesoSign: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginRight: 8,
  },
  montoInput: {
    flex: 1,
  },
  formularioActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  aceptar: {
    backgroundColor: "#ff8f05ff",
  },
  rechazar: {
    backgroundColor: "#9E9E9E",
  },
  confirmar: {
    backgroundColor: "#ff8f05ff",
  },
  cancelar: {
    backgroundColor: "#9E9E9E",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
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
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Pressable,
  Modal,
} from "react-native";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

import { updatePedido, crearOferta } from "../utils/firestoreService";
import { auth } from "../firebase";

export default function PedidoDisponibleCard({ pedido, farmacia, tiempoEspera }) {
  const farmaciaId = auth.currentUser?.uid;

  const [modalVisible, setModalVisible] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
   if (!pedido) {
    console.warn("⚠️ PedidoDisponibleCard recibió pedido = undefined");
    return null;
  }

  // --- OCR PARSING ---
  const textOCR =
  pedido?.[CAMPOS_PEDIDO.OCR] ??
  pedido?.ocr ??
  pedido?.resultadosOCR ??
  pedido?.textoOCR ??
  [];

  const initialItems = Array.isArray(textOCR)
  ? textOCR.map((m) => ({ medicamento: String(m), monto: "" }))
  : typeof textOCR === "object" && textOCR !== null
  ? Object.values(textOCR).map((m) => ({ medicamento: String(m), monto: "" }))
  : [];

  const [items, setItems] = useState(initialItems);

  // Añadir ítem manualmente
  const agregarItem = () => {
    setItems([...items, { medicamento: "", monto: "" }]);
  };

  // Borrar ítem
  const borrarItem = (index) => {
    const copia = items.filter((_, i) => i !== index);
    setItems(copia);
  };

  const handleAceptarPress = () => {
    setMostrarFormulario(true);
  };

  // CONFIRMAR
  const handleConfirmarAceptar = async () => {
    if (items.length === 0) {
      alert("Debe haber al menos un medicamento.");
      return;
    }

    const medicamentosList = items.map((i) => i.medicamento.trim());
    const montosList = items.map((i) => Number(i.monto) || 0);

    try {
      await updatePedido(pedido.id, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.PENDIENTE,
        [CAMPOS_PEDIDO.FARMACIA_ASIGNADA_ID]: farmaciaId,
      });

      await crearOferta(pedido.id, {
        [CAMPOS_OFERTA.FARMACIA_ID]: farmaciaId || "",
        [CAMPOS_OFERTA.NOMBRE_FARMACIA]: farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "",
        [CAMPOS_OFERTA.MEDICAMENTO]: medicamentosList,
        [CAMPOS_OFERTA.MONTO]: montosList,
        [CAMPOS_OFERTA.TIEMPO_ESPERA]: tiempoEspera || null,
        [CAMPOS_OFERTA.FECHA_OFERTA]: serverTimestamp(),
        [CAMPOS_OFERTA.ESTADO]: ESTADOS_OFERTA.PENDIENTE,
      });

      alert("Pedido aceptado con éxito");
      setMostrarFormulario(false);
    } catch (error) {
      console.error("Error al aceptar pedido:", error);
      alert("Error al aceptar el pedido.");
    }
  };

  const handleCancelarAceptar = () => {
    setMostrarFormulario(false);
  };

  const handleRechazar = async () => {
    try {
      await updatePedido(pedido.id, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO.RECHAZADO,
      });
      alert("Pedido rechazado.");
    } catch (error) {
      console.error("Error al rechazar:", error);
      alert("Error al rechazar el pedido.");
    }
  };

  // DATOS DEL PEDIDO
  const nombre = pedido[CAMPOS_PEDIDO.NOMBRE_USUARIO] || "No especificado";
  const apellido = pedido[CAMPOS_PEDIDO.APELLIDO_USUARIO] || "No especificado";
  const direccion = pedido[CAMPOS_PEDIDO.DIRECCION] || "No especificado";
  const obraSocial = pedido[CAMPOS_PEDIDO.OBRASOCIAL] || "No especificado";
  const obraSocialNum = pedido[CAMPOS_PEDIDO.OBRASOCIAL_NUM] || "No especificado";
  const fechaPedido = pedido[CAMPOS_PEDIDO.FECHA_PEDIDO]?.toDate?.() || null;
  const imagen = pedido[CAMPOS_PEDIDO.IMAGEN];

  return (
    <View style={styles.card}>
      {/* IMAGEN */}
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
          <Text style={styles.extraSubText}>
            {farmacia?.[CAMPOS_FARMACIA.NOMBRE] || "Farmacia desconocida"}
          </Text>
        </View>
      </View>

      {/* INFO */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Pedido de {nombre} {apellido}</Text>
        <Text style={styles.text}>Dirección: {direccion}</Text>
        <Text style={styles.text}>Obra social: {obraSocial}</Text>
        <Text style={styles.text}>Nro Afiliado: {obraSocialNum}</Text>

        {fechaPedido && (
          <Text style={styles.text}>
            Fecha llegada: {fechaPedido.toLocaleDateString()} {fechaPedido.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* FORMULARIO COMPLETO */}
      {mostrarFormulario ? (
        <View style={styles.formularioContainer}>
          <Text style={styles.formularioTitulo}>Medicamentos y Montos</Text>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Medicamento</Text>
                <TextInput
                  style={styles.textInput}
                  value={item.medicamento}
                  onChangeText={(txt) => {
                    const copia = [...items];
                    copia[index].medicamento = txt;
                    setItems(copia);
                  }}
                />
              </View>

              <View style={{ flex: 0.7, marginLeft: 10 }}>
                <Text style={styles.inputLabel}>Monto</Text>
                <TextInput
                  style={styles.textInput}
                  value={item.monto}
                  placeholder="$"
                  keyboardType="numeric"
                  onChangeText={(txt) => {
                    const copia = [...items];
                    copia[index].monto = txt;
                    setItems(copia);
                  }}
                />
              </View>

              {/* BOTÓN - */}
              <TouchableOpacity
                style={styles.botonMenos}
                onPress={() => borrarItem(index)}
              >
                <Text style={styles.botonTexto}>–</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* BOTÓN + */}
          <TouchableOpacity style={styles.botonMas} onPress={agregarItem}>
            <Text style={styles.botonTexto}>+</Text>
          </TouchableOpacity>

          <View style={styles.formularioActions}>
            <TouchableOpacity style={[styles.button, styles.confirmar]} onPress={handleConfirmarAceptar}>
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.cancelar]} onPress={handleCancelarAceptar}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Botones aceptar/rechazar
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.button, styles.aceptar]} onPress={handleAceptarPress}>
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.rechazar]} onPress={handleRechazar}>
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Image source={{ uri: imagen }} style={styles.fullImage} resizeMode="contain" />
        </Pressable>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
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
    backgroundColor: "#ddd",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#555" },
  extraTextContainer: { flex: 1 },
  extraText: { fontSize: 16, fontWeight: "bold" },
  extraSubText: { marginTop: 4, fontSize: 14, color: "#777" },
  infoContainer: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "bold" },
  text: { marginTop: 4, fontSize: 14 },

  formularioContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  formularioTitulo: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 16 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  inputLabel: { fontSize: 13, marginBottom: 4 },

  botonMas: {
    backgroundColor: "#ff8f05ff",
    borderRadius: 8,
    paddingVertical: 10,
    marginVertical: 10,
    alignItems: "center",
  },

  botonMenos: {
    backgroundColor: "#d9534f",
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: 6,
    marginVertical: 4,
    
  },

  botonTexto: { fontSize: 20, color: "#fff" },

  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
    paddingVertical: 8,
    marginVertical: 8,
  },
  aceptar: { backgroundColor: "#ff8f05ff" },
  rechazar: { backgroundColor: "#999" },
  confirmar: { backgroundColor: "#ff8f05ff" },
  cancelar: { backgroundColor: "#999" },

  buttonText: { color: "#fff",
     fontWeight: "bold" },

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

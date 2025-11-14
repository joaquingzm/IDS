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
  ActivityIndicator,
} from "react-native";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { theme } from "../styles/theme";
import { useAlert } from "../context/AlertContext";

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
  const [tiempoEsperaLocal, setTiempoEsperaLocal] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { showAlert } = useAlert();
  const [loading, setLoading]= useState(false);



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
  // Validación: al menos un item
   if (items.length === 0) {
    showAlert("error", { message: "La oferta debe tener al menos un medicamento." });
    return;
  }

  // Validación: cada campo debe estar cargado
  for (let i = 0; i < items.length; i++) {
    const med = items[i].medicamento?.trim();
    const monto = items[i].monto?.trim();
const hayVacios = items.some(
  (i) =>
    !i.medicamento?.trim() ||
    !i.monto?.trim()
);

if (hayVacios) {
  showAlert("campos_incompletos");
  return;
}

const hayNoNumericos = items.some((i) => isNaN(Number(i.monto)));

  if (hayNoNumericos) {
    showAlert("error", { message: "Uno o más montos no son números válidos." });
    return;
  }


// Validar montos inválidos
 const hayMontosInvalidos = items.some(
    (i) => Number(i.monto) <= 0
  );

  if (hayMontosInvalidos) {
    showAlert("error", { message: "Los montos deben ser mayores a 0." });
    return;
  }

// Validar tiempo de espera

if (!tiempoEsperaLocal || isNaN(Number(tiempoEsperaLocal)) || Number(tiempoEsperaLocal) <= 0) {
  showAlert("campo_invalido", { message: "Por favor ingrese un tiempo de espera valido."});
  return;
}
  }

  const medicamentosList = items.map((i) => i.medicamento.trim());
  const montosList = items.map((i) => Number(i.monto));

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
      [CAMPOS_OFERTA.TIEMPO_ESPERA]: Number(tiempoEsperaLocal),
      [CAMPOS_OFERTA.FECHA_OFERTA]: serverTimestamp(),
      [CAMPOS_OFERTA.ESTADO]: ESTADOS_OFERTA.PENDIENTE,
    });
    
    showAlert("oferta_success")
    setMostrarFormulario(false);
  } catch (error) {
    console.error("Error al aceptar pedido:", error);
    showAlert("error", {message:"Error al enviar oferta." })
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
      showAlert("pedido_rechazado_success")
    } catch (error) {
      console.error("Error al rechazar:", error);
      showAlert("error", {message:"Error al rechazar el pedido." })
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

          <View style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>Tiempo de espera (minutos)</Text>
            <TextInput
              style={styles.textInput}
              value={tiempoEsperaLocal}
              placeholder=""
              keyboardType="numeric"
              onChangeText={setTiempoEsperaLocal}
            />
          </View>

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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
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
  paddingHorizontal: 10,
  borderRadius: 8,
  height: 40,  
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
  width: 30,
  height: 30,        
  borderRadius: 8,
  justifyContent: "center",  
  alignItems: "center",
  marginTop: 18,       
},
 botonTexto: {
  fontSize: 22,
  color: "#fff",
  lineHeight: 22,
},

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

import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Modal, Pressable, TouchableOpacity } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_OFERTA, CAMPOS_PEDIDO } from "../dbConfig";
import { deleteOferta } from "../utils/firestoreService";
import { useAlert } from "../context/AlertContext";

export default function CardPedidoPendiente({ pedido, oferta,onRechazarLocal }) {
  const [modalVisible, setModalVisible] = useState(false);

  const nombre = pedido[CAMPOS_PEDIDO.NOMBRE_USUARIO] || "No especificado";
  const apellido = pedido[CAMPOS_PEDIDO.APELLIDO_USUARIO] || "No especificado";
  const direccion = pedido[CAMPOS_PEDIDO.DIRECCION] || "No especificado";
  const obraSocial = pedido[CAMPOS_PEDIDO.OBRASOCIAL] || "No especificado";
  const fechaPedido = pedido[CAMPOS_PEDIDO.FECHA_PEDIDO]?.toDate?.() || null;
  const imagen = pedido[CAMPOS_PEDIDO.IMAGEN];
  const Farmacia_nombre = oferta?.[CAMPOS_OFERTA.NOMBRE_FARMACIA] ?? "Farmacia";
  const { showAlert } = useAlert();

  /** --------------------------
   * Normalización igual que OfertaCard
   --------------------------- */

  const handleRechazar = async () => {
    try {
      await deleteOferta(pedido.id, oferta.id);

       onRechazarLocal(oferta.id);
      showAlert("oferta_rechazada_success");
  
    } catch (error) {
      console.error("Error al rechazar:", error);
      showAlert("error", { message: "Error al rechazar la oferta." });
    }
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

  const maxLen = Math.max(medicamentosList.length, montosList.length);

  const rows = Array.from({ length: maxLen }).map((_, i) => ({
    medicamento: medicamentosList[i] ?? "—",
    montoNum: parseMonto(montosList[i]),
  }));

  const total = rows.reduce((acc, r) => acc + (Number(r.montoNum) || 0), 0);

  

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
          <Text style={styles.extraText}>🕓 Esperando aceptación del usuario</Text>
          <Text style={styles.extraSubText}>{Farmacia_nombre}</Text>
        </View>
      </View>

      {/* Info básica */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Pedido de {nombre} {apellido}</Text>
        {direccion && <Text style={styles.text}>Dirección: {direccion}</Text>}
        {obraSocial && <Text style={styles.text}>Obra social: {obraSocial}</Text>}

        {/* --- BLOQUE DE MEDICAMENTOS Y MONTOS (idéntico al de OfertaCard) --- */}
        <View style={{ marginTop: 10, marginBottom: 10 }}>
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

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {fechaPedido && (
          <Text style={styles.text}>
            Fecha del pedido: {fechaPedido.toLocaleDateString()}{" "}
            {fechaPedido.toLocaleTimeString()}
          </Text>
        )}
        <TouchableOpacity style={[styles.button]} onPress={handleRechazar}>
                <Text style={styles.buttonText}>Cancelar la oferta</Text>
        </TouchableOpacity>

      </View>

      {/* Modal para ver imagen */}
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

/** --------------------------
 * ESTILOS
 --------------------------- */
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
  placeholderText: { color: "#666" },

  extraTextContainer: { flex: 1 },
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

  infoContainer: { marginBottom: 12 },
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

  /* --- Estilos copiados de OfertaCard --- */
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

   button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
    paddingVertical: 8,
    marginVertical: 8,
    backgroundColor: "#999"
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

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../styles/theme";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { COLECCION_OFERTA, CAMPOS_Oferta } from "../dbConfig";

export default function OfertaCard({ pedido }) {
  const handleAceptar = async () => {
    try {
      // 1️⃣ Referencia al pedido actual
      const pedidoRef = doc(db, COLECCION_OFERTA, pedido.id);
      const pedidoSnapshot = await getDoc(pedidoRef);

      if (!pedidoSnapshot.exists()) {
        alert("La oferta ya no existe.");
        return;
      }

      const pedidoData = pedidoSnapshot.data();
      const userId = pedidoData[CAMPOS_Oferta.USER_ID];

      if (!userId) {
        alert("Error: la oferta no tiene un ID de usuario.");
        return;
      }

      // 2️⃣ Mover el pedido aceptado a la colección "pedidosAceptados"
      await setDoc(doc(db, "pedidosAceptados", pedido.id), pedidoData);

      // 3️⃣ Buscar todas las ofertas del mismo usuario en la colección "Oferta"
      const ofertasRef = collection(db, COLECCION_OFERTA);
      const q = query(ofertasRef, where(CAMPOS_Oferta.USER_ID, "==", userId));
      const querySnapshot = await getDocs(q);

      // 4️⃣ Borrar todas las ofertas de ese usuario
      const deletePromises = querySnapshot.docs.map((docSnap) =>
        deleteDoc(docSnap.ref)
      );
      await Promise.all(deletePromises);

      console.log("Pedido aceptado y todas las ofertas del usuario eliminadas.");
      alert("Pedido aceptado con éxito ✅");
    } catch (error) {
      console.error("Error al aceptar pedido:", error);
      alert("Error al aceptar el pedido.");
    }
  };

  return (
    <View style={styles.card}>
      {/* Info del pedido */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{pedido[CAMPOS_Oferta.MONTO]} $</Text>
        <Text style={styles.text}>
          Farmacia: {pedido[CAMPOS_Oferta.NOMBRE_FARMACIA]}
        </Text>
        <Text style={styles.text}>
          Tiempo de espera: {pedido[CAMPOS_Oferta.TIEMPO_ESPERA]} min
        </Text>
        <Text style={styles.text}>
          Fecha: {pedido[CAMPOS_Oferta.FECHA_OFERTA]}
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.aceptar]}
          onPress={handleAceptar}
        >
          <Text style={styles.buttonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
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
    width: "80%",
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
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: theme.spacing.xs,
  },
  aceptar: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { theme } from "../styles/theme";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";

export default function CardPedidoPendiente({ pedido }) {

  const handleAceptar = async () => {
    try {
      const pedidoRef = doc(db, "pedidosPendientes", pedido.id);
      const pedidoSnapshot = await getDoc(pedidoRef);

      if (pedidoSnapshot.exists()) {
        const pedidoData = pedidoSnapshot.data();

        await setDoc(doc(db, "pedidosAceptados", pedido.id), pedidoData);

        
        await deleteDoc(pedidoRef);

        console.log(" Pedido aceptado y movido correctamente");
        alert("Pedido aceptado con éxito");
      }
    } catch (error) {
      console.error("Error al aceptar pedido:", error);
      alert("Error al aceptar el pedido.");
    }
  };

  const handleRechazar = async () => {
    try {
      await deleteDoc(doc(db, "pedidosPendientes", pedido.id));
      console.log(" Pedido rechazado y eliminado");
      alert("Pedido rechazado y eliminado");
    } catch (error) {
      console.error("Error al rechazar pedido:", error);
      alert("Error al rechazar el pedido.");
    }
  };

  return (
    <View style={styles.card}>
      {pedido.imagen ? (
        <Image source={{ uri: pedido.imagen }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>Sin imagen</Text>
        </View>
      )}

      {/* Info del pedido */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{pedido.producto}</Text>
        <Text style={styles.text}>Cliente: {pedido.cliente}</Text>
        <Text style={styles.text}>Cantidad: {pedido.cantidad}</Text>
      </View>

      {/* Botones */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.aceptar]}
          onPress={handleAceptar}
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
  image: {
    width: "50%",
    height: 500,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  placeholderImage: {
    width: "100%",
    height: 160,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.sm,
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
  rechazar: {
    backgroundColor: theme.colors.destructive,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

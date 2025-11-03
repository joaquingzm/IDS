import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../styles/theme";

export default function PedidoCard() {
  // Estado del pedido
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    //CUANDO SE HAGA BIEN ESTO SE CONECTA CON FIREBASE PARA PODER PONER UN PEDIDO POSTA


    // Esto es un ejemplo para que se pueda ver con un pedido posta
    
    setTimeout(() => {
      setPedido({
        id: "1234",
        producto: "Paracetamol 500mg",
        cantidad: 2,
        estado: "En camino"
      });
    }, 1000);
    
  }, []);

  return (
    <View style={styles.card}>
      {pedido ? (
        <>
          <Text style={styles.title}>Pedido #{pedido.id}</Text>
          <Text style={styles.text}>Producto: {pedido.producto}</Text>
          <Text style={styles.text}>Cantidad: {pedido.cantidad}</Text>
          <Text style={styles.text}>Estado: {pedido.estado}</Text>
        </>
      ) : (
        <Text style={styles.noPedido}>No se tiene un pedido actual</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => alert("Funcionalidad futura")}
      >
        <Text style={styles.buttonText}>Ver detalles</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  noPedido: {
    fontSize: theme.typography.fontSize.base,
    fontStyle: "italic",
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

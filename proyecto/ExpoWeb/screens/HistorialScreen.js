import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "../styles/theme";
import PedidoCard from "../components/pedidoHistorial";
// import { db } from "../firebase"; 
// import { collection, getDocs } from "firebase/firestore"; 

export default function HistorialScreen() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // temporales 
    const pedidosMock = [
      {
        id: "001",
        producto: "Ibuprofeno 600mg",
        cantidad: 1,
        estado: "Finalizado",
        fecha: "15-09-2025",
        horario: "10:45 HS",
      },
      {
        id: "002",
        producto: "Amoxicilina 500mg",
        cantidad: 2,
        estado: "Finalizado",
        fecha: "21-09-2025",
        horario: "16:30 HS",
      },
    ];
    setPedidos(pedidosMock);

    /* 
     CUANDO CONECTamos FIREBASE, reemplazamos lo anterior por esto:

    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "historialPedidos"));
        const pedidosFirebase = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPedidos(pedidosFirebase);
      } catch (error) {
        console.error("Error al obtener los pedidos:", error);
      }
    };

    fetchPedidos();
    */
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de pedidos</Text>

      <ScrollView style={styles.scroll}>
        {pedidos.length > 0 ? (
          pedidos.map((pedido) => <PedidoCard key={pedido.id} pedido={pedido} />)
        ) : (
          <Text style={styles.noData}>No hay pedidos en el historial</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  scroll: {
    flex: 1,
  },
  noData: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.lg,
  },
});

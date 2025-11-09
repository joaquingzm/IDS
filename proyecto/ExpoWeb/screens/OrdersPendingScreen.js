import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text } from "react-native";
import { theme } from "../styles/theme";
import CardPedidoPendiente from "../components/pedidoPendienteCard";
import RappiFarma from "../assets/LogoRappiFarma.png";
// import { collection, onSnapshot } from "firebase/firestore";
// import { db } from "../firebase";

export default function OrdersPendingScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo (mock)
  const pedidosMock = [
    {
      id: "1",
      producto: "Paracetamol 500mg",
      cliente: "Juan Pérez",
      cantidad: 2,
      imagen: "https://cdn-icons-png.flaticon.com/512/2965/2965567.png",
    },
    {
      id: "2",
      producto: "Ibuprofeno 400mg",
      cliente: "María López",
      cantidad: 1,
      imagen: "https://cdn-icons-png.flaticon.com/512/3082/3082023.png",
    },
  ];

  useEffect(() => {
    //  FUTURO: Conexión Firebase
    /*
    const unsub = onSnapshot(collection(db, "pedidosPendientes"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPedidos(data);
      setLoading(false);
    });
    return () => unsub();
    */

    //  TEMPORAL: Mock data
    setTimeout(() => {
      setPedidos(pedidosMock);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Pedidos Pendientes</Text>

      {pedidos.length > 0 ? (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CardPedidoPendiente pedido={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={styles.noPedidosText}>No hay pedidos pendientes.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },

    title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPedidosText: {
    textAlign: "center",
    marginTop: theme.spacing.xl,
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.lg,
  },
});
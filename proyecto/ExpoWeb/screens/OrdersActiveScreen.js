import React, { useEffect, useState } from "react";
import {View,Text,ActivityIndicator,StyleSheet, ScrollView} from "react-native";
import { theme } from "../styles/theme";
import PedidoActivaCard from "../components/pedidoActivoCard";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db } from "../firebase";

export default function OrdersActiveScreen() {
  const [pedidos, setPedidos] = useState([]); 
  const [loading, setLoading] = useState(true);


  const pedidosMock = [
    {
      id: "P001",
      producto: "Ibuprofeno 400mg",
      cantidad: 1,
      cliente: "María González",
      direccion: "Av. Siempre Viva 742",
      estado: "Pendiente",
      imagen:
        "https://images.unsplash.com/photo-1580281657521-4a6b8d9a23b4?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "P002",
      producto: "Amoxicilina 500mg",
      cantidad: 2,
      cliente: "Joaquín Pérez",
      direccion: "Calle Falsa 123",
      estado: "Pendiente",
      imagen:
        "https://images.unsplash.com/photo-1603398938378-e54eab4466aa?auto=format&fit=crop&w=400&q=80",
    },
  ];

  useEffect(() => {
    // 🔸 En el futuro esto será un listener de Firebase
    /*
    const pedidoRef = doc(db, "pedidosActivos", "ID_DEL_PEDIDO_ACTUAL");
    const unsub = onSnapshot(pedidoRef, (snapshot) => {
      if (snapshot.exists()) {
        setPedidos([{ id: snapshot.id, ...snapshot.data() }]);
      }
      setLoading(false);
    });
    return () => unsub();
    */

    // 🔹 Simula carga del backend
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
    <ScrollView style={styles.container}>
    
      <Text style={styles.title}>Pedidos Activos</Text>
    
      {pedidos.length > 0 ? (
        pedidos.map((pedido) => (
          <PedidoActivaCard key={pedido.id} pedidoData={pedido} />
        ))
      ) : (
        <Text style={styles.noPedidoText}>No hay pedidos activos</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.lg,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPedidoText: {
    textAlign: "center",
    marginTop: theme.spacing.xl,
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.lg,
  },
    title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
  },
});

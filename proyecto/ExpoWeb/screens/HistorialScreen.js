import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { theme } from "../styles/theme";
import PedidoCard from "../components/pedidoHistorial"; 
import { db } from "../firebase"; 
import { collection, onSnapshot } from "firebase/firestore"; 
import { COLECCION_PEDIDO_HISTORIAL } from "../dbConfig"; 

export default function HistorialScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, COLECCION_PEDIDO_HISTORIAL), (snapshot) => {
      const pedidosFirebase = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPedidos(pedidosFirebase);
      setLoading(false);
    });

    return () => unsub();
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
    <Text style={styles.title}>Historial de pedidos</Text>

    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {pedidos.length > 0 ? (
        pedidos.map((pedido) => (
          <PedidoCard key={pedido.id} pedido={pedido} />
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.noData}>No hay pedidos en el historial</Text>
        </View>
      )}
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    textAlign: "center",
    marginBottom: theme.spacing.md,
    borderBottomWidth: 2,
    borderColor: theme.colors.mutedForeground,
    paddingBottom: theme.spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xl,
  },
  noData: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.lg,
    opacity: 0.8,
  },
});

import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text } from "react-native";
import { theme } from "../styles/theme";
import CardPedidoPendiente from "../components/pedidoPendienteCard";
import { listenPedidosPorEstado, listenPedidosPorEstadoYFarmacia } from "../utils/firestoreService";
import { ESTADOS_PEDIDO } from "../dbConfig";
import { auth } from "../firebase";

export default function OrdersPendingScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const farmaciaId = auth.currentUser?.uid;

  useEffect(() => {
      const unsub = listenPedidosPorEstadoYFarmacia(ESTADOS_PEDIDO.PENDIENTE, farmaciaId, (items) => {
        setPedidos(items);
        console.log("📦 Pedido creado:", pedidos);
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
    <Text style={styles.title}>Pedidos Pendientes</Text>

    {pedidos.length > 0 ? (
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CardPedidoPendiente pedido={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    ) : (
      <View style={styles.emptyContainer}>
        <Text style={styles.noPedidosText}>No hay pedidos Pendientes</Text>
      </View>
    )}
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
  listContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPedidosText: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.lg,
    marginTop: theme.spacing.lg,
    opacity: 0.8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
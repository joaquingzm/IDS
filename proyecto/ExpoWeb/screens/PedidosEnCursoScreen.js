import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text } from "react-native";
import { theme } from "../styles/theme";
import PedidoEnCursoCard from "../components/PedidoEnCursoCard";
import { listenPedidosPorEstado } from "../utils/firestoreService";
import { ESTADOS_PEDIDO } from "../dbConfig";
import { auth } from "../firebase";
import { listOfertasForPedido, listenPedidosPorEstadoYFarmacia } from "../utils/firestoreService";

export default function PedidosEnCursoScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const farmaciaId = auth.currentUser?.uid;

  useEffect(() => {
    if (!farmaciaId) {
      setPedidos([]);
      setLoading(false);
      return;
    }
  
    const unsub = listenPedidosPorEstadoYFarmacia(
      ESTADOS_PEDIDO.ACTIVO,
      farmaciaId,
      async (pedidosSnapshot) => {
        try {
          // Enriquecer cada pedido con su oferta asociada
          const pedidosEnriquecidos = await Promise.all(
            pedidosSnapshot.map(async (pedido) => {
              try {
                const ofertas = await listOfertasForPedido(pedido.id);
                const ofertaAsociada = ofertas.find(
                  (of) => of.farmaciaId === farmaciaId // o el campo correcto según tu modelo
                );
  
                return { pedido, oferta: ofertaAsociada || null };
              } catch (err) {
                console.warn("Error enriqueciendo pedido:", pedido.id, err);
                return { pedido, oferta: null };
              }
            })
          );
  
          setPedidos(pedidosEnriquecidos);
        } catch (error) {
          console.error("Error procesando pedidos pendientes:", error);
          Alert.alert("Error", "No se pudieron cargar los pedidos pendientes.");
        } finally {
          setLoading(false);
        }
      }
    );
        return () => unsub();
      }, []);

 
  const handlePedidoEliminado = (pedidoId) => {
    setPedidos((prev) => prev.filter((pedido) => pedido.id !== pedidoId));
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
  <Text style={styles.title}>Pedidos en Curso</Text>

  {pedidos.length > 0 ? (
    <View style={styles.listContainer}>
      {pedidos.map(({ pedido, oferta }) => (
        <PedidoEnCursoCard
          key={pedido.id}
          pedidoData={pedido}
          oferta={oferta}
          onPedidoEliminado={handlePedidoEliminado} // 🔹 aquí se mantiene
        />
      ))}
    </View>
  ) : (
    <View style={styles.emptyContainer}>
      <Text style={styles.noPedidoText}>No hay pedidos en curso</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPedidoText: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.lg,
    marginTop: theme.spacing.lg,
    opacity: 0.8,
  },
});



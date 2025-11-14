import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text } from "react-native";
import { theme } from "../styles/theme";
import PedidoEnCursoCard from "../components/pedidoEnCursoCard";
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
  
    const latestSnapshots = { activo: [], confirmacion: [] };

const processCombined = async () => {
  try {
    // combinar y eliminar duplicados por id
    const combinedRaw = [...latestSnapshots.activo, ...latestSnapshots.confirmacion];
    const map = new Map();
    combinedRaw.forEach((p) => map.set(p.id, p));
    const uniquePedidos = Array.from(map.values());

    // enriquecer con ofertas
    const pedidosEnriquecidos = await Promise.all(
      uniquePedidos.map(async (pedido) => {
        try {
          const ofertas = await listOfertasForPedido(pedido.id);
          const ofertaAsociada = ofertas.find((of) => of.farmaciaId === farmaciaId);
          return { pedido, oferta: ofertaAsociada || null };
        } catch (err) {
          console.warn("Error enriqueciendo pedido:", pedido.id, err);
          return { pedido, oferta: null };
        }
      })
    );

    setPedidos(pedidosEnriquecidos);
  } catch (error) {
    console.error("Error procesando pedidos combinados:", error);
    Alert.alert("Error", "No se pudieron cargar los pedidos pendientes.");
  } finally {
    setLoading(false);
  }
};

// suscripciones separadas (una para ACTIVO y otra para CONFIRMACION)
const unsubActivo = listenPedidosPorEstadoYFarmacia(
  ESTADOS_PEDIDO.ACTIVO,
  farmaciaId,
  async (pedidosSnapshot) => {
    latestSnapshots.activo = pedidosSnapshot || [];
    await processCombined();
  }
);

const unsubConfirmacion = listenPedidosPorEstadoYFarmacia(
  ESTADOS_PEDIDO.CONFIRMACION,
  farmaciaId,
  async (pedidosSnapshot) => {
    latestSnapshots.confirmacion = pedidosSnapshot || [];
    await processCombined();
  }
);

// devolvemos un unsubscribe que cancela ambas listeners
const unsub = () => {
  try { if (typeof unsubActivo === "function") unsubActivo(); } catch {}
  try { if (typeof unsubConfirmacion === "function") unsubConfirmacion(); } catch {}
};
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



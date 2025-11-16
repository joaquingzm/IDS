import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Alert } from "react-native";
import { theme } from "../styles/theme";
import PedidoEnCursoCard from "../components/PedidoEnCursoCard";
import { listenPedidosPorEstadoYFarmacia, listOfertasForPedido } from "../utils/firestoreService";
import { ESTADOS_PEDIDO } from "../dbConfig";
import { auth } from "../firebase";
import { useAlert } from "../context/AlertContext";
export default function PedidosEnCursoScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const farmaciaId = auth.currentUser?.uid;
   const { showAlert } = useAlert();

  useEffect(() => {
    if (!farmaciaId) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    // guardamos los últimos snapshots por estado y los combinamos
    const latestSnapshots = {
      activo: [],
      en_preparacion: [],
      en_camino: [],
      pendiente: [],
      confirmacion: [],
    };

    let mounted = true;

    const processCombined = async () => {
      try {
        // combinar todos los arrays y eliminar duplicados por id
        const combinedRaw = [
          ...latestSnapshots.activo,
          ...latestSnapshots.en_preparacion,
          ...latestSnapshots.en_camino,
          ...latestSnapshots.pendiente,
          ...latestSnapshots.confirmacion,
        ];

        const map = new Map();
        combinedRaw.forEach((p) => {
          if (p?.id) map.set(p.id, p);
        });
        const uniquePedidos = Array.from(map.values());

        // enriquecer con ofertas (buscar oferta de esta farmacia)
        const pedidosEnriquecidos = await Promise.all(
          uniquePedidos.map(async (pedido) => {
            try {
              const ofertas = await listOfertasForPedido(pedido.id);
              const ofertaAsociada = (ofertas || []).find((of) => of?.farmaciaId === farmaciaId);
              return { pedido, oferta: ofertaAsociada || null };
            } catch (err) {
              console.warn("Error enriqueciendo pedido:", pedido?.id, err);
               showAlert("error", { message: "Error enriqueciendo pedido." });
              return { pedido, oferta: null };
            }
          })
        );

        if (!mounted) return;
        setPedidos(pedidosEnriquecidos);
      } catch (error) {
        console.error("Error procesando pedidos combinados:", error);
        if (mounted)  showAlert("error", { message: "No se pudieron cargar los pedidos en curso." });;
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // helper para subscribirse a un estado y actualizar latestSnapshots
    const makeListener = (estadoKey, estadoConst) => {
      try {
        const unsub = listenPedidosPorEstadoYFarmacia(estadoConst, farmaciaId, async (pedidosSnapshot) => {
          latestSnapshots[estadoKey] = pedidosSnapshot || [];
          await processCombined();
        });
        return unsub;
      } catch (err) {
        console.error(`Error creando listener para ${estadoConst}:`, err);
        return null;
      }
    };

    // crear listeners para todos los estados relevantes
    const unsubscribes = [];
    unsubscribes.push(makeListener("activo", ESTADOS_PEDIDO.ACTIVO));
    unsubscribes.push(makeListener("en_preparacion", ESTADOS_PEDIDO.EN_PREPARACION));
    unsubscribes.push(makeListener("en_camino", ESTADOS_PEDIDO.EN_CAMINO));
    unsubscribes.push(makeListener("pendiente", ESTADOS_PEDIDO.PENDIENTE));
    unsubscribes.push(makeListener("confirmacion", ESTADOS_PEDIDO.CONFIRMACION));

    // cleanup
    return () => {
      mounted = false;
      unsubscribes.forEach((u) => {
        try {
          if (typeof u === "function") u();
        } catch (e) {}
      });
    };
  }, [farmaciaId]);

  const handlePedidoEliminado = (pedidoId) => {
    // pedidos es [{ pedido, oferta }, ...]
    setPedidos((prev) => prev.filter((p) => p?.pedido?.id !== pedidoId));
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
    {pedidos.length === 0 ? (
       <View style={styles.emptyContainer}>
      <Text style={styles.noPedidoText}>No hay pedidos en curso.</Text>
      </View>
    ) : (
      pedidos.map(({ pedido, oferta }) => (
        <PedidoEnCursoCard
          key={pedido.id}
          pedidoData={pedido}
          oferta={oferta}
          onPedidoEliminado={handlePedidoEliminado}
        />
      ))
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

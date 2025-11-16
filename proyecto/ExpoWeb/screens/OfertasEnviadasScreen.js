import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text, ScrollView } from "react-native";
import { theme } from "../styles/theme";
import OfertaEnviadaCard from "../components/OfertaEnviadaCard";
import { listOfertasForPedido, listenPedidosPorEstado } from "../utils/firestoreService";
import { ESTADOS_PEDIDO, CAMPOS_OFERTA } from "../dbConfig";
import { auth } from "../firebase";

export default function OfertasEnviadasScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const farmaciaId = auth.currentUser?.uid;
const eliminarOfertaLocal = (pedidoId, ofertaId) => {
  setPedidos((prev) =>
    prev.filter(
      (item) =>
        item.pedido.id !== pedidoId ||
        item.oferta.id !== ofertaId
    )
  );
};
  useEffect(() => {
    if (!farmaciaId) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    const unsub = listenPedidosPorEstado(
      ESTADOS_PEDIDO.ENTRANTE,
      async (items) => {
        try {
          const resultados = [];

          for (const pedido of items) {
            try {
              // Obtenemos todas las ofertas reales del pedido
              const ofertas = await listOfertasForPedido(pedido.id);

              // Buscamos si alguna pertenece a esta farmacia
              const ofertaAsociada = ofertas.find(
                (of) => String(of?.[CAMPOS_OFERTA.FARMACIA_ID]) === String(farmaciaId)
              );

              // Si no tiene oferta de esta farmacia → ignorar
              if (!ofertaAsociada) continue;

              // Si tiene oferta → lo agregamos
              resultados.push({ pedido, oferta: ofertaAsociada });
            } catch (err) {
              console.warn("Error procesando pedido:", pedido.id, err);
            }
          }

          setPedidos(resultados);
        } catch (error) {
          console.error("Error cargando ofertas enviadas:", error);
        } finally {
          setLoading(false);
        }
      }
    );

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
      <Text style={styles.title}>Ofertas Enviadas</Text>

      {pedidos.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {pedidos.map(({ pedido, oferta }) => (
            <OfertaEnviadaCard
              key={pedido.id}
              pedido={pedido}
              oferta={oferta}
              onRechazarLocal={(ofertaId) =>
    eliminarOfertaLocal(pedido.id, ofertaId)
          }
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.noPedidosText}>No has enviado ofertas aún</Text>
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

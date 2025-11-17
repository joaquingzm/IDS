import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { theme } from "../styles/theme";
import HistorialCard from "../components/PedidoHistorialCard";
import { auth } from "../firebase";
import { CAMPOS_PEDIDO, ESTADOS_PEDIDO, CAMPOS_OFERTA, ESTADOS_OFERTA } from "../dbConfig";
import * as firestoreService from "../utils/firestoreService";

export default function HistorialScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    setPedidos([]);
    setLoading(false);
    return;
  }

  const farmaciaId = currentUser.uid;

  let unsubRealizado = null;
  let unsubRechazado = null;

  const procesarSnapshot = async (pedidosSnapshot, acumuladorPrevio) => {
    try {
      const pedidosEnriquecidos = await Promise.all(
        pedidosSnapshot.map(async (pedido) => {
          try {
            const ofertas = await firestoreService.listOfertasForPedido(
              pedido.id
            );

            // 🔥 Merge ACEPTADA + RECHAZADA
            const ofertaGanadora = ofertas.find((of) =>
              [ESTADOS_OFERTA.ACEPTADA, ESTADOS_OFERTA.RECHAZADA].includes(
                of[CAMPOS_OFERTA.ESTADO]
              )
            );

            return { pedido, oferta: ofertaGanadora };
          } catch (err) {
            console.warn("Error enriqueciendo pedido:", pedido.id, err);
            return { pedido, oferta: null };
          }
        })
      );

      // 🔥 Mezclamos con los que ya había
      setPedidos((prev) => {
        const todos = [...(acumuladorPrevio || []), ...pedidosEnriquecidos];

        // evitamos duplicados por ID
        const unicos = [];
        const ids = new Set();

        for (let item of todos) {
          if (!ids.has(item.pedido.id)) {
            ids.add(item.pedido.id);
            unicos.push(item);
          }
        }

        return unicos;
      });
    } catch (error) {
      console.error("Error procesando pedidos:", error);
      Alert.alert("Error", "No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // 🔥 ESCUCHAR REALIZADOS
  // -------------------------
  unsubRealizado = firestoreService.listenPedidosPorEstadoYFarmacia(
    ESTADOS_PEDIDO.REALIZADO,
    farmaciaId,
    (snapRealizados) =>
      procesarSnapshot(snapRealizados, [])
  );

  // -------------------------
  // 🔥 ESCUCHAR RECHAZADOS
  // -------------------------
  unsubRechazado = firestoreService.listenPedidosPorEstadoYFarmacia(
    ESTADOS_PEDIDO.RECHAZADO,
    farmaciaId,
    (snapRechazados) =>
      procesarSnapshot(snapRechazados, pedidos)
  );

  return () => {
    unsubRealizado && unsubRealizado();
    unsubRechazado && unsubRechazado();
  };
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
          pedidos.map(({ pedido, oferta }) => (
            <HistorialCard
              key={pedido.id}
              pedido={pedido}
              oferta={oferta}
            />
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
    flexGrow: 1,
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
  noData: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.lg,
    marginTop: theme.spacing.lg,
    opacity: 0.8,
  },
});
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { theme } from "../styles/theme";
import HistorialCard from "../components/pedidoHistorialCard";
import { auth } from "../firebase";
import { CAMPOS_PEDIDO, ESTADOS_PEDIDO, CAMPOS_OFERTA, ESTADOS_OFERTA } from "../dbConfig";
import * as firestoreService from "../utils/firestoreService";

export default function HistorialScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmacia, setFarmacia] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setPedidos([]);
      setLoading(false);
      return;
    }

    const currentUserId = currentUser.uid;

    // 🔥 Nos suscribimos a los pedidos "realizados" de la farmacia actual
    const unsubscribe = firestoreService.listenPedidosPorEstadoYFarmacia(
      ESTADOS_PEDIDO.REALIZADO,
      currentUserId,
      async (pedidosSnapshot) => {
        try {
          // Enriquecer cada pedido con su oferta aceptada y datos de usuario
          const pedidosEnriquecidos = await Promise.all(
            pedidosSnapshot.map(async (pedido) => {
              try {
                const ofertas = await firestoreService.listOfertasForPedido(pedido.id);
                const ofertaGanadora = ofertas.find(
                  (of) =>
                     of[CAMPOS_OFERTA.ESTADO] === ESTADOS_OFERTA.ACEPTADA ||
                     of[CAMPOS_OFERTA.ESTADO] === ESTADOS_OFERTA.RECHAZADA
                );

                return { pedido, oferta: ofertaGanadora };
              } catch (err) {
                console.warn("Error enriqueciendo pedido:", pedido.id, err);
                return { pedido, oferta: null, usuario: null };
              }
            })
          );

          setPedidos(pedidosEnriquecidos);
        } catch (error) {
          console.error("Error procesando pedidos:", error);
          Alert.alert("Error", "No se pudieron cargar los pedidos.");
        } finally {
          setLoading(false);
        }
      }
    );

    // 🔁 Limpieza al desmontar
    return () => unsubscribe && unsubscribe();
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
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { theme } from "../styles/theme";
import PedidoUsuarioCard from "../components/PedidoCard";
import { StatusCardButton } from "../components/StatusCardButton";
import { auth } from "../firebase";
import { CAMPOS_PEDIDO, CAMPOS_OFERTA, ESTADOS_PEDIDO, ESTADOS_OFERTA } from "../dbConfig";
import firestoreService, { listenPedidosPorEstado } from "../utils/firestoreService";

export default function OfertsScreen({ navigation }) {
  const [pedidoActual, setPedidoActual] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubActivos = null;
    let unsubEntrantes = null;

    const subscribeToPedidos = async () => {
      try {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
          setPedidoActual(null);
          setLoading(false);
          return;
        }

        const handlePedidos = async (pedidos, tipo) => {

          const pedidosUser = pedidos.filter(
            (p) => p[CAMPOS_PEDIDO.USER_ID] === currentUserId
          );

          if (pedidosUser.length === 0) return;

          // Elegir el primero
          const pedido = pedidosUser[0];
          if (!pedido?.id) {
            return;
          }

          try {
            const ofertas = await firestoreService.listOfertasForPedido(pedido.id);

            const ofertaSeleccionada = ofertas.find(
              (of) => of[CAMPOS_OFERTA.ESTADO] === ESTADOS_OFERTA.ACEPTADA
            );

            let farmacia = null;
            if (ofertaSeleccionada?.farmaciaId) {
              farmacia = await firestoreService.getFarmaciaById(ofertaSeleccionada.farmaciaId);
            }

            setPedidoActual({ pedido, farmacia, ofertaSeleccionada });
          } catch (err) {
          } finally {
            setLoading(false);
          }
        };

        // 🔥 Escucha en tiempo real para ACTIVO y ENTRANTE
        unsubActivos = listenPedidosPorEstado(ESTADOS_PEDIDO.ACTIVO, (pedidos) =>
          handlePedidos(pedidos, "ACTIVO")
        );
        unsubEntrantes = listenPedidosPorEstado(ESTADOS_PEDIDO.ENTRANTE, (pedidos) =>
          handlePedidos(pedidos, "ENTRANTE")
        );
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar los pedidos en tiempo real.");
        setLoading(false);
      }
    };

    subscribeToPedidos();

    return () => {
      if (unsubActivos) unsubActivos();
      if (unsubEntrantes) unsubEntrantes();
    };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RappiFarma</Text>
        <Text style={styles.headerSubtitle}>Disponible 24/7</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Tu Pedido Actual</Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : pedidoActual ? (
          <PedidoUsuarioCard
            pedido={pedidoActual.pedido}
            oferta={pedidoActual.ofertaSeleccionada}
            farmacia={pedidoActual.farmacia}
          />
        ) : (
          <Text style={styles.noPedidoText}>No tenés pedidos activos o entrantes.</Text>
        )}

        <View style={{ height: 20 }} />

        <StatusCardButton
          iconName="time-outline"
          title="Historial de Pedidos"
          description="Revisá tus pedidos anteriores"
          targetScreen="OrderHistory"
          navigation={navigation}
        />

        <StatusCardButton
          iconName="pricetags-outline"
          title="Ofertas Hechas"
          description="Mirá tus ofertas activas"
          targetScreen="OfertsPending"
          navigation={navigation}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  headerSubtitle: {
    color: theme.colors.background,
    marginTop: 4,
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  noPedidoText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.base,
    textAlign: "center",
    marginTop: 16,
  },
});

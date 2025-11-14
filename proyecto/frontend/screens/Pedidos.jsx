import React, { useState, useEffect, useRef } from "react";
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
  const firstLoaded = useRef(false); // evita setLoading(false) prematuro

  useEffect(() => {
  let unsubActivos = null;
  let unsubEntrantes = null;
  let unsubPendientes = null;
  let unsubConfirmacion = null; // <-- nuevo

  const subscribeToPedidos = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        setPedidoActual(null);
        setLoading(false);
        return;
      }

      const handlePedidos = async (pedidos, tipo) => {
        try {
          // filtrá por user id
          const pedidosUser = pedidos.filter(
            (p) => p[CAMPOS_PEDIDO.USER_ID] === currentUserId
          );

          if (pedidosUser.length === 0) {
            console.log(`[listen ${tipo}] No pedidos para el usuario`);
            setPedidoActual(null);
            if (!firstLoaded.current) {
              setLoading(false);
              firstLoaded.current = true;
            }
            return;
          }

          // Elegimos el primer pedido (podés cambiar lógica: ordenar por fecha etc)
          const pedido = pedidosUser[0];
          if (!pedido?.id) {
            console.warn(`[listen ${tipo}] pedido sin id`);
            return;
          }

          // Obtener ofertas y farmacia relacionadas
          const ofertas = await firestoreService.listOfertasForPedido(pedido.id);
          const ofertaSeleccionada = ofertas.find(
            (of) => of[CAMPOS_OFERTA.ESTADO] === ESTADOS_OFERTA.ACEPTADA
          );

          let farmacia = null;
          if (ofertaSeleccionada?.farmaciaId) {
            farmacia = await firestoreService.getFarmaciaById(ofertaSeleccionada.farmaciaId);
          }

          // seteo el pedido actual (object con pedido, farmacia y oferta)
          setPedidoActual({ pedido, farmacia, ofertaSeleccionada });
          console.log(`[listen ${tipo}] seteado pedidoActual id=${pedido.id}`);
        } catch (err) {
          console.error("handlePedidos error:", err);
        } finally {
          if (!firstLoaded.current) {
            setLoading(false);
            firstLoaded.current = true;
          }
        }
      };

      // subscripciones en tiempo real (ahora incluye CONFIRMACION)
      unsubActivos = listenPedidosPorEstado(ESTADOS_PEDIDO.ACTIVO, (pedidos) =>
        handlePedidos(pedidos, "ACTIVO")
      );
      unsubEntrantes = listenPedidosPorEstado(ESTADOS_PEDIDO.ENTRANTE, (pedidos) =>
        handlePedidos(pedidos, "ENTRANTE")
      );
      unsubPendientes = listenPedidosPorEstado(ESTADOS_PEDIDO.PENDIENTE, (pedidos) =>
        handlePedidos(pedidos, "PENDIENTE")
      );
      unsubConfirmacion = listenPedidosPorEstado(ESTADOS_PEDIDO.CONFIRMACION, (pedidos) =>
        handlePedidos(pedidos, "CONFIRMACION")
      ); // <-- nueva suscripción
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar los pedidos en tiempo real.");
      console.error(error);
      setLoading(false);
    }
  };

  subscribeToPedidos();

  return () => {
    if (unsubActivos) unsubActivos();
    if (unsubEntrantes) unsubEntrantes();
    if (unsubPendientes) unsubPendientes();
    if (unsubConfirmacion) unsubConfirmacion(); // <-- cleanup
  };
}, []);


  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RappiFarma</Text>
        <Text style={styles.headerSubtitle}>Disponible 24/7</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Tu Pedido Actual</Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : pedidoActual ? (
          // añadí key para forzar remount cuando cambie el id
          <PedidoUsuarioCard
            key={pedidoActual.pedido.id}
            pedido={pedidoActual.pedido}
            oferta={pedidoActual.ofertaSeleccionada}
            farmacia={pedidoActual.farmacia}
          />
        ) : (
          <Text style={styles.noPedidoText}>No tenés pedidos en curso.</Text>
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

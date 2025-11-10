import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { theme } from "../styles/theme";
import PedidoUsuarioCard from "../components/PedidoCard";
import { StatusCardButton } from "../components/StatusCardButton";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { COLECCION_PEDIDO, CAMPOS_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";
import { listPedidosByUser } from "../utils/firestoreService";

export default function OfertsScreen({ navigation }) {
  const [pedidoActual, setPedidoActual] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedidoActual = async () => {
      try {
        const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
        if (!currentUserId) {
          setPedidoActual(null);
          setLoading(false);
          return;
        }

        const allPedidos = await listPedidosByUser(currentUserId);
        
        
        const pedidosActivos = allPedidos.filter(
          (p) => (p[CAMPOS_PEDIDO.ESTADO] ?? p.estado) === ESTADOS_PEDIDO.ENTRANTE
        );


        if (pedidosActivos.length === 0) {
          setPedidoActual(null);
          return;
        }

        const pedido = pedidosActivos[0];

        // 3️⃣ Enriquecer pedido con oferta y farmacia
        const ofertas = await firestoreService.listOfertasForPedido(pedido.id);
        const ofertaSeleccionada = ofertas.find(
          (of) => of[CAMPOS_OFERTA.ESTADO] === "ACEPTADA"
        );

        let farmacia = null;
        if (ofertaSeleccionada?.farmaciaId) {
          farmacia = await firestoreService.getFarmaciaById(ofertaSeleccionada.farmaciaId);
        }

        setPedidoActual({ pedido, oferta: ofertaSeleccionada, farmacia });
      
      } catch (error) {
        console.error("Error al cargar pedido actual:", error);
        Alert.alert("Error", "No se pudo cargar el pedido actual.");
      } finally {
        setLoading(false);
      }
    };

    fetchPedidoActual();
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
            oferta={pedidoActual.oferta}
            farmacia={pedidoActual.farmacia}
          />
        ) : (
          <Text style={styles.noPedidoText}>No tenés pedidos activos.</Text>
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

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { theme } from "../styles/theme";
import PedidoUsuarioCard from "../components/PedidoCard";
import { StatusCardButton } from "../components/StatusCardButton";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { COLECCION_PEDIDO_USUARIO, CAMPOS_PEDIDO_USUARIO } from "../dbConfig";

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

        const q = query(
          collection(db, COLECCION_PEDIDO_USUARIO),
          where(CAMPOS_PEDIDO_USUARIO.USER_ID, "==", currentUserId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setPedidoActual({ id: docSnap.id, ...docSnap.data() });
        } else {
          setPedidoActual(null);
        }
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
          <PedidoUsuarioCard pedido={pedidoActual} />
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

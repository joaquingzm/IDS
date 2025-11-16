// OfertasUsuarioScreen.js (modificada)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { theme } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import { CAMPOS_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";
import { listenPedidosPorEstado, listenOfertasDePedido } from "../utils/firestoreService";
import OfertaCard from "../components/OfertaCard";

export default function OfertasUsuarioScreen({ navigation }) {
  const [pedidosConOfertas, setPedidosConOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  // listeners por pedidoId
  const listenersRef = useRef({}); // { [pedidoId]: unsubscribeFn }

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userId = currentUser.uid;

    const unsubscribePedidos = listenPedidosPorEstado(
      ESTADOS_PEDIDO.ENTRANTE,
      (pedidosSnapshot = []) => {
        const pedidosUsuario = (pedidosSnapshot || []).filter(
          (p) => String(p?.[CAMPOS_PEDIDO.USER_ID]) === String(userId)
        );

        const nuevosIds = pedidosUsuario.map((p) => p.id);
        // limpiar listeners de pedidos que ya no están
        Object.keys(listenersRef.current).forEach((id) => {
          if (!nuevosIds.includes(id)) {
            listenersRef.current[id]?.();
            delete listenersRef.current[id];
            // también limpiar del estado local
            setPedidosConOfertas((prev) => prev.filter((x) => x.id !== id));
          }
        });

        // subscribir a cada pedido (solo si no tiene listener)
        pedidosUsuario.forEach((pedido) => {
          if (!listenersRef.current[pedido.id]) {
            const unsub = listenOfertasDePedido(pedido.id, (ofertas = []) => {
              // normalizar ofertas (asegurate que listenOfertasDePedido entregue array)
              const ofertasDisponibles = ofertas || [];

              setPedidosConOfertas((prev) => {
                // si no quedan ofertas -> eliminar ese pedido del listado
                if (!ofertasDisponibles || ofertasDisponibles.length === 0) {
                  return prev.filter((x) => x.id !== pedido.id);
                }

                // reemplazar/insertar
                const otros = prev.filter((x) => x.id !== pedido.id);
                return [
                  ...otros,
                  {
                    ...pedido,
                    ofertas: ofertasDisponibles,
                  },
                ];
              });
            });

            // guardar el unsubscribe si existe
            if (typeof unsub === "function") listenersRef.current[pedido.id] = unsub;
          }
        });

        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribePedidos === "function") unsubscribePedidos();
      // limpiar listeners pendientes
      Object.values(listenersRef.current).forEach((fn) => fn?.());
      listenersRef.current = {};
    };
  }, []);

  // callback cuando una oferta fue aceptada
  const handleOfertaAceptada = (pedidoId, ofertaId) => {
    // 1) desuscribir el listener de ese pedido (ya no necesitamos ofertas allí)
    try {
      if (listenersRef.current[pedidoId]) {
        listenersRef.current[pedidoId]?.();
        delete listenersRef.current[pedidoId];
      }
    } catch (e) {
      console.warn("Error desuscribiendo listener onAccepted:", e);
    }

    // 2) quitar ese pedido del listado (desaparece inmediatamente)
    setPedidosConOfertas((prev) => prev.filter((p) => p.id !== pedidoId));
  };

  const renderPedidos = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (pedidosConOfertas.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color={theme.colors.mutedForeground} />
          <Text style={styles.emptyText}>No tenés ofertas disponibles aún.</Text>
          <Text style={styles.emptySubtext}>
            Cuando una farmacia haga una oferta, aparecerá aquí.
          </Text>
        </View>
      );
    }

    return pedidosConOfertas.map((pedido) => (
      <View key={pedido.id} style={styles.pedidoContainer}>
        <Text style={styles.pedidoTitle}>
          Pedido del{" "}
          {pedido.fechaPedido?.toDate?.()?.toLocaleDateString?.() ||
            pedido.fechaPedido ||
            "Fecha no disponible"}
        </Text>

        {pedido.ofertas.map((oferta) => (
          <OfertaCard
            key={oferta.id}
            oferta={oferta}
            pedidoId={pedido.id}
            pedidoData={pedido}
            onAccepted={handleOfertaAceptada} // <-- aquí pasamos la callback
          />
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Ofertas</Text>
      </View>

      <ScrollView style={styles.content}>{renderPedidos()}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: theme.spacing.md, paddingHorizontal: theme.spacing.md, flexDirection: "row", alignItems: "center" },
  backButton: { padding: 8, marginRight: theme.spacing.md },
  headerTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.background },
  content: { padding: theme.spacing.md },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { textAlign: "center", color: theme.colors.mutedForeground, marginTop: 16, fontSize: 18, fontWeight: "600" },
  emptySubtext: { textAlign: "center", color: theme.colors.mutedForeground, marginTop: 8, fontSize: 14 },
  pedidoContainer: { marginBottom: theme.spacing.lg, padding: theme.spacing.md, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg },
  pedidoTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.foreground, marginBottom: 4 },
});

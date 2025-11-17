// OrderHistoryScreen.js (real-time)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { theme } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import HistorialCard from "../components/PedidoHistorialCard";
import firestoreService from "../utils/firestoreService";
import {
  CAMPOS_PEDIDO,
  CAMPOS_OFERTA,
  ESTADOS_PEDIDO,
  ESTADOS_OFERTA,
} from "../dbConfig";

/**
 * OrderHistoryScreen (real-time)
 * - Escucha pedidos en tiempo real para estados REALIZADO y RECHAZADO
 * - Filtra por usuario actual
 * - Enriquecer cada pedido con la oferta ganadora (estado ACEPTADA) y la farmacia asociada
 * - Ordena por fechaPedido descendente
 */

export default function OrderHistoryScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]); // array de { pedido, oferta, farmacia }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubRealizado = null;
    let unsubRechazado = null;

    const safeGetTime = (pedido) => {
      const f = pedido?.[CAMPOS_PEDIDO.FECHA_PEDIDO] ?? pedido?.fechaPedido ?? null;
      if (!f) return 0;
      try {
        if (typeof f.toDate === "function") return f.toDate().getTime();
        if (typeof f.seconds === "number") return f.seconds * 1000;
        const parsed = Date.parse(String(f));
        return isNaN(parsed) ? 0 : parsed;
      } catch {
        return 0;
      }
    };

    const handleSnapshot = async (items = []) => {
      try {
        if (!mounted) return;
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) {
          setPedidos([]);
          setLoading(false);
          return;
        }

        // Filtrar pedidos que sean del usuario actual
        const pedidosUsuario = (items || []).filter(
          (p) =>
            String(p?.[CAMPOS_PEDIDO.USER_ID] ?? p?.userId ?? "") ===
            String(currentUserId)
        );

        if (pedidosUsuario.length === 0) {
          // si no hay pedidos en este snapshot, actualizar estado combinando con los otros snapshots
          // simplemente devolvemos (los dos listeners eventualmente llamarán a esta función)
          // Pero para evitar que quede loader pegado, ajustamos loading
          setPedidos((prev) => {
            // si prev ya tiene datos (de la otra subscripción), no los borramos aquí
            // en cambio, si no hay prev, lo seteamos vacío
            return prev.length ? prev : [];
          });
          setLoading(false);
          return;
        }

        // Enriquecer cada pedido con oferta ganadora + farmacia
        const enriched = await Promise.all(
          pedidosUsuario.map(async (pedido) => {
            try {
              const ofertas = await firestoreService.listOfertasForPedido(pedido.id);
              const ofertaGanadora =
                (ofertas || []).find((of) => {
                  const estadoOferta = (of?.[CAMPOS_OFERTA.ESTADO] ?? of?.estado ?? "")
                    .toString();
                  return estadoOferta === ESTADOS_OFERTA.ACEPTADA;
                }) ?? null;

              let farmacia = null;
              const farmId =
                ofertaGanadora?.[CAMPOS_OFERTA.FARMACIA_ID] ?? ofertaGanadora?.farmaciaId;
              if (farmId) {
                try {
                  farmacia = await firestoreService.getFarmaciaById(farmId);
                } catch (err) {
                  console.warn("No se pudo obtener farmacia para oferta ganadora:", err);
                  farmacia = null;
                }
              }

              return { pedido, oferta: ofertaGanadora, farmacia };
            } catch (err) {
              console.warn("Error al enriquecer pedido:", pedido.id, err);
              return { pedido, oferta: null, farmacia: null };
            }
          })
        );

        // Merge: combinamos enriched con lo que ya teníamos (puede que el otro listener también aporte)
        setPedidos((prev) => {
          // construir un map por id para mergear y evitar duplicados
          const map = new Map();
          (prev || []).forEach((e) => {
            if (e?.pedido?.id) map.set(e.pedido.id, e);
          });
          (enriched || []).forEach((e) => {
            if (e?.pedido?.id) map.set(e.pedido.id, e);
          });

          // convertir a array y ordenar por fechaPedido desc
          const merged = Array.from(map.values());
          merged.sort((a, b) => safeGetTime(b.pedido) - safeGetTime(a.pedido));
          return merged;
        });

        if (mounted) setLoading(false);
      } catch (err) {
        console.error("handleSnapshot error:", err);
        if (mounted) {
          setLoading(false);
          Alert.alert("Error", "Ocurrió un error al cargar pedidos del historial.");
        }
      }
    };

    try {
      unsubRealizado = firestoreService.listenPedidosPorEstado(
        ESTADOS_PEDIDO.REALIZADO,
        (items) => {
          // cuando cambian los pedidos en REALIZADO, los procesamos
          handleSnapshot(items);
        }
      );
    } catch (err) {
      console.warn("listen REALIZADO falló:", err);
    }

    try {
      unsubRechazado = firestoreService.listenPedidosPorEstado(
        ESTADOS_PEDIDO.RECHAZADO,
        (items) => {
          // cuando cambian los pedidos en RECHAZADO, los procesamos
          handleSnapshot(items);
        }
      );
    } catch (err) {
      console.warn("listen RECHAZADO falló:", err);
    }

    // Si ambos listeners no se pudieron crear (por ejemplo por error), caemos a una carga one-shot
    const fallbackIfNoListeners = async () => {
      if (!unsubRealizado && !unsubRechazado) {
        // fallback: cargar via listPedidosByUser como antes
        try {
          const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
          if (!currentUserId) {
            setPedidos([]);
            setLoading(false);
            return;
          }
          const all = await firestoreService.listPedidosByUser(currentUserId);
          const filtered = (all || []).filter((p) => {
            const estado = (p?.[CAMPOS_PEDIDO.ESTADO] ?? p?.estado ?? "").toString();
            return estado === ESTADOS_PEDIDO.REALIZADO || estado === ESTADOS_PEDIDO.RECHAZADO;
          });
          // enriquecer y setear (reutilizamos handleSnapshot logic)
          await handleSnapshot(filtered);
        } catch (e) {
          console.error("fallback load error:", e);
          setLoading(false);
        }
      }
    };

    fallbackIfNoListeners();

    return () => {
      mounted = false;
      try {
        if (typeof unsubRealizado === "function") unsubRealizado();
      } catch (e) {}
      try {
        if (typeof unsubRechazado === "function") unsubRechazado();
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderPedidos = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (pedidos.length > 0) {
      return pedidos.map(({ pedido, oferta, farmacia }) => (
        <HistorialCard key={pedido.id} pedido={pedido} oferta={oferta} farmacia={farmacia} />
      ));
    } else {
      return (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Ionicons name="document-text-outline" size={40} color={theme.colors.mutedForeground} />
          <Text style={styles.emptyText}>No tienes pedidos en tu historial</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
      </View>

      <ScrollView style={styles.content}>{renderPedidos()}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#dbeafe",
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  alertText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: "#1e40af",
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.mutedForeground,
    marginTop: 40,
    fontSize: 16,
  },
});

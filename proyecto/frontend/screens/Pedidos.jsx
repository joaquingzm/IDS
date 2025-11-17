// OfertsScreen.js (filtrada a ENTRANTE, EN_PREPARACION, EN_CAMINO, CONFIRMACION)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { theme } from "../styles/theme";
import PedidoUsuarioCard from "../components/PedidoCard";
import { StatusCardButton } from "../components/StatusCardButton";
import { auth } from "../firebase";
import {
  CAMPOS_PEDIDO,
  CAMPOS_OFERTA,
  ESTADOS_PEDIDO,
  ESTADOS_OFERTA,
} from "../dbConfig";
import firestoreService, { listenPedidosPorEstado } from "../utils/firestoreService";

/**
 * OfertsScreen (modificada - corrección de race conditions entre múltiples listeners)
 *
 * Ideas principales:
 * - Mantenemos un mapa pedidosPorEstadoRef.current = { [estado]: [...pedidos] }
 * - Cada listener actualiza su entrada y luego recombinamos todas las entradas
 *   para decidir cuál es "el pedido actual" del usuario (filtrado por userId y ordenado por fecha)
 * - Solo llamamos a handlePedidos con la lista FUSIONADA. Así ningún listener "vacío"
 *   borra el pedido mostrado si otro estado todavía tiene datos.
 */

export default function OfertsScreen({ navigation }) {
  const [pedidoActual, setPedidoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstLoaded = useRef(false); // evita setLoading(false) prematuro

  // ref para el unsubscriber de ofertas y para el polling interval
  const ofertasUnsubRef = useRef(null);
  const ofertasPollingRef = useRef(null);

  // mapa local con arrays por estado, evita sobrescrituras inconsistentes
  const pedidosPorEstadoRef = useRef({
    [ESTADOS_PEDIDO.ENTRANTE]: [],
    [ESTADOS_PEDIDO.EN_PREPARACION]: [],
    [ESTADOS_PEDIDO.EN_CAMINO]: [],
    [ESTADOS_PEDIDO.CONFIRMACION]: [],
  });

  // helper: normalizar snapshot/array/obj
  const normalizeSnapshotOrArray = (maybe) => {
    if (!maybe) return [];
    if (typeof maybe?.docs !== "undefined" && Array.isArray(maybe.docs)) {
      return maybe.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    if (typeof maybe?.size === "number" && Array.isArray(maybe.docs)) {
      return maybe.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    if (Array.isArray(maybe)) return maybe;
    if (typeof maybe === "object") {
      try {
        return Object.keys(maybe).map((k) => ({ id: k, ...maybe[k] }));
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // util: obtener timestamp numérico (ms) seguro para ordenar
  const getFechaMillis = (pedido) => {
    const f = pedido?.[CAMPOS_PEDIDO.FECHA_PEDIDO];
    if (!f) return 0;
    try {
      if (typeof f?.toDate === "function") return f.toDate().getTime();
      if (typeof f.seconds === "number") return f.seconds * 1000;
      const parsed = Date.parse(String(f));
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  // Maneja la lista combinada de pedidos (ya filtrada por userId dentro)
  const handlePedidos = async (pedidos, tipo = "MERGED") => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      // pedidos viene ya como array plano; filtramos por userId
      const pedidosUser = (pedidos || []).filter(
        (p) =>
          String(p?.[CAMPOS_PEDIDO.USER_ID] ?? p?.userId ?? "") ===
          String(currentUserId)
      );

      if (pedidosUser.length === 0) {
        console.log(`[listen ${tipo}] No pedidos para el usuario (merged)`);
        // Si ninguno, ponemos null
        setPedidoActual(null);
        if (!firstLoaded.current) {
          setLoading(false);
          firstLoaded.current = true;
        }
        return;
      }

      // ordenamos por fechaPedido (desc) y elegimos el primero
      pedidosUser.sort((a, b) => getFechaMillis(b) - getFechaMillis(a));
      const pedido = pedidosUser[0];

      if (!pedido?.id) {
        console.warn(`[listen ${tipo}] pedido sin id`);
        return;
      }

      // Obtener ofertas iniciales
      const ofertasPedido = await firestoreService.listOfertasForPedido(pedido.id);
      const ofertasArr = normalizeSnapshotOrArray(ofertasPedido);

      const ofertaSeleccionada = (ofertasArr || []).find(
        (of) => of?.[CAMPOS_OFERTA.ESTADO] === ESTADOS_OFERTA.ACEPTADA
      );

      let farmacia = null;
      if (ofertaSeleccionada?.farmaciaId) {
        farmacia = await firestoreService.getFarmaciaById(
          ofertaSeleccionada.farmaciaId
        );
      }

      // setEAR pedidoActual con ofertas iniciales (objeto completo)
      setPedidoActual({
        pedido,
        farmacia,
        ofertaSeleccionada,
        ofertas: ofertasArr || [],
      });

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

  useEffect(() => {
    let unsubEntrantes = null;
    let unsubEnPreparacion = null;
    let unsubEnCamino = null;
    let unsubConfirmacion = null;
    let mounted = true;

    const recomputeAndHandle = async (trigger) => {
      if (!mounted) return;
      // combinar todas las porciones en una sola lista
      const all = Object.values(pedidosPorEstadoRef.current).flat();
      await handlePedidos(all, `MERGED:${trigger}`);
    };

    const subscribeToPedidos = () => {
      try {
        unsubEntrantes = listenPedidosPorEstado(
          ESTADOS_PEDIDO.ENTRANTE,
          (pedidosSnapOrArray) => {
            const arr = normalizeSnapshotOrArray(pedidosSnapOrArray);
            pedidosPorEstadoRef.current[ESTADOS_PEDIDO.ENTRANTE] = arr;
            recomputeAndHandle(ESTADOS_PEDIDO.ENTRANTE);
          }
        );

        unsubEnPreparacion = listenPedidosPorEstado(
          ESTADOS_PEDIDO.EN_PREPARACION,
          (pedidosSnapOrArray) => {
            const arr = normalizeSnapshotOrArray(pedidosSnapOrArray);
            pedidosPorEstadoRef.current[ESTADOS_PEDIDO.EN_PREPARACION] = arr;
            recomputeAndHandle(ESTADOS_PEDIDO.EN_PREPARACION);
          }
        );

        unsubEnCamino = listenPedidosPorEstado(
          ESTADOS_PEDIDO.EN_CAMINO,
          (pedidosSnapOrArray) => {
            const arr = normalizeSnapshotOrArray(pedidosSnapOrArray);
            pedidosPorEstadoRef.current[ESTADOS_PEDIDO.EN_CAMINO] = arr;
            recomputeAndHandle(ESTADOS_PEDIDO.EN_CAMINO);
          }
        );

        unsubConfirmacion = listenPedidosPorEstado(
          ESTADOS_PEDIDO.CONFIRMACION,
          (pedidosSnapOrArray) => {
            const arr = normalizeSnapshotOrArray(pedidosSnapOrArray);
            pedidosPorEstadoRef.current[ESTADOS_PEDIDO.CONFIRMACION] = arr;
            recomputeAndHandle(ESTADOS_PEDIDO.CONFIRMACION);
          }
        );
      } catch (error) {
        console.error(error);
        if (mounted) {
          Alert.alert("Error", "No se pudo cargar los pedidos en tiempo real.");
          setLoading(false);
        }
      }
    };

    subscribeToPedidos();

    return () => {
      mounted = false;
      try { if (typeof unsubEntrantes === "function") unsubEntrantes(); } catch {}
      try { if (typeof unsubEnPreparacion === "function") unsubEnPreparacion(); } catch {}
      try { if (typeof unsubEnCamino === "function") unsubEnCamino(); } catch {}
      try { if (typeof unsubConfirmacion === "function") unsubConfirmacion(); } catch {}

      // limpiar ofertas listener/polling si quedaron
      try { if (typeof ofertasUnsubRef.current === "function") ofertasUnsubRef.current(); } catch {}
      try { if (ofertasPollingRef.current) clearInterval(ofertasPollingRef.current); } catch {}
    };
  }, []);

  /**
   * Cuando cambia el pedidoActual, suscribirse a las ofertas de ese pedido
   * (o usar polling si no hay función de listener en firestoreService)
   */
  useEffect(() => {
    // limpiar subs previas
    try { if (typeof ofertasUnsubRef.current === "function") ofertasUnsubRef.current(); } catch {}
    try { if (ofertasPollingRef.current) { clearInterval(ofertasPollingRef.current); ofertasPollingRef.current = null; } } catch {}

    const pedidoId = pedidoActual?.pedido?.id;
    if (!pedidoId) {
      // nada que escuchar
      return;
    }

    let mounted = true;

    // handler reutilizable para actualizar el state (ahora evita crear placeholders)
    const handleOfertasUpdate = async (rawOfertas) => {
      try {
        if (!mounted) return;
        const ofertasArr = normalizeSnapshotOrArray(rawOfertas);

        const ofertaSeleccionada = (ofertasArr || []).find(
          (of) => of?.[CAMPOS_OFERTA.ESTADO] === ESTADOS_OFERTA.ACEPTADA
        );

        let farmacia = pedidoActual?.farmacia ?? null;
        if (ofertaSeleccionada?.farmaciaId) {
          farmacia = await firestoreService.getFarmaciaById(ofertaSeleccionada.farmaciaId);
        }

        // Actualizar pedidoActual solo si el pedidoActual corresponde al mismo pedidoId
        setPedidoActual((prev) => {
          if (!prev || prev.pedido?.id !== pedidoId) {
            // Si prev no corresponde (por ejemplo ya cambió), no creamos un placeholder:
            return prev;
          }
          return {
            ...prev,
            ofertaSeleccionada,
            ofertas: ofertasArr,
            farmacia,
          };
        });
      } catch (e) {
        console.error("handleOfertasUpdate error", e);
      }
    };

    // --- Si existe listener en firestoreService lo usamos ---
    if (typeof firestoreService.listenOfertasForPedido === "function") {
      try {
        const unsub = firestoreService.listenOfertasForPedido(pedidoId, (snapOrArray) => {
          handleOfertasUpdate(snapOrArray);
        });
        ofertasUnsubRef.current = typeof unsub === "function" ? unsub : null;
        console.log("Subscribed to ofertas for pedido", pedidoId);
      } catch (e) {
        console.warn("listenOfertasForPedido falló, usaremos polling:", e);
      }
    }

    // --- Fallback: polling cada 2500ms (si no hay listener) ---
    if (!ofertasUnsubRef.current) {
      (async () => {
        try {
          // primera carga inmediata
          const initial = await firestoreService.listOfertasForPedido(pedidoId);
          await handleOfertasUpdate(initial);
        } catch (e) {
          console.error("error loading initial ofertas (polling fallback)", e);
        }

        ofertasPollingRef.current = setInterval(async () => {
          try {
            const newest = await firestoreService.listOfertasForPedido(pedidoId);
            await handleOfertasUpdate(newest);
          } catch (e) {
            console.error("polling ofertas error", e);
          }
        }, 2500); // 2.5s; podés ajustar
      })();
    }

    return () => {
      mounted = false;
      try { if (typeof ofertasUnsubRef.current === "function") ofertasUnsubRef.current(); ofertasUnsubRef.current = null; } catch {}
      try { if (ofertasPollingRef.current) { clearInterval(ofertasPollingRef.current); ofertasPollingRef.current = null; } } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoActual?.pedido?.id]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
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
          <PedidoUsuarioCard
            key={pedidoActual.pedido.id}
            pedido={pedidoActual.pedido}
            oferta={pedidoActual.ofertaSeleccionada}
            ofertas={pedidoActual.ofertas}
            farmacia={pedidoActual.farmacia}
          />
        ) : (
          <Text style={styles.noPedidoText}>No tenés pedidos en curso.</Text>
        )}

        <View style={{ height: 20 }} />
        
        <StatusCardButton
          iconName="pricetags-outline"
          title="Ofertas Hechas"
          description="Mirá tus ofertas activas"
          targetScreen="OfertsPending"
          navigation={navigation}
        />
        <StatusCardButton
          iconName="time-outline"
          title="Historial de Pedidos"
          description="Revisá tus pedidos anteriores"
          targetScreen="OrderHistory"
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

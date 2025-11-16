import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text, Modal } from "react-native";
import { theme } from "../styles/theme";
import PedidoDisponibleCard from "../components/PedidoDisponibleCard";
import { listenPedidosPorEstado, listOfertasForPedido, getFarmaciaById } from "../utils/firestoreService";
import {
  ESTADOS_PEDIDO,
  CAMPOS_FARMACIA,
  CAMPOS_PEDIDO,
  CAMPOS_OFERTA
} from "../dbConfig"
import { auth } from "../firebase";
import { useAlert } from "../context/AlertContext";

export default function PedidosDisponiblesScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [farmacia, setFarmacia] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const [loading2, setLoading2]= useState(false);
  // ref para guardar listeners por pedidoId
  // cada entry: { unsub?: fn, pollId?: number }
  const offerListenersRef = useRef({});

  // meta/cache por pedido para evitar setPedidos innecesarios
  // cada entry: { pedidoHash: string, ofertasLen: number, yaOferto: boolean, noOfertaronKey: string }
  const pedidosMetaRef = useRef({});

  // para asegurar que solo hacemos setLoading(false) una vez (primer snapshot)
  const firstLoadedRef = useRef(false);

  // ---------------- helpers ----------------
  const stableStringify = (obj) => {
    // stringify estable ordenando keys recursivamente
    const _stable = (o) => {
      if (o === null || typeof o !== "object") return o;
      if (Array.isArray(o)) return o.map(_stable);
      const keys = Object.keys(o).sort();
      const res = {};
      for (const k of keys) res[k] = _stable(o[k]);
      return res;
    };
    try {
      return JSON.stringify(_stable(obj));
    } catch (e) {
      return String(obj);
    }
  };

  // helper: limpiar listener y meta
  const clearListenerForPedido = (pedidoId) => {
    const entry = offerListenersRef.current[pedidoId];
    if (entry) {
      try {
        if (typeof entry.unsub === "function") entry.unsub();
      } catch (e) {
        console.warn("Error calling unsub:", e);
      }
      try {
        if (entry.pollId) clearInterval(entry.pollId);
      } catch (e) {
        /* ignore */
      }
      delete offerListenersRef.current[pedidoId];
    }
    // limpiar meta cache
    if (pedidosMetaRef.current[pedidoId]) {
      delete pedidosMetaRef.current[pedidoId];
    }
  };

  // handler que procesa ofertas (común) — ahora con cache para evitar setPedidos inútiles
  const processOffersForPedido = (p, ofertasArray) => {
    try {
      setLoading2(true);
      const pedidoId = p.id;
      if (!pedidoId) return;

      const farmaciaId = String(farmacia?.id ?? "");

      const noOfertaron =
        Array.isArray(p?.[CAMPOS_PEDIDO.FARMACIAS_NO_OFERTARON])
          ? p[CAMPOS_PEDIDO.FARMACIAS_NO_OFERTARON].map(String)
          : [];

      // Si la farmacia marcó "no ofertar", eliminarlo si estaba
      if (noOfertaron.includes(farmaciaId)) {
        // sólo setear si estaba presente
        setPedidos((prev) => {
          if (!prev.some((x) => x.id === pedidoId)) return prev;
          const next = prev.filter((x) => x.id !== pedidoId);
          // limpiar meta
          if (pedidosMetaRef.current[pedidoId]) delete pedidosMetaRef.current[pedidoId];
          return next;
        });
        return;
      }

      const yaOferto = Array.isArray(ofertasArray)
        ? ofertasArray.some((of) => String(of?.[CAMPOS_OFERTA.FARMACIA_ID]) === farmaciaId)
        : false;

      if (yaOferto) {
        // si ya ofertó, eliminarlo de la lista (si estaba)
        setPedidos((prev) => {
          if (!prev.some((x) => x.id === pedidoId)) return prev;
          const next = prev.filter((x) => x.id !== pedidoId);
          if (pedidosMetaRef.current[pedidoId]) delete pedidosMetaRef.current[pedidoId];
          return next;
        });
        return;
      }

      // --- comparar meta para ver si realmente cambió ---
      const pedidoHash = stableStringify(p);
      const ofertasLen = Array.isArray(ofertasArray) ? ofertasArray.length : 0;
      const noOfertaronKey = noOfertaron.join("|");
      const yaOfertoKey = yaOferto ? "1" : "0";

      const prevMeta = pedidosMetaRef.current[pedidoId];

      const sameAsPrev =
        prevMeta &&
        prevMeta.pedidoHash === pedidoHash &&
        prevMeta.ofertasLen === ofertasLen &&
        prevMeta.noOfertaronKey === noOfertaronKey &&
        prevMeta.yaOfertoKey === yaOfertoKey;

      if (sameAsPrev) {
        // no hubo cambio significativo -> evitamos setPedidos para reducir re-renders
        return;
      }

      // actualizar meta
      pedidosMetaRef.current[pedidoId] = {
        pedidoHash,
        ofertasLen,
        noOfertaronKey,
        yaOfertoKey,
      };

      // Pasa los filtros → agregar/actualizar
      setPedidos((prev) => {
        // si ya está, reemplazar la versión anterior (mantener inmutabilidad)
        const otros = prev.filter((x) => x.id !== pedidoId);
        // Agregamos p (podés normalizar campos si necesitás)
        // Para mantener orden estable: añadimos al final (podés ordenar por fecha si preferís)
          setLoading2(false);
        return [...otros, p];
      });
    } catch (err) {
      setLoading2(false);
      showAlert("error", { message: "Error procesando ofertas para pedido." });
      console.error("Error procesando ofertas para pedido:", err);
    }
  };

  // ---------------- Fetch farmacia ----------------
  useEffect(() => {
      setLoading2(true);
    let isMounted = true;

    const fetchFarmacia = async (uid) => {
      try {
        const data = await getFarmaciaById(uid);
        const nombre =
          data?.[CAMPOS_FARMACIA.NOMBRE] ??
          data?.nombre ??
          data?.nombre_farmacia ??
          data?.nombreDeFarmacia ??
          data?.name ??
          null;

        const farmaciaNormalizada = data
          ? {
              id: data.id ?? uid,
              [CAMPOS_FARMACIA.NOMBRE]: nombre ?? "Farmacia desconocida",
              ...data,
            }
          : {
              id: uid ?? "unknown",
              [CAMPOS_FARMACIA.NOMBRE]: "Farmacia desconocida",
            };

        if (isMounted) setFarmacia(farmaciaNormalizada);
      } catch (err) {
        showAlert("error", { message: "Error al obtener la farmacia." });
        console.error("Error al obtener la farmacia:", err);
        if (isMounted) {
          setFarmacia({
            [CAMPOS_FARMACIA.NOMBRE]: "Farmacia desconocida",
          });
        }
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (isMounted) setFarmacia(null);
        return;
      }
      fetchFarmacia(user.uid);
    });

    return () => {
        setLoading2(false);
      isMounted = false;
      if (typeof unsubscribeAuth === "function") unsubscribeAuth();
    };
  }, []);

  // ---------------- Effect principal: escuchar pedidos ENTRANTE ----------------
  useEffect(() => {
      setLoading2(true);
    if (!farmacia?.id) {
      // si no hay farmacia (por ejemplo logout) limpiamos y salimos
      setPedidos([]);
      setLoading(false);
      return;
    }

    const farmaciaId = String(farmacia.id);

    // subscribe a pedidos
    const unsubPedidos = listenPedidosPorEstado(ESTADOS_PEDIDO.ENTRANTE, async (items = []) => {
      try {
          setLoading2(true);
        // asegurar que items sea array (normalización mínima)
        const listaPedidos = Array.isArray(items) ? items : [];

        // ids actuales en snapshot
        const snapshotIds = listaPedidos.map((p) => p.id);

        // limpiar listeners de pedidos que ya no están en snapshot
        Object.keys(offerListenersRef.current).forEach((id) => {
          if (!snapshotIds.includes(id)) {
            clearListenerForPedido(id);
            // también eliminar del estado visual (si estaba)
            setPedidos((prev) => prev.filter((x) => x.id !== id));
          }
        });

        // para cada pedido del snapshot, asegurarse que tenemos listener
        for (const p of listaPedidos) {
          const pedidoId = p.id;
          if (!pedidoId) continue;

          // si ya tenemos listener, no lo re-creamos
          if (offerListenersRef.current[pedidoId]) {
            continue;
          }

          // intentamos registrar listener con listOfertasForPedido
          try {
            const maybeUnsub = listOfertasForPedido(pedidoId, (ofertasRealtime = []) => {
              const ofertasArr = Array.isArray(ofertasRealtime) ? ofertasRealtime : [];
              processOffersForPedido(p, ofertasArr);
            });

            // si devuelve una función -> ok, es un unsub (realtime)
            if (typeof maybeUnsub === "function") {
              offerListenersRef.current[pedidoId] = { unsub: maybeUnsub };
            } else if (maybeUnsub && typeof maybeUnsub.then === "function") {
              // si devolvió una Promise -> no es listener, es un one-shot: usamos polling fallback
              try {
                // primera carga inmediata
                const initial = await maybeUnsub;
                const ofertasArr = Array.isArray(initial) ? initial : [];
                processOffersForPedido(p, ofertasArr);
              } catch (err) {
                console.error("Error obteniendo ofertas inicial (one-shot):", err);
              }

              // iniciar polling cada 5s (reduzco frecuencia)
              const pollId = setInterval(async () => {
                try {
                  const newest = await listOfertasForPedido(pedidoId);
                  const ofertasArr = Array.isArray(newest) ? newest : [];
                  processOffersForPedido(p, ofertasArr);
                } catch (err) {
                  console.error("Error en polling de ofertas:", err);
                }
              }, 5000);

              offerListenersRef.current[pedidoId] = { pollId };
            } else {
              // si no devolvió nada reconocible, intentamos tratarlo como Promise vía llamada aparte
              try {
                const maybeArray = await listOfertasForPedido(pedidoId);
                const ofertasArr = Array.isArray(maybeArray) ? maybeArray : [];
                processOffersForPedido(p, ofertasArr);

                const pollId = setInterval(async () => {
                  try {
                    const newest = await listOfertasForPedido(pedidoId);
                    const ofertasArr2 = Array.isArray(newest) ? newest : [];
                    processOffersForPedido(p, ofertasArr2);
                  } catch (err) {  
                    setLoading2(false);
                    console.error("Error polling fallback:", err);
                  }
                }, 5000);

                offerListenersRef.current[pedidoId] = { pollId };
              } catch (err) {
                  setLoading2(false);
                console.error("listOfertasForPedido no devolvió unsub ni Promise:", err);
              }
            }
          } catch (err) {
              setLoading2(false);
            console.error("Error registrando listener de ofertas:", err);
          }
        }

        // Si nunca habíamos marcado firstLoaded, ahora lo hacemos (evita loader infinito)
        if (!firstLoadedRef.current) {
          firstLoadedRef.current = true;
          setLoading(false);
        }
      } catch (err) {
          setLoading2(false);
        console.error("Error en snapshot de pedidos ENTRANTE:", err);
        // asegurar que el loader no quede pegado si hay error
        if (!firstLoadedRef.current) {
          firstLoadedRef.current = true;
          setLoading(false);
          setLoading2(false);
        }
      }
    });

    // cleanup general del effect
    return () => {
      try {
          setLoading2(true);
        if (typeof unsubPedidos === "function") unsubPedidos();
      } catch (e) {}
      // limpiar todos los listeners de ofertas y metas
        setLoading2(false);
      Object.keys(offerListenersRef.current).forEach((id) => clearListenerForPedido(id));
      offerListenersRef.current = {};
      pedidosMetaRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmacia]);

  // Si loading -> mostrar loader
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos disponibles</Text>

      <Modal
          visible={loading}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          >
          <View style={styles.overlay}>
          {/* 🔹 Spinner de carga */}
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
          </Modal>

      {pedidos.length > 0 ? (
        <FlatList
          data={pedidos}
          // clave estable: preferir id; si no, usar index como fallback
          keyExtractor={(item, index) => item.id ?? item.docId ?? String(index)}
          renderItem={({ item }) => (
            <PedidoDisponibleCard
              pedido={item}
              farmacia={
                farmacia || { [CAMPOS_FARMACIA.NOMBRE]: "Farmacia desconocida" }
              }
              monto={item.monto ?? null}
              medicamento={item.medicamento ?? []}
              tiempoEspera={item.tiempoEspera ?? null}
              ocr={item.ocr ?? null}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.noPedidosText}>No hay pedidos disponibles</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
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

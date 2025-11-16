import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text } from "react-native";
import { theme } from "../styles/theme";
import PedidoDisponibleCard from "../components/pedidoDisponibleCard";
import { listenPedidosPorEstado, listOfertasForPedido, getFarmaciaById } from "../utils/firestoreService";
import {
  ESTADOS_PEDIDO,
  CAMPOS_FARMACIA,
  CAMPOS_PEDIDO,
  CAMPOS_OFERTA
} from "../dbConfig"
import { auth } from "../firebase";

export default function PedidosDisponiblesScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [farmacia, setFarmacia] = useState(null);
  const [loading, setLoading] = useState(true);

  // ref para guardar listeners por pedidoId
  // cada entry: { unsub?: fn, pollId?: number }
  const offerListenersRef = useRef({});

  // para asegurar que solo hacemos setLoading(false) una vez (primer snapshot)
  const firstLoadedRef = useRef(false);

  // Obtener farmacia actual
  useEffect(() => {
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
      isMounted = false;
      if (typeof unsubscribeAuth === "function") unsubscribeAuth();
    };
  }, []);

  // Effect principal: escuchar pedidos ENTRANTE y subscribir a ofertas por pedido
  useEffect(() => {
    if (!farmacia?.id) {
      // si no hay farmacia (por ejemplo logout) limpiamos y salimos
      setPedidos([]);
      setLoading(false);
      return;
    }

    const farmaciaId = String(farmacia.id);

    // helper para limpiar listener de un pedido
    const clearListenerForPedido = (pedidoId) => {
      const entry = offerListenersRef.current[pedidoId];
      if (!entry) return;
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
    };

    // handler que procesa ofertas (común)
    const processOffersForPedido = (p, ofertasArray) => {
      try {
        const pedidoId = p.id;
        const noOfertaron =
          Array.isArray(p?.[CAMPOS_PEDIDO.FARMACIAS_NO_OFERTARON])
            ? p[CAMPOS_PEDIDO.FARMACIAS_NO_OFERTARON].map(String)
            : [];

        // Si la farmacia marcó "no ofertar", eliminarlo si estaba
        if (noOfertaron.includes(farmaciaId)) {
          setPedidos((prev) => prev.filter((x) => x.id !== pedidoId));
          return;
        }

        const yaOferto = Array.isArray(ofertasArray)
          ? ofertasArray.some(
              (of) => String(of?.[CAMPOS_OFERTA.FARMACIA_ID]) === farmaciaId
            )
          : false;

        if (yaOferto) {
          // si ya ofertó, eliminarlo de la lista (si estaba)
          setPedidos((prev) => prev.filter((x) => x.id !== pedidoId));
          return;
        }

        // Pasa los filtros → agregar/actualizar
        setPedidos((prev) => {
          // si ya está, reemplazar la versión anterior (mantener inmutabilidad)
          const otros = prev.filter((x) => x.id !== pedidoId);
          return [...otros, p];
        });
      } catch (err) {
        console.error("Error procesando ofertas para pedido:", err);
      }
    };

    // subscribe a pedidos
    const unsubPedidos = listenPedidosPorEstado(ESTADOS_PEDIDO.ENTRANTE, async (items = []) => {
      try {
        // asegurar que items sea array (normalización mínima)
        const listaPedidos = Array.isArray(items) ? items : [];

        // ids actuales en snapshot
        const snapshotIds = listaPedidos.map((p) => p.id);

        // limpiar listeners de pedidos que ya no están en snapshot
        Object.keys(offerListenersRef.current).forEach((id) => {
          if (!snapshotIds.includes(id)) {
            clearListenerForPedido(id);
            // también eliminar del estado visual
            setPedidos((prev) => prev.filter((x) => x.id !== id));
          }
        });

        // para cada pedido del snapshot, asegurarse que tenemos listener
        for (const p of listaPedidos) {
          const pedidoId = p.id;
          if (!pedidoId) continue;

          // si ya tenemos listener, no lo re-creamos (pero podríamos querer refresh inmediato)
          if (offerListenersRef.current[pedidoId]) {
            // opcional: podríamos disparar una verificación inicial aquí si queremos
            continue;
          }

          // intentamos registrar listener con listOfertasForPedido
          try {
            const maybeUnsub = listOfertasForPedido(pedidoId, (ofertasRealtime = []) => {
              // si la función se comporta como listener, vendrá por aquí
              const ofertasArr = Array.isArray(ofertasRealtime) ? ofertasRealtime : [];
              processOffersForPedido(p, ofertasArr);
            });

            // si devuelve una función -> ok, es un unsub
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

              // iniciar polling
              const pollId = setInterval(async () => {
                try {
                  const newest = await listOfertasForPedido(pedidoId);
                  const ofertasArr = Array.isArray(newest) ? newest : [];
                  processOffersForPedido(p, ofertasArr);
                } catch (err) {
                  console.error("Error en polling de ofertas:", err);
                }
              }, 2500);

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
                    console.error("Error polling fallback:", err);
                  }
                }, 2500);

                offerListenersRef.current[pedidoId] = { pollId };
              } catch (err) {
                console.error("listOfertasForPedido no devolvió unsub ni Promise:", err);
              }
            }
          } catch (err) {
            console.error("Error registrando listener de ofertas:", err);
          }
        }

        // Si nunca habíamos marcado firstLoaded, ahora lo hacemos (evita loader infinito)
        if (!firstLoadedRef.current) {
          firstLoadedRef.current = true;
          setLoading(false);
        }
      } catch (err) {
        console.error("Error en snapshot de pedidos ENTRANTE:", err);
        // asegurar que el loader no quede pegado si hay error
        if (!firstLoadedRef.current) {
          firstLoadedRef.current = true;
          setLoading(false);
        }
      }
    });

    // cleanup general del effect
    return () => {
      try {
        if (typeof unsubPedidos === "function") unsubPedidos();
      } catch (e) {}
      // limpiar todos los listeners de ofertas
      Object.keys(offerListenersRef.current).forEach((id) => clearListenerForPedido(id));
      offerListenersRef.current = {};
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

      {pedidos.length > 0 ? (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id || item.docId || JSON.stringify(item)}
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

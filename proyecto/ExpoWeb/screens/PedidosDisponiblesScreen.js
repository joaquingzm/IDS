import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, Text } from "react-native";
import { theme } from "../styles/theme";
import PedidoDisponibleCard from "../components/pedidoDisponibleCard";
import { listenPedidosPorEstado } from "../utils/firestoreService";
import {
  ESTADOS_PEDIDO,
  CAMPOS_FARMACIA,
  CAMPOS_PEDIDO,
} from "../dbConfig"
import { auth } from "../firebase";
import { getFarmaciaById } from "../utils/firestoreService";

export default function PedidosDisponiblesScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [farmacia, setFarmacia] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener farmacia actual (la que está logueada) — usamos onAuthStateChanged para mayor fiabilidad
  useEffect(() => {
    let isMounted = true;

    const fetchFarmacia = async (uid, email) => {
      try {
        const data = await getFarmaciaById(uid); // debe devolver { id, ...fields } or null
        // Normalizamos las posibles variantes del campo nombre
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
            // garantizamos que exista la clave esperada por la app
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
      fetchFarmacia(user.uid, user.email);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribeAuth === "function") unsubscribeAuth();
    };
  }, []);

  // Listener de pedidos por estado
useEffect(() => {
  const unsub = listenPedidosPorEstado(
    ESTADOS_PEDIDO.ENTRANTE,
    (items) => {
      setLoading(true);

      const pedidosFiltrados = items.filter((pedido) => {
        const rechazadas = pedido[CAMPOS_PEDIDO.FARMACIAS_NO_OFERTARON] || [];
        return !rechazadas.includes(farmacia?.id);
      });

      setPedidos(pedidosFiltrados);
      setLoading(false);
    }
  );

  return () => {
    if (typeof unsub === "function") unsub();
  };
}, [farmacia]);


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
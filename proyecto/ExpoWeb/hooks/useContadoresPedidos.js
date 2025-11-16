import { useEffect, useState } from "react";
import { ESTADOS_PEDIDO, CAMPOS_PEDIDO } from "../dbConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function useContadoresPedidos(farmaciaId) {
  const [pendientes, setPendientes] = useState(0);
  const [activos, setActivos] = useState(0);

  useEffect(() => {
    if (!farmaciaId) return;

    // -------------------------------------------------------------------
    // 🔹 1) PEDIDOS DISPONIBLES (estado entrante / pendiente)
    // -------------------------------------------------------------------
    const qPendientes = query(
      collection(db, "Pedidos"),
      where(CAMPOS_PEDIDO.ESTADO, "in", [
        ESTADOS_PEDIDO.ENTRANTE,
        ESTADOS_PEDIDO.PENDIENTE,
      ])
    );

    const unsubPend = onSnapshot(qPendientes, (snap) => {
      const countEstado = snap.docs.length;

      setPendientes((prev) => ({
        ...(typeof prev === "object" ? prev : {}),
        estado: countEstado,
        noOfertados: prev?.noOfertados ?? 0,
      }));
    });

    // -------------------------------------------------------------------
    // 🔹 2) PEDIDOS DONDE ESTA FARMACIA NO OFERTÓ
    // -------------------------------------------------------------------
    const qNoOfertados = query(
      collection(db, "Pedidos"),
      where(CAMPOS_PEDIDO.FARMACIAS_NO_OFERTARON, "array-contains", farmaciaId)
    );

    const unsubNoOfert = onSnapshot(qNoOfertados, (snap) => {
      const countNoOfertaron = snap.docs.length;

      setPendientes((prev) => ({
        ...(typeof prev === "object" ? prev : {}),
        estado: prev?.estado ?? 0,
        noOfertados: countNoOfertaron,
      }));
    });

    // -------------------------------------------------------------------
    // 🔹 3) PEDIDOS ACTIVOS
    // -------------------------------------------------------------------
    const qActivos = query(
      collection(db, "Pedidos"),
      where(CAMPOS_PEDIDO.FARMACIA_ASIGNADA_ID, "==", farmaciaId),
      where(CAMPOS_PEDIDO.ESTADO, "in", [
        ESTADOS_PEDIDO.ACTIVO,
        ESTADOS_PEDIDO.EN_PREPARACION,
        ESTADOS_PEDIDO.EN_CAMINO,
      ])
    );

    const unsubAct = onSnapshot(qActivos, (snap) => {
      setActivos(snap.docs.length);
    });

    return () => {
      unsubPend();
      unsubNoOfert();
      unsubAct();
    };
  }, [farmaciaId]);

  // -------------------------------------------------------------------
  // 🔹 AHORA SE RESTAN LOS NO OFERTADOS
  // -------------------------------------------------------------------
  const pendientesTotales =
    (pendientes.estado ?? 0) - (pendientes.noOfertados ?? 0);

  return { pendientes: pendientesTotales, activos };
}

import { db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";

// Aceptar pedido
export const aceptarPedido = async (pedidoId) => {
  const docRef = doc(db, "pedidosPendientes", pedidoId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    await setDoc(doc(db, "pedidosAceptados", pedidoId), data);
    await deleteDoc(docRef);
  }
};

// Rechazar pedido
export const rechazarPedido = async (pedidoId) => {
  await deleteDoc(doc(db, "pedidosPendientes", pedidoId));
};
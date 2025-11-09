import { db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

export const moverPedido = async (pedidoId, destino) => {
  const docRef = doc(db, "pedidosAceptados", pedidoId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    await setDoc(doc(db, destino, pedidoId), data);
    await deleteDoc(docRef);
  }
};
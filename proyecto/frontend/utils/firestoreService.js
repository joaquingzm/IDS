// services/firestoreService.js
// CRUD + listeners para usuarios, farmacias, pedidos y ofertas (subcolección)
// Firebase v9 modular

import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    onSnapshot,
    orderBy,
    serverTimestamp,
    writeBatch,
    getCountFromServer,
} from "firebase/firestore";
import { db } from "../firebase";
import {
    COLECCION_USUARIOS,
    CAMPOS_USUARIO,
    COLECCION_FARMACIAS,
    CAMPOS_FARMACIA,
    COLECCION_PEDIDO,
    CAMPOS_PEDIDO,
    COLECCION_OFERTA,
    CAMPOS_OFERTA,
    ESTADOS_PEDIDO,
    ESTADOS_OFERTA,
} from "../dbConfig";

/* -----------------------------
   USUARIOS
   ----------------------------- */

// Crea usuario. Si pasás uid, usa usuarios/{uid}, si no, genera id automático.
export async function crearUsuario(userData, uid) {
    const payload = {
        [CAMPOS_USUARIO.EMAIL]: userData.email || "",
        // NO guardar contraseñas en claro
        [CAMPOS_USUARIO.NOMBRE]: userData.nombre || "",
        [CAMPOS_USUARIO.APELLIDO]: userData.apellido || "",
        [CAMPOS_USUARIO.ROL]: userData.rol || "user",
        [CAMPOS_USUARIO.OBRASOCIAL]: userData.obraSocial || "",
        [CAMPOS_USUARIO.DNI]: userData.dni || "",
        [CAMPOS_USUARIO.DIRECCION]: userData.direccion || "",
        [CAMPOS_USUARIO.FECHA_REGISTRO]: serverTimestamp(),
    };

    if (uid) {
        const ref = doc(db, COLECCION_USUARIOS, uid);
        await setDoc(ref, payload, { merge: true });
        return uid;
    } else {
        const colRef = collection(db, COLECCION_USUARIOS);
        const docRef = await addDoc(colRef, payload);
        return docRef.id;
    }
}

export async function getUsuarioByUid(uid) {
    const ref = doc(db, COLECCION_USUARIOS, uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getUsuarioByEmail(email) {
    const q = query(collection(db, COLECCION_USUARIOS), where(CAMPOS_USUARIO.EMAIL, "==", email));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUsuario(uid, patches) {
    const ref = doc(db, COLECCION_USUARIOS, uid);
    await updateDoc(ref, { ...patches });
}

export async function deleteUsuario(uid) {
    const ref = doc(db, COLECCION_USUARIOS, uid);
    await deleteDoc(ref);
}

/* -----------------------------
   FARMACIAS
   ----------------------------- */

export async function createFarmacia(pharmacyData, pharmacyId) {
    const payload = {
        [CAMPOS_FARMACIA.EMAIL]: pharmacyData.email || "",
        [CAMPOS_FARMACIA.NOMBRE]: pharmacyData.nombre || "",
        [CAMPOS_FARMACIA.DIRECCION]: pharmacyData.direccion || "",
        [CAMPOS_FARMACIA.ROL]: pharmacyData.rol || "pharmacy",
        [CAMPOS_FARMACIA.TELEFONO]: pharmacyData.telefono || "",
        [CAMPOS_FARMACIA.FECHA_REGISTRO]: serverTimestamp(),
    };

    if (pharmacyId) {
        const ref = doc(db, COLECCION_FARMACIAS, pharmacyId);
        await setDoc(ref, payload, { merge: true });
        return pharmacyId;
    } else {
        const colRef = collection(db, COLECCION_FARMACIAS);
        const docRef = await addDoc(colRef, payload);
        return docRef.id;
    }
}

export async function getFarmaciaById(id) {
    const ref = doc(db, COLECCION_FARMACIAS, id);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateFarmacia(id, patches) {
    const ref = doc(db, COLECCION_FARMACIAS, id);
    await updateDoc(ref, { ...patches });
}

export async function deleteFarmacia(id) {
    const ref = doc(db, COLECCION_FARMACIAS, id);
    await deleteDoc(ref);
}

/* -----------------------------
   PEDIDOS
   ----------------------------- */

// Crear pedido y devolver orderId
export async function crearPedido(pedidoData) {
    if (!pedidoData || !pedidoData.userId || !pedidoData.imagen) {
        throw new Error("pedidoData inválido: requiere userId e imagen");
    }

    const payload = {
        [CAMPOS_PEDIDO.USER_ID]: pedidoData.userId,
        [CAMPOS_PEDIDO.NOMBRE_USUARIO]: pedidoData.nombreUsuario || "",
        [CAMPOS_PEDIDO.APELLIDO_USUARIO]: pedidoData.apellidoUsuario || "",
        [CAMPOS_PEDIDO.OBRASOCIAL]: pedidoData.obraSocialUsuario || "",
        [CAMPOS_PEDIDO.DIRECCION]: pedidoData.direccionUsuario || "",
        [CAMPOS_PEDIDO.IMAGEN]: pedidoData.imagen,
        [CAMPOS_PEDIDO.OCR]: pedidoData.ocr || null,
        [CAMPOS_PEDIDO.FECHA_PEDIDO]: serverTimestamp(),
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO?.ENTRANTE || "entrante",
        [CAMPOS_PEDIDO.OFERTA_ACEPTADA_ID]: null,
        [CAMPOS_PEDIDO.FARMACIA_ASIGANADA_ID]: pedidoData.farmaciaAsignadaId || null,
    };

    const colRef = collection(db, COLECCION_PEDIDO);
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
}

export async function getPedidoById(pedidoId) {
    const ref = doc(db, COLECCION_PEDIDO, pedidoId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listPedidosByState(state) {
    const q = query(collection(db, COLECCION_PEDIDO), where(CAMPOS_PEDIDO.ESTADO, "==", state), orderBy(CAMPOS_PEDIDO.FECHA_PEDIDO, "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listPedidosByUser(usuarioId) {
    const q = query(collection(db, COLECCION_PEDIDO), where(CAMPOS_PEDIDO.USER_ID, "==", usuarioId), orderBy(CAMPOS_PEDIDO.FECHA_PEDIDO, "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listPedidosByStateAndPharmacy(state, farmaciaId) {
    const q = query(
        collection(db, COLECCION_PEDIDO),
        where(CAMPOS_PEDIDO.ESTADO, "==", state),
        where(CAMPOS_PEDIDO.FARMACIA_ASIGANADA_ID, "==", farmaciaId),
        orderBy(CAMPOS_PEDIDO.FECHA_PEDIDO, "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


export async function updatePedido(pedidoId, patches) {
    const ref = doc(db, COLECCION_PEDIDO, pedidoId);
    await updateDoc(ref, { ...patches });
}

export async function deletePedido(pedidoId) {
    const ref = doc(db, COLECCION_PEDIDO, pedidoId);
    await deleteDoc(ref);
}

/* -----------------------------
   OFERTAS (subcolección)
   ----------------------------- */

function ofertasCollectionRef(pedidoId) {
    return collection(db, COLECCION_PEDIDO, pedidoId, COLECCION_OFERTA);
}

export async function crearOferta(pedidoId, pedidoData) {
    const colRef = ofertasCollectionRef(orderId);

    const payload = {
        [CAMPOS_OFERTA.FARMACIA_ID]: pedidoData.farmaciaId || "",
        [CAMPOS_OFERTA.NOMBRE_FARMACIA]: pedidoData.nombreFarmacia || "",
        [CAMPOS_OFERTA.MONTO]: pedidoData.monto || 0,
        [CAMPOS_OFERTA.MEDICAMENTO]: pedidoData.medicamento || [],
        [CAMPOS_OFERTA.TIEMPO_ESPERA]: pedidoData.tiempoEspera || null,
        [CAMPOS_OFERTA.FECHA_OFERTA]: serverTimestamp(),
        [CAMPOS_OFERTA.ESTADO]: ESTADOS_OFERTA?.PENDIENTE || "pendiente",
    };

    const docRef = await addDoc(colRef, payload);
    return docRef.id;
}

export async function getOferta(pedidoId, ofertaId) {
    const ref = doc(db, COLECCION_PEDIDO, pedidoId, COLECCION_OFERTA, ofertaId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listOfertasForPedido(pedidoId) {
    const q = query(collection(db, COLECCION_PEDIDO, pedidoId, COLECCION_OFERTA), orderBy(CAMPOS_OFERTA.FECHA_OFERTA, "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOferta(pedidoId, ofertaId, patches) {
    const ref = doc(db, COLECCION_PEDIDO, pedidoId, COLECCION_OFERTA, ofertaId);
    await updateDoc(ref, { ...patches });
}

export async function deleteOferta(pedidoId, ofertaId) {
    const ref = doc(db, COLECCION_PEDIDO, pedidoId, COLECCION_OFERTA, ofertaId);
    await deleteDoc(ref);
}

/* -----------------------------
   LISTENERS
   ----------------------------- */

// Lo usa la farmacia
export function listenPedidosPorEstado(state, onUpdate) {
    const q = query(collection(db, COLECCION_PEDIDO), where(CAMPOS_PEDIDO.ESTADO, "==", state), orderBy(CAMPOS_PEDIDO.FECHA_PEDIDO, "desc"));
    const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(items);
    });
    return unsub;
}

// Lo usa el usuario
export function listenOfertasDePedido(orderId, onUpdate) {
    const q = query(collection(db, COLECCION_PEDIDO, orderId, COLECCION_OFERTA), orderBy(CAMPOS_OFERTA.FECHA_OFERTA, "asc"));
    const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(items);
    });
    return unsub;
}


export function listenPedido(orderId, onUpdate) {
    const ref = doc(db, COLECCION_PEDIDO, orderId);
    const unsub = onSnapshot(ref, (snap) => {
        onUpdate(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsub;
}

export function listenPedidosPorEstadoYFarmacia(state, farmaciaId, onUpdate) {
    const q = query(
        collection(db, COLECCION_PEDIDO),
        where(CAMPOS_PEDIDO.ESTADO, "==", state),
        where(CAMPOS_PEDIDO.FARMACIA_ASIGANADA_ID, "==", farmaciaId),
        orderBy(CAMPOS_PEDIDO.FECHA_PEDIDO, "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(items);
    }, (err) => {
        console.error("listenPedidosPorEstadoYFarmacia error:", err);
        onUpdate([]); // opcional: notificar fallback
    });

    return unsub;
}


/* -----------------------------
   OPERACIONES COMBINADAS
   ----------------------------- */

export async function aceptarOfertaBatch(orderId, offerId, farmaciaId, { rejectOthers = true } = {}) {
    const batch = writeBatch(db);
    const ofertaRef = doc(db, COLECCION_PEDIDO, orderId, COLECCION_OFERTA, offerId);
    const pedidoRef = doc(db, COLECCION_PEDIDO, orderId);

    batch.update(ofertaRef, { [CAMPOS_OFERTA.ESTADO]: ESTADOS_OFERTA?.ACEPTADA || "aceptada" });
    batch.update(pedidoRef, {
        [CAMPOS_PEDIDO.ESTADO]: ESTADOS_PEDIDO?.ACTIVO || "activo",
        [CAMPOS_PEDIDO.OFERTA_ACEPTADA_ID]: offerId,
        [CAMPOS_PEDIDO.FARMACIA_ASIGANADA_ID]: farmaciaId,
    });

    if (rejectOthers) {
        const ofertasSnap = await getDocs(collection(db, COLECCION_PEDIDO, orderId, COLECCION_OFERTA));
        ofertasSnap.docs.forEach(d => {
            if (d.id !== offerId) {
                const otherRef = doc(db, COLECCION_PEDIDO, orderId, COLECCION_OFERTA, d.id);
                batch.update(otherRef, { [CAMPOS_OFERTA.ESTADO]: ESTADOS_OFERTA?.RECHAZADA || "rechazada" });
            }
        });
    }

    await batch.commit();
}

export async function rejectOtherOffers(orderId, acceptedOfferId) {
    const ofertasSnap = await getDocs(collection(db, COLECCION_PEDIDO, orderId, COLECCION_OFERTA));
    const batch = writeBatch(db);
    ofertasSnap.docs.forEach(d => {
        if (d.id !== acceptedOfferId) {
            const ref = doc(db, COLECCION_PEDIDO, orderId, COLECCION_OFERTA, d.id);
            batch.update(ref, { [CAMPOS_OFERTA.ESTADO]: ESTADOS_OFERTA?.RECHAZADA || "rechazada" });
        }
    });
    await batch.commit();
}

/* -----------------------------
   UTIL
   ----------------------------- */

export async function countPedidosByState(state) {
    const q = query(collection(db, COLECCION_PEDIDO), where(CAMPOS_PEDIDO.ESTADO, "==", state));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

/* -----------------------------
   EXPORT
   ----------------------------- */

const firestoreService = {
    // usuarios
    crearUsuario,
    getUsuarioByUid,
    getUsuarioByEmail,
    updateUsuario,
    deleteUsuario,

    // farmacias
    createFarmacia,
    getFarmaciaById,
    updateFarmacia,
    deleteFarmacia,

    // pedidos
    crearPedido,
    getPedidoById,
    listPedidosByState,
    listPedidosByUser,
    listPedidosByStateAndPharmacy,
    updatePedido,
    deletePedido,

    // ofertas
    crearOferta,
    getOferta,
    listOfertasForPedido,
    updateOferta,
    deleteOferta,

    // listeners
    listenPedidosPorEstado,
    listenOfertasDePedido,
    listenPedido,
    listenPedidosPorEstadoYFarmacia,

    // batch ops
    aceptarOfertaBatch,
    rejectOtherOffers,

    // utils
    countPedidosByState,
};

export default firestoreService;

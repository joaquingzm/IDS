// dbConfig.js



export const ESTADOS_PEDIDO = {
  ENTRANTE: "entrante",
  PENDIENTE: "pendiente",
  EN_PREPARACION: "en_preparacion",
  EN_CAMINO: "en_camino",
  ACTIVO: "activo",
  REALIZADO: "realizado",
  CONFIRMACION: "confirmacion",
  RECHAZADO: "rechazado",
};

export const ESTADOS_OFERTA = {
  PENDIENTE: "pendiente",
  ACEPTADA: "aceptada",
  RECHAZADA: "rechazada",
};




export const COLECCION_USUARIOS = "usuarios";

export const CAMPOS_USUARIO = {
  EMAIL: "email",
  CONTRASEÑA: "contrasena",
  NOMBRE: "nombre",
  APELLIDO: "apellido",
  FECHA_REGISTRO: "fechaRegistro",
  OBRASOCIAL: "obraSocial",
  OBRASOCIAL_NUM: "obraSocialNum",
  DNI: "dni",
  DIRECCION: "direccion",
  ROL: "rol",
};


export const COLECCION_FARMACIAS = "usuarios_Farmacias";

export const CAMPOS_FARMACIA = {
  EMAIL: "email",
  CONRASEÑA: "Contraseña",
  NOMBRE: "nombre_farmacia",
  DIRECCION: "Direccion",
  FECHA_REGISTRO: "fechaRegistro",
  TELEFONO: "Telefono comercial",
  ROL: "rol",
};


export const COLECCION_PEDIDO = "Pedidos";

export const CAMPOS_PEDIDO = {
  // Info cliente
  USER_ID: "userId",
  NOMBRE_USUARIO: "nombreUsuario",
  APELLIDO_USUARIO: "apellidoUsuario",
  OBRASOCIAL: "obraSocialUsuario",
  OBRASOCIAL_NUM: "obraSocialNumUsuario",
  DIRECCION: "direccionUsuario",

  // Info pedido
  IMAGEN: "imagen",
  OCR: "resultadosOCR",
  FECHA_PEDIDO: "fechaPedido",

  // Estado pedido
  ESTADO: "estado", // entrante, pendiente, activo, realizado, rechazado
  OFERTA_ACEPTADA_ID: "ofertaAceptadaId",
  FARMACIA_ASIGANADA_ID: "farmaciaAsignadaID",
  FECHA_ACEPTACION: "fechaAceptacion",
  FECHA_PREPARACION: "fechaPreparacion",
  FECHA_EN_CAMINO: "fechaEnCamino",
  FECHA_ENTREGADO: "fechaEntregado",
  FECHA_COMPLETADO: "fechaCompletado",
  FECHA_CANCELACION: "fechaCancelacion",
  CANCELADO_POR: "canceladoPor",

  // Ofertas
  OFERTAS_IDS: "ofertasId",
};


export const COLECCION_OFERTA = "Oferta";

export const CAMPOS_OFERTA = {
  // Info farmacia
  FARMACIA_ID: "farmaciaId",
  NOMBRE_FARMACIA: "nombreDeFarmacia",

  // Info oferta
  MONTO: "monto",
  MEDICAMENTO: "medicamento",
  FECHA_OFERTA: "fechaOferta",
  TIEMPO_ESPERA: "tiempoEspera",
  FARMACIAS_NO_OFERTARON: "farmaciasNoOfertaronId",

  // Estado oferta
  ESTADO: "estado", // pendiente, aceptada, rechazada
};




// dbConfig.js



export const ESTADOS_PEDIDO = {
  ENTRANTE: "entrante",
  PENDIENTE: "pendiente",
  ACTIVO: "activo",
  REALIZADO: "realizado",
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
  DNI: "dni",
  DIRECCION: "direccion",
};


export const COLECCION_FARMACIAS = "usuarios_Farmacias";

export const CAMPOS_FARMACIA = {
  EMAIL: "email",
  CONRASEÑA: "Contraseña",
  NOMBRE: "nombre_farmacia",
  DIRECCION: "Direccion",
  FECHA_REGISTRO: "fechaRegistro",
  TELEFONO: "Telefono comercial",
};


export const COLECCION_PEDIDO = "PedidosFarmacia";

export const CAMPOS_PEDIDO = {
  // Info cliente
  USER_ID: "userId",
  NOMBRE_USUARIO: "nombreUsuario",
  APELLIDO_USUARIO: "apellidoUsuario",
  OBRASOCIAL: "obraSocialUsuario",
  DIRECCION: "direccionUsuario",

  // Info pedido
  IMAGEN: "imagen",
  OCR: "resultadosOCR",
  FECHA_PEDIDO: "fechaPedido",

  // Estado pedido
  ESTADO: "estado", // entrante, pendiente, activo, realizado, rechazado
  OFERTA_ACEPTADA_ID: "ofertaAceptadaId",
  FARMACIA_ASIGANADA_ID: "farmaciaAsignadaID",

  // Ofertas
  OFERTAS_IDS: "ofertasId",
};


export const COLECCION_OFERTA = "Oferta";

export const CAMPOS_OFERTA = {
  // Info farmacia
  FARMACIA_ID: "farmaciaId",
  NOMBRE_FARMACIA: "nombre de farmacia",

  // Info oferta
  MONTO: "monto",
  MEDICAMENTO: "medicamento",
  FECHA_OFERTA: "fechaOferta",
  Tiempo_Espera: "tiempoEspera",

  // Estado oferta
  ESTADO: "estado", // pendiente, aceptada, rechazada
};




// dbConfig.js
export const COLECCION_USUARIOS = "usuarios";

export const CAMPOS_USUARIO = {
  EMAIL: "email",
  CONTRASEÑA: "contrasena", 
  NOMBRE: "nombre",
  APELLIDO: "apellido",
  ROL: "rol",
  FECHA_REGISTRO: "fechaRegistro",
  OBRASOCIAL: "obraSocial",
  DNI: "dni",
  DIRECCION: "direccion",
};

export const COLECCION_PEDIDO_ENTRANTE = "PedidosPendientes";

export const CAMPOS_PEDIDO_ENTRANTE = {
  IMAGEN: "imagen",
  NOMBRE_USUARIO: "nombreUsuario",
  APELLIDO_USUARIO: "apellidoUsuario",
  FECHA_PEDIDO: "fechaPedido",
  DIRECCION: "direccionUsuario",
  USER_ID: "userId",
  OBRASOCIAL: "obraSocialUsuario",
  OCR: "resultadosOCR",
};

export const COLECCION_PEDIDO_PENDIENTE = "PedidosPendientes";

export const CAMPOS_PEDIDO_PENDIENTE = {
  IMAGEN: "imagen",
  NOMBRE_USUARIO: "nombreUsuario",
  APELLIDO_USUARIO: "apellidoUsuario",
  FECHA_PEDIDO: "fechaPedido",
  DIRECCION: "direccionUsuario",
  USER_ID: "userId",
  OBRASOCIAL: "obraSocialUsuario",
  OCR: "resultadosOCR",
  MEDICAMENTOS: "medicamentes",
  MONTO: "monto",
  NOMBRE_FARMACIA:"nombre de farmacia",
  ID_FARMACIA: "id farmacia",
  TIEMPO_ESPERA: "TiempoEspera",
};

export const COLECCION_PEDIDO_ACEPTADO = "PedidosAceptados";

export const CAMPOS_PEDIDO_ACEPTADO = {
  FECHA_PEDIDO: "fechaPedido",
  USER_ID:"id de usuario",
  NOMBRE_FARMACIA:"nombre de farmacia",
  MEDICAMENTOS:"Medicamentos",
};

export const COLECCION_PEDIDO_HISTORIAL = " Historial de pedidos de usuario";

export const CAMPOS_PEDIDO_HISTORIAL = {
  FECHA_LLEGADA: "fecha_LLEGADA",
  MEDICAMENTOS: "MEDICAMENTOS",
  USER_ID:"id de usuario",
  NOMBRE_FARMACIA:"nombre de farmacia",
  MONTO: "MONTO DE PAGO"
};

export const COLECCION_OFERTA = "Oferta";

export const CAMPOS_OFERTA = {
  FECHA_OFERTA: "fechaOferta",
  Tiempo_Espera: "TiempoEspera",
  USER_ID:"id de usuario",
  NOMBRE_FARMACIA:"nombre de farmacia",
  MONTO: "MONTO DE PAGO"
};
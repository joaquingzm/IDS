// dbConfig.js
export const COLECCION_FARMACIAS = "usuarios_Farmacias";

export const CAMPOS_FARMACIA = {
  EMAIL: "email",
  CONRASEÑA: "Contraseña",
  NOMBRE: "nombre_farmacia",
  DIRECCION: "Direccion",
  ROL: "rol",
  FECHA_REGISTRO: "fechaRegistro",
  TELEFONO: "Telefono comercial",
};


export const COLECCION_PEDIDO_FARMACIA = "PedidosFarmacia";

export const CAMPOS_PEDIDO_FARMACIA = {
  IMAGEN: "imagen",
  NOMBRE_USUARIO: "nombreUsuario",
  APELLIDO_USUARIO: "apellidoUsuario",
  FECHA_PEDIDO: "fechaPedido",
  DIRECCION: "direccionUsuario",
  USER_ID: "userId",
  OBRASOCIAL: "obraSocialUsuario",
};


export const COLECCION_PEDIDO_ACEPTADOS = "PedidosAceptados";

export const CAMPOS_PEDIDO_ACEPTADOS = {
  NOMBRE_USUARIO: "nombreUsuario",
  APELLIDO_USUARIO: "apellidoUsuario", 
  FECHA_PEDIDO: "fechaPedido",
  DIRECCION: "direccionUsuario",
  USER_ID: "userId",
  OBRASOCIAL: "obraSocialUsuario",
  MEDICAMENTOS: "Medicamentos",
  MONTO: "Monto",
};

export const COLECCION_PEDIDO_HISTORIAL = "PedidosHistorial";

export const CAMPOS_PEDIDO_HISTORIAL = {
  NOMBRE_USUARIO: "nombreUsuario",
  APELLIDO_USUARIO: "apellidoUsuario",
  FECHA_PEDIDO: "fechaPedido",
  DIRECCION: "direccionUsuario",
  USER_ID: "userId",
  OBRASOCIAL: "obraSocialUsuario",
  MEDICAMENTOS: "Medicamentos",
  MONTO:"Monto",
};
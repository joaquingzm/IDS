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


export const COLECCION_PEDIDO_USUARIO = "PedidosUsuario";

export const CAMPOS_PEDIDO_USUARIO = {
  NOMBRE_FARMACIA: "Nombre",
  FECHA_PEDIDO: "fechaPedido",
  USER_ID:"id de usuario",
  NOMBRE_FARMACIA:"nombre de farmacia",
  ESTADO:"Estado",
  MEDICAMENTOS:"Medicamentos",
};



export const COLECCION_OFERTA = "Oferta";

export const CAMPOS_OFERTA = {
  FECHA_OFERTA: "fechaOferta",
  Tiempo_Espera: "TiempoEspera",
  USER_ID:"id de usuario",
  NOMBRE_FARMACIA:"nombre de farmacia",
  MONTO: "MONTO DE PAGO"
};


export const COLECCION_HISTORIAL_PEDIDO = " Historial de pedidos de usuario";

export const CAMPOS_HISTORIAL = {
  FECHA_LLEGADA: "fecha_LLEGADA",
  MEDICAMENTOS: "MEDICAMENTOS",
  USER_ID:"id de usuario",
  NOMBRE_FARMACIA:"nombre de farmacia",
  MONTO: "MONTO DE PAGO"
};
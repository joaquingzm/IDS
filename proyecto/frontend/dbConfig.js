// dbConfig.js
export const COLECCION_USUARIOS = "usuarios";

export const CAMPOS_USUARIO = {
  EMAIL: "email",
  CONRASEÑA: "Contraseña",
  NOMBRE: "nombre",
  APELLIDO:"Apellido",
  ROL: "rol",
  FECHA_REGISTRO: "fechaRegistro",
  OBRASOCIAL: "Obra Social",
  DNI: "DNI",
  DIRECCION: "Direccion",
};

export const COLECCION_PEDIDO_FARMACIA = "PedidosFarmacia";

export const CAMPOS_Pedido = {
  IMAGEN: "imagen",
  NOMBRE_USUARIO: "Nombre",
  APELLIDO_USUARIO:"Apellido",
  FECHA_PEDIDO: "fechaPedido",
  DIRECCION: "Direccion de usuario",
  USER_ID:"id de usuario",
  OBRASOCIAL:"Obra_social_usuario"
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

export const CAMPOS_Oferta = {
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

export const alertPresets = {
  
  pedido_ok: {
    type: "toast",
    preset: "done",
    title: "Pedido #{{id}} enviado 🚀",
    message: "Tu pedido fue procesado correctamente.",
  },

  error_red: {
    type: "toast",
    preset: "error",
    title: "Error",
    message: "Ocurrió un problema al procesar la acción.",
  },

 
  login_error: {
  type: "toast",
  preset: "error",
  title: "Error de inicio de sesión",
  message: "{{message}}",
},
login_success: {
  type: "toast",
  preset: "done",
  title: "Bienvenido {{nombre}} 👋",
  message: "Sesión iniciada correctamente.",
},

registro_error: {
  type: "toast",
  preset: "error",
  title: "Error de registro de usuario.",
  message: "{{message}}",
},

registro_success: {
  type: "toast",
  preset: "done",
  title: "Bienvenido {{nombre}} 👋",
  message: "Registro exitoso.",
},

signout_error: {
  type: "toast",
  preset: "error",
  title: "Error cerrando sesion.",
  message: "{{message}}",
},

signout_success: {
  type: "toast",
  preset: "done",
  title: "Hasta pronto {{nombre}} 👋",
  message: "Sesión cerrada correctamente.",
},

pedido_error: {
  type: "toast",
  preset: "error",
  title: "Error del pedido.",
  message: "{{message}}",
},

pedido_success: {
  type: "toast",
  preset: "done",
  title: "Pedido exitoso.",
  message: "Sesión cerrada correctamente.",
},

pedido_recibido_error: {
  type: "toast",
  preset: "error",
  title: "Error recibiendo el pedido.",
},

pedido_recibido_success: {
  type: "toast",
  preset: "done",
  title: "Pedido recibido exitosamente.",
},

campo_invalido: {
    type: "toast",
    preset: "error",
    title: "Datos inválidos ",
    message: "{{message}}",
},

  campos_incompletos: {
  type: "toast",
  preset: "error",
  title: "Campos incompletos ",
  message: "Por favor, completá todos los campos antes de continuar.",
},

  confirm_accept_offer: {
    title: "¿Aceptar oferta?",
  },

  confirm_entrega: {
    title: "¿Confirmar entrega?",
  },
  // ...otros presets



  // Podemos hacer alertas con botones de esta manera
  confirmar_eliminar_pedido: {
    type: "alert",
    title: "¿Eliminar pedido #{{id}}?",
    message: "Esta acción no se puede deshacer.",
    actions: (params) => [
      { title: "Cancelar", style: "cancel" },
      { title: "Eliminar", style: "destructive", onPress: params.onConfirm },
    ],
  },

  confirmar_eliminar_pedido: {
    type: "modal",
    title: "¿Confirmar receta?",
    actions: (params) => [
      { title: "Cancelar", style: "cancel", onPress: params.onCancel },
      { title: "Continuar", style: "destructive", onPress: params.onConfirm },
    ],
  },
};
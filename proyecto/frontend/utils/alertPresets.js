
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

};
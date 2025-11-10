import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import { CAMPOS_USUARIO,CAMPOS_PEDIDO,CAMPOS_OFERTA } from "../dbConfig"; // asegúrate de importar correctamente

export default function HistorialCard({ pedido,oferta,usuario }) {
  if (!pedido) {
    return (
      <View style={styles.card}>
        <Text style={styles.noPedido}>No se tiene un pedido actual</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        Pedido de {usuario[CAMPOS_USUARIO.NOMBRE]} {usuario[CAMPOS_USUARIO.APELLIDO]}
      </Text>

     <Text style={styles.text}>
               Fecha de llegada: {oferta[CAMPOS_OFERTA.FECHA_OFERTA]}
     </Text>
      
      <Text style={styles.text}>
                Direccion: {usuario[CAMPOS_USUARIO.DIRECCION]}
      </Text>

      <Text style={styles.text}>
                Obra social: {usuario[CAMPOS_USUARIO.OBRASOCIAL]}
      </Text>      
      
      <Text style={styles.text}>
                Medicamentos: {oferta[CAMPOS_OFERTA.MEDICAMENTO]}
      </Text> 

      
      <Text style={styles.text}>
                Monto: {oferta[CAMPOS_OFERTA.MONTO]}
      </Text>  
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  noPedido: {
    fontSize: theme.typography.fontSize.base,
    fontStyle: "italic",
    color: theme.colors.mutedForeground,
    textAlign: "center",
  },
});
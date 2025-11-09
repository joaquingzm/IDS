import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from "react-native";
import { db } from "../firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { theme } from "../styles/theme";
import { CAMPOS_PEDIDO_FARMACIA, COLECCION_PEDIDO_ACEPTADOS, CAMPOS_PEDIDO_ACEPTADOS } from "../dbConfig";

export default function CardPedidoPendiente({ pedido }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [medicamentos, setMedicamentos] = useState("");
  const [monto, setMonto] = useState("");

  const handleAceptarPress = () => {
    setMostrarFormulario(true);
  };

  const handleConfirmarAceptar = async () => {
    if (!medicamentos.trim() || !monto.trim()) {
      alert("Por favor, completa ambos campos");
      return;
    }

    try {
      const pedidoRef = doc(db, "PedidosFarmacia", pedido.id);
      const pedidoSnapshot = await getDoc(pedidoRef);

      if (pedidoSnapshot.exists()) {
        const pedidoData = pedidoSnapshot.data();
        
        console.log("📋 Datos del pedido:", pedidoData);
        console.log("🔍 Constantes:", { 
          COLECCION_PEDIDO_ACEPTADOS, 
          CAMPOS_PEDIDO_ACEPTADOS 
        });


        if (!CAMPOS_PEDIDO_ACEPTADOS) {
          throw new Error("CAMPOS_PEDIDO_ACEPTADOS no está definido");
        }

        // Crear el documento con la estructura correcta
        const pedidoAceptado = {
          [CAMPOS_PEDIDO_ACEPTADOS.NOMBRE_USUARIO]: pedidoData[CAMPOS_PEDIDO_FARMACIA.NOMBRE_USUARIO] || "No especificado",
          [CAMPOS_PEDIDO_ACEPTADOS.APELLIDO_USUARIO]: pedidoData[CAMPOS_PEDIDO_FARMACIA.APELLIDO_USUARIO] || "No especificado",
          [CAMPOS_PEDIDO_ACEPTADOS.DIRECCION]: pedidoData[CAMPOS_PEDIDO_FARMACIA.DIRECCION] || "No especificado",
          [CAMPOS_PEDIDO_ACEPTADOS.USER_ID]: pedidoData[CAMPOS_PEDIDO_FARMACIA.USER_ID] || "No especificado",
          [CAMPOS_PEDIDO_ACEPTADOS.OBRASOCIAL]: pedidoData[CAMPOS_PEDIDO_FARMACIA.OBRASOCIAL] || "No especificado",
          [CAMPOS_PEDIDO_ACEPTADOS.FECHA_PEDIDO]: pedidoData[CAMPOS_PEDIDO_FARMACIA.FECHA_PEDIDO] || new Date(),
          [CAMPOS_PEDIDO_ACEPTADOS.MEDICAMENTOS]: medicamentos.trim(),
          [CAMPOS_PEDIDO_ACEPTADOS.MONTO]: monto.trim(),
          fechaAceptacion: new Date(),
        };

        // Mover el documento a la colección "PedidosAceptados"
        await setDoc(doc(db, COLECCION_PEDIDO_ACEPTADOS, pedido.id), pedidoAceptado);
        await deleteDoc(pedidoRef);

        console.log(" Pedido aceptado y movido correctamente a PedidosAceptados");
        alert("Pedido aceptado con éxito");
        
        // Resetear el estado
        setMostrarFormulario(false);
        setMedicamentos("");
        setMonto("");
      }
    } catch (error) {
      console.error("Error al aceptar pedido:", error);
      alert(`Error al aceptar el pedido: ${error.message}`);
    }
  };

  const handleCancelarAceptar = () => {
    setMostrarFormulario(false);
    setMedicamentos("");
    setMonto("");
  };

  const handleRechazar = async () => {
    try {
      await deleteDoc(doc(db, "PedidosFarmacia", pedido.id));
      console.log(" Pedido rechazado y eliminado");
      alert("Pedido rechazado y eliminado");
    } catch (error) {
      console.error("Error al rechazar pedido:", error);
      alert("Error al rechazar el pedido.");
    }
  };

  
  const nombre = pedido[CAMPOS_PEDIDO_FARMACIA.NOMBRE_USUARIO] || "No especificado";
  const apellido = pedido[CAMPOS_PEDIDO_FARMACIA.APELLIDO_USUARIO] || "No especificado";
  const direccion = pedido[CAMPOS_PEDIDO_FARMACIA.DIRECCION] || "No especificado";
  const obraSocial = pedido[CAMPOS_PEDIDO_FARMACIA.OBRASOCIAL] || "No especificado";
  const fechaPedido = pedido[CAMPOS_PEDIDO_FARMACIA.FECHA_PEDIDO]?.toDate?.() || null;
  const imagen = pedido[CAMPOS_PEDIDO_FARMACIA.IMAGEN];

  return (
    <View style={styles.card}>
      <View style={styles.imageRow}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}
        <View style={styles.extraTextContainer}>
          <Text style={styles.extraText}>🕓 Pendiente de confirmación</Text>
          <Text style={styles.extraSubText}>Farmacia Central</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>
          Pedido de {nombre} {apellido}
        </Text>
        {direccion && <Text style={styles.text}>Dirección: {direccion}</Text>}
        {obraSocial && <Text style={styles.text}>Obra social: {obraSocial}</Text>}
        {fechaPedido && (
          <Text style={styles.text}>
            Fecha de llegada: {fechaPedido.toLocaleDateString()}{" "}
            {fechaPedido.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {mostrarFormulario ? (
        <View style={styles.formularioContainer}>
          <Text style={styles.formularioTitulo}>Completar información del pedido</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Medicamentos</Text>
            <TextInput
              style={styles.textInput}
              value={medicamentos}
              onChangeText={setMedicamentos}
              placeholder="Ingresar medicamentos recetados"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Monto</Text>
            <View style={styles.montoContainer}>
              <Text style={styles.pesoSign}>$</Text>
              <TextInput
                style={[styles.textInput, styles.montoInput]}
                value={monto}
                onChangeText={setMonto}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formularioActions}>
            <TouchableOpacity
              style={[styles.button, styles.confirmar]}
              onPress={handleConfirmarAceptar}
            >
              <Text style={styles.buttonText}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelar]}
              onPress={handleCancelarAceptar}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.aceptar]}
            onPress={handleAceptarPress}
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.rechazar]}
            onPress={handleRechazar}
          >
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  image: {
    width: "60%",
    height: 700,
    borderRadius: 12,
    marginRight: 12,
  },
  placeholderImage: {
    width: "60%",
    height: 300,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  placeholderText: {
    color: theme.colors.textMuted,
  },
  infoContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formularioContainer: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  formularioTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  montoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pesoSign: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textPrimary,
    marginRight: 8,
    paddingVertical: 12,
  },
  montoInput: {
    flex: 1,
  },
  formularioActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  aceptar: {
    backgroundColor: theme.colors.primary,
  },
  rechazar: {
    backgroundColor: theme.colors.danger,
  },
  confirmar: {
    backgroundColor: theme.colors.success,
  },
  cancelar: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontWeight: "bold",
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  extraTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 8,
  },
  extraText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  extraSubText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import CustomSidebar from "./CustomTab";
import HistorialScreen from "../screens/HistorialScreen";
import PedidosDisponiblesScreen from "../screens/PedidosDisponiblesScreen";
import PedidosEnCursoScreen from "../screens/PedidosEnCursoScreen";
import OfertasEnviadasScreen from "../screens/OfertasEnviadasScreen";
import ProfileScreen from "../screens/ProfileScreen";


export default function AppLayout() {
  const [activeTab, setActiveTab] = useState("Inicio");

  const renderScreen = () => {
    switch (activeTab) {
      case "Pedidos Entrantes":
        return <PedidosDisponiblesScreen />;
       case "Pedidos en curso":
        return <PedidosEnCursoScreen />; 
       case "Historial de Pedidos":
        return <HistorialScreen />; 
       case "Perfil":
        return <ProfileScreen />;
       case "Ofertas Enviadas":
        return <OfertasEnviadasScreen />;
      default:
        return <PedidosDisponiblesScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>RappiFarma</Text>
      </View>

      {/* Body: Sidebar + contenido */}
      <View style={styles.body}>
        <CustomSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <View style={styles.screenContainer}>{renderScreen()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 60,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  screenContainer: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
});

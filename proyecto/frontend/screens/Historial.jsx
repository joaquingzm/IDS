import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator // Para mostrar que está cargando
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import HistorialCard from '../components/PedidoHistorialCard';
import { COLECCION_PEDIDO, CAMPOS_PEDIDO, ESTADOS_PEDIDO } from "../dbConfig";
import { listPedidosByUser } from '../utils/firestoreService';



export default function OrderHistoryScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
        if (!currentUserId) {
          setPedidos([]);
          setLoading(false);
          return;
        }

        const allPedidos = await listPedidosByUser(currentUserId);


        const pedidosRealizados = allPedidos.filter(
          (p) => (p[CAMPOS_PEDIDO.ESTADO] ?? p.estado) === ESTADOS_PEDIDO.REALIZADO
        );

        const pedidosEnriquecidos = await Promise.all(
          pedidosRealizados.map(async (pedido) => {
            try {
              const ofertas = await firestoreService.listOfertasForPedido(pedido.id);
              const ofertaGanadora = ofertas.find(
                (of) => of[CAMPOS_OFERTA.ESTADO] === "ACEPTADA"
              );

              let farmacia = null;
              if (ofertaGanadora?.farmaciaId) {
                farmacia = await firestoreService.getFarmaciaById(ofertaGanadora.farmaciaId);
              }

              return { pedido, oferta: ofertaGanadora, farmacia };
            } catch (err) {
              console.warn("Error al enriquecer pedido:", pedido.id, err);
              return { pedido, oferta: null, farmacia: null };
            }
          })
        );

        setPedidos(pedidosEnriquecidos);
      } catch (error) {
        console.error("Error cargando historial: ", error);
        Alert.alert("Error", "No se pudo cargar el historial.");
      }
      setLoading(false);
    };

    fetchPedidos();
  }, []);


  const renderPedidos = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (pedidos.length > 0) {
      return pedidosCompletos.map(({ pedido, oferta, farmacia }) => (
        <HistorialCard
          key={pedido.id}
          pedido={pedido}
          oferta={oferta}
          farmacia={farmacia}
        />
      ));
    } else {
      return (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Ionicons name="document-text-outline" size={40} color={theme.colors.mutedForeground} />
          <Text style={styles.emptyText}>No tienes pedidos en tu historial</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
      </View>

      <View style={styles.alertBox}>
        <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.alertText}>
          {loading
            ? "Cargando pedidos..."
            : `Tienes ${pedidos.length} pedidos en tu historial`}
        </Text>
      </View>

      <ScrollView style={styles.content}>{renderPedidos()}</ScrollView>
    </SafeAreaView>
  );
}
// Estilos (similares a OfertsScreen)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  alertText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: '#1e40af',
  },
  emptyText: { // Este ya no se usa si usamos PedidoCard como fallback
    textAlign: 'center',
    color: theme.colors.mutedForeground,
    marginTop: 40,
    fontSize: 16,
  },
});
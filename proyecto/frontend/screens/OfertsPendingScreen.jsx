import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase'; 
import {  ESTADOS_PEDIDO } from '../dbConfig';
import { listPedidosByUser, listOfertasForPedido,} from "../utils/firestoreService";
import OfertaCard from "../components/OfertaCard";


export default function OfertasUsuarioScreen({ navigation }) {
  const [pedidosConOfertas, setPedidosConOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPedidosYOfertas = async () => {
      setLoading(true);
      try {
        const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
        if (!currentUserId) {
          setPedidosConOfertas([]);
          setLoading(false);
          return;
        }

        // Agarro TODOS los pedidos del usuario
        const pedidos = await listPedidosByUser(currentUserId);
        
        // Filtro los pedidos de estado pendiente
        const pedidosPendientes = pedidos.filter(pedido => 
          pedido.estado === ESTADOS_PEDIDO.PENDIENTE
        );

        // Para cada pedido pendiente obtengo sus ofertas
        const pedidosConOfertasData = [];
        
        for (const pedido of pedidosPendientes) {
          try {
            const ofertas = await listOfertasForPedido(pedido.id);
            
            // Filtro solo ofertas de estado pendiente
            const ofertasPendientes = ofertas.filter(oferta => 
              oferta.estado === 'pendiente'
            );

            if (ofertasPendientes.length > 0) {
              pedidosConOfertasData.push({
                ...pedido,
                ofertas: ofertasPendientes
              });
            }
          } catch (error) {
            console.error(`Error cargando ofertas para pedido ${pedido.id}:`, error);
          }
        }

        setPedidosConOfertas(pedidosConOfertasData);
        setLoading(false);

      } catch (error) {
        console.error("Error cargando pedidos: ", error);
        Alert.alert("Error", "No se pudo cargar la lista de pedidos.");
        setLoading(false);
      }
    };

    cargarPedidosYOfertas();
  }, []);

  const contarOfertasTotales = () => {
    return pedidosConOfertas.reduce((total, pedido) => total + pedido.ofertas.length, 0);
  };

  const renderPedidosConOfertas = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (pedidosConOfertas.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color={theme.colors.mutedForeground} />
          <Text style={styles.emptyText}>
            No tienes ofertas disponibles por ahora.
          </Text>
          <Text style={styles.emptySubtext}>
            Cuando las farmacias hagan ofertas para tus pedidos, aparecerán aquí.
          </Text>
        </View>
      );
    }

    return pedidosConOfertas.map(pedido => (
      <View key={pedido.id} style={styles.pedidoContainer}>
        <Text style={styles.pedidoTitle}>
          Pedido del {pedido.fechaPedido?.toDate?.().toLocaleDateString() || 'Fecha no disponible'}
        </Text>
        <Text style={styles.pedidoEstado}>Estado: {pedido.estado}</Text>
        
        {pedido.ofertas.map(oferta => (
          <OfertaCard 
            key={oferta.id} 
            oferta={oferta} 
            pedidoId={pedido.id}
            pedidoData={pedido}
          />
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Ofertas</Text>
      </View>

      {/* Alerta simple */}
      <View style={styles.alertBox}>
        <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.alertText}>
          {loading 
            ? "Cargando ofertas..." 
            : `Tienes ${contarOfertasTotales()} ofertas en ${pedidosConOfertas.length} pedidos`}
        </Text>
      </View>

      {/* Listado de ofertas */}
      <ScrollView style={styles.content}>
        {renderPedidosConOfertas()}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.mutedForeground,
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    color: theme.colors.mutedForeground,
    marginTop: 8,
    fontSize: 14,
  },
  pedidoContainer: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
  },
  pedidoTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  pedidoEstado: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.md,
  },
});

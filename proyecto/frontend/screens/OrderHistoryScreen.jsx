import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, // 1. CAMBIAMOS FLATLIST POR SCROLLVIEW
  Alert,
  ActivityIndicator // Para mostrar que está cargando
} from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase'; 
import { collection, query, getDocs, where } from 'firebase/firestore'; 
import PedidoCard from '../components/PedidoCard'; // REUTILIZAMOS TU COMPONENTE

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

        const q = query(
          collection(db, "pedidos"), 
          where("userId", "==", currentUserId)
        );
        
        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPedidos(lista);
      } catch (error) {
        console.error("Error cargando historial: ", error);
        Alert.alert("Error", "No se pudo cargar el historial.");
      }
      setLoading(false);
    };

    fetchPedidos();
  }, []);

  // 2. FUNCIÓN PARA DECIDIR QUÉ RENDERIZAR
  const renderPedidos = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (pedidos.length > 0) {
      // 3. Mapeamos los pedidos y (aquí está la clave)
      // NO le pasamos props a tu PedidoCard, ya que el tuyo
      // tiene su propia lógica interna para mostrar "No se tiene un pedido actual"
      // o el pedido hardcodeado (según tu useEffect comentado).
      
      // *** IMPORTANTE ***
      // Si querés que PedidoCard muestre los datos reales, 
      // tenés que modificarlo para que acepte 'pedido={item}' como prop.
      // Pero si solo querés que renderice tu componente (que muestra "No hay pedido"),
      // esta es la forma:
      return pedidos.map(pedido => (
        <PedidoCard key={pedido.id} /> 
      ));

    } else {
      // Si no hay pedidos, renderizamos PedidoCard una vez
      // (que mostrará "No se tiene un pedido actual")
      return <PedidoCard />;
    }
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
        <Text style={styles.headerTitle}>Historial de Pedidos</Text>
      </View>

      {/* Alerta simple */}
      <View style={styles.alertBox}>
        <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.alertText}>
          {loading ? "Cargando pedidos..." : `Tienes ${pedidos.length} pedidos en tu historial`}
        </Text>
      </View>

      {/* 4. Usamos ScrollView en lugar de FlatList */}
      <ScrollView style={styles.content}>
        {renderPedidos()}
      </ScrollView>
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
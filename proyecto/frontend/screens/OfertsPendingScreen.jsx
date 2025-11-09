import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase'; 
import { collection, query, getDocs, where } from 'firebase/firestore'; 
import OfertaCard from '../components/OfertaCard'; 
import { COLECCION_OFERTA, CAMPOS_Oferta } from '../dbConfig';

export default function OfertasUsuarioScreen({ navigation }) {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfertas = async () => {
      setLoading(true);
      try {
        const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
        if (!currentUserId) {
          setOfertas([]);
          setLoading(false);
          return;
        }

        // 🔎 Consulta Firestore usando tus constantes
        const q = query(
          collection(db, COLECCION_OFERTA),
          where(CAMPOS_Oferta.USER_ID, "==", currentUserId)
        );
        
        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setOfertas(lista);
      } catch (error) {
        console.error("Error cargando ofertas: ", error);
        Alert.alert("Error", "No se pudo cargar la lista de ofertas.");
      }
      setLoading(false);
    };

    fetchOfertas();
  }, []);

  const renderOfertas = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }

    if (ofertas.length === 0) {
      return (
        <Text style={styles.emptyText}>
          No tienes ofertas disponibles por ahora.
        </Text>
      );
    }

    return ofertas.map(oferta => (
      <OfertaCard key={oferta.id} pedido={oferta} />
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
            : `Tienes ${ofertas.length} ofertas disponibles`}
        </Text>
      </View>

      {/* Listado de ofertas */}
      <ScrollView style={styles.content}>
        {renderOfertas()}
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
  emptyText: {
    textAlign: 'center',
    color: theme.colors.mutedForeground,
    marginTop: 40,
    fontSize: 16,
  },
});

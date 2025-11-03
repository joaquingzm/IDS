import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../styles/theme';
import PedidoCard from '../components/PedidoCard';
import { StatusCardButton } from '../components/StatusCardButton'; 

export default function OfertsScreen({ navigation }) {
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RappiFarma</Text>
        <Text style={styles.headerSubtitle}>Disponible 24/7</Text>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Tus Pedidos</Text>

        {/* Tarjeta de pedido */}
        <PedidoCard />

        {/* Espacio entre secciones */}
        <View style={{ height: 20 }} />

        {/* Botones debajo del pedido */}
        <StatusCardButton
          iconName="time-outline"
          title="Historial de Pedidos"
          description="Revisá tus pedidos anteriores"
          targetScreen="OrderHistory"
          navigation={navigation}
        />

        <StatusCardButton
          iconName="pricetags-outline"
          title="Ofertas Hechas"
          description="Mirá tus ofertas activas"
          targetScreen="MyOffers"
          navigation={navigation}
        />
      </View>
    </ScrollView>
  );
}
// en el scroll view se pueden meter mas de un pedido con esto 
/*
const [pedidos, setPedidos] = useState([]);

useEffect(() => {
  const fetchPedidos = async () => {
    const querySnapshot = await getDocs(collection(db, "pedidos"));
    const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPedidos(lista);
  };
  fetchPedidos();
}, []);
El ScroolViwe adentro de el view
<ScrollView>
    {pedidos.length > 0 ? (
      pedidos.map(pedido => (
        <PedidoCard key={pedido.id} texto={pedido.descripcion} />
      ))
    ) : (
      <PedidoCard texto="No se tiene un pedido actual" />
    )}
  </ScrollView>
*/


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  headerSubtitle: {
    color: theme.colors.background,
    marginTop: 4,
  },
  content: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
});
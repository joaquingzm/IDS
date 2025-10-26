import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "../styles/global";
import { theme } from "../styles/theme";
import { openCameraAndTakePhoto } from "../utils/cameraUtils";

export default function HomeScreen() {
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);

  const coupons = [
    { id: "1", title: "15% OFF", desc: "Medicamentos con receta", exp: "19/10/2025" },
    { id: "2", title: "20% OFF", desc: "Cuidado personal", exp: "24/10/2025" },
    { id: "3", title: "10% OFF", desc: "Vitaminas y suplementos", exp: "17/10/2025" },
    { id: "4", title: "25% OFF", desc: "Todos los productos", exp: "14/10/2025" },
  ];

  const handleCouponPress = (id) => {
    setSelectedCoupon(id);
    setTimeout(() => setSelectedCoupon(null), 200);
  };

  const handleCameraPress = async () => {
    const uri = await openCameraAndTakePhoto();
    if (uri) setPhotoUri(uri);
  };

  return (
    <View style={[globalStyles.container, { padding: 0 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RappiFarma</Text>
        <Text style={styles.headerSubtitle}>Disponible 24/7</Text>
      </View>

      {/* Cupones */}
      <FlatList
        data={coupons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.couponList}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => handleCouponPress(item.id)}
            style={[
              styles.couponCard,
              selectedCoupon === item.id && { opacity: 0.5 },
            ]}
          >
            <View style={styles.iconBox}>
              <Ionicons name="ticket-outline" size={28} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.couponTitle}>{item.title}</Text>
              <Text style={styles.couponDesc}>{item.desc}</Text>
              <Text style={styles.couponExp}>Válido hasta {item.exp}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Barra inferior */}
      <View style={styles.bottomBar}>
        <Ionicons name="home-outline" size={24} color={theme.colors.primary} />
        <Ionicons name="search-outline" size={24} color={theme.colors.mutedForeground} />
        <TouchableOpacity onPress={handleCameraPress} style={styles.cameraButton}>
          <Ionicons name="camera" size={28} color={theme.colors.background} />
        </TouchableOpacity>
        <Ionicons name="cart-outline" size={24} color={theme.colors.mutedForeground} />
        <Ionicons name="person-outline" size={24} color={theme.colors.mutedForeground} />
      </View>

      {/* Preview de la foto */}
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  couponList: {
    padding: theme.spacing.md,
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconBox: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginRight: 12,
  },
  couponTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
  },
  couponDesc: {
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.sm,
  },
  couponExp: {
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 3,
  },
  expiredTag: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
    marginLeft: 6,
  },
  expiredText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.destructive,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  cameraButton: {
    backgroundColor: theme.colors.primary,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  previewImage: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});
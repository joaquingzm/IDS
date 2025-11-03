import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { useNavigation } from "@react-navigation/native";

export function StatusCardButton({ iconName, title, description, targetScreen }) {
  const navigation = useNavigation(); // 👈 obtenés la navegación directamente

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => targetScreen && navigation.navigate(targetScreen)}
    >
      <View style={styles.iconBox}>
        <Ionicons name={iconName} size={28} color={theme.colors.primary} />
      </View>

      <View style={styles.textBox}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>

      {targetScreen && (
        <Ionicons
          name="chevron-forward"
          size={24}
          color={theme.colors.mutedForeground}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconBox: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
  },
  cardDesc: {
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
  },
});
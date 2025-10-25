/*Estilos base para toda la app*/
import { StyleSheet } from "react-native";
import { colors } from "./theme";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
});
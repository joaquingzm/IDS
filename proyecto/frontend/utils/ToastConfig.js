import { BaseToast, ErrorToast } from "react-native-toast-message";

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#22c55e",
        maxWidth: "90%",          // 🔹 se adapta al ancho de pantalla
        minHeight: 60,            // 🔹 altura mínima
        alignSelf: "center",
        flexWrap: "wrap",         // 🔹 permite que el texto salte de línea
        paddingRight: 10,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1NumberOfLines={0}       // 🔹 sin límite de líneas
      text2NumberOfLines={0}
      text1Style={{
        fontSize: 14,
        fontWeight: "600",
        flexWrap: "wrap",
        width: "100%",
      }}
      text2Style={{
        fontSize: 12,
        color: "#666",
        flexWrap: "wrap",
        width: "100%",
      }}
    />
  ),

  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#ef4444",
        maxWidth: "90%",
        minHeight: 60,
        alignSelf: "center",
        flexWrap: "wrap",
        paddingRight: 10,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1NumberOfLines={0}
      text2NumberOfLines={0}
      text1Style={{
        fontSize: 14,
        fontWeight: "600",
        flexWrap: "wrap",
        width: "100%",
      }}
      text2Style={{
        fontSize: 12,
        flexWrap: "wrap",
        width: "100%",
      }}
    />
  ),
};

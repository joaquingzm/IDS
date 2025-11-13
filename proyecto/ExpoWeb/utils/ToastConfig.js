import { BaseToast, ErrorToast } from "react-native-toast-message";

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#22c55e",
        height: 60,
        width: 350,
      }}
      text1Style={{
        fontSize: 14,
        fontWeight: "600",
      }}
      text2Style={{
        fontSize: 12,
        color: "#666",
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#ef4444",
        height: 60,
        width: 350,
      }}
      text1Style={{
        fontSize: 14,
        fontWeight: "600",
      }}
      text2Style={{
        fontSize: 12,
      }}
    />
  ),
};

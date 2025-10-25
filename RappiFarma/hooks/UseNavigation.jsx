import { useNavigation } from "@react-navigation/native";

export default function useNav() {
  const navigation = useNavigation();

  // funciones predefinidas
  const goHome = () => navigation.replace("Home");
  const goLogin = () => navigation.replace("Login");

  return { navigation, goHome, goLogin };
}

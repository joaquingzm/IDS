import Toast from "react-native-toast-message";
import * as Burnt from "burnt";
import { alertPresets } from "./alertPresets";

export function showAlert(key, params = {}) {
  const presetBase = key ? alertPresets[key] : null;

  if (!presetBase && !params.type) {
    console.warn(`⚠️ No existe el preset de alerta: ${key}`);
    return;
  }

  const preset = { ...presetBase, ...params };

  // Interpolamos variables tipo {{nombre}}
  const interpolate = (text = "") =>
    text.replace(/\{\{(.*?)\}\}/g, (_, k) => params[k.trim()] ?? "");

  // --- ALERTAS CON BOTONES ---
  if (preset.type === "alert") {
    Burnt.alert({
      title: interpolate(preset.title),
      message: interpolate(preset.message),
      actions:
        typeof preset.actions === "function"
          ? preset.actions(params)
          : preset.actions,
    });
    return;
  }

  // --- TOASTS (react-native-toast-message) ---
  Toast.show({
    type: preset.preset ?? "info", // success | error | info
    text1: interpolate(preset.title),
    text2: interpolate(preset.message),
    position: "top",
    visibilityTime: preset.duration ? preset.duration * 1000 : 2500,
  });
}
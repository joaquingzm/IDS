// ConfirmService.js
import React, { useState, useRef, useEffect } from "react";
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { alertPresets } from "./alertPresets"; // el archivo anterior

let _openConfirm = null;

/**
 * confirm(presetKey, params) -> Promise<boolean>
 * Uso: const ok = await confirm('confirmar_eliminar_pedido', { id, image: uri });
 */
export const confirm = (presetKey, params = {}) => {
  return new Promise((resolve) => {
    if (typeof _openConfirm !== "function") {
      console.warn("ConfirmProvider no está montado. Asegurate de envolver la App con <ConfirmProvider />");
      resolve(false);
      return;
    }
    _openConfirm(presetKey, params, resolve);
  });
};

export function ConfirmProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState({ presetKey: null, params: {} });
  const resolverRef = useRef(null);

  // función que podrá invocarse desde confirm()
  const openConfirm = (presetKey, params, resolver) => {
    setCurrent({ presetKey, params });
    resolverRef.current = resolver;
    setVisible(true);
  };

  useEffect(() => {
    _openConfirm = openConfirm;
    return () => {
      _openConfirm = null;
    };
  }, []);

  if (!visible || !current.presetKey) {
    return <>{children}</>;
  }

  const preset = alertPresets[current.presetKey];
  if (!preset) {
    console.warn("Preset no encontrado:", current.presetKey);
    // cerrar y resolver false por seguridad
    resolverRef.current && resolverRef.current(false);
    setVisible(false);
    return <>{children}</>;
  }

  const { title, message } = preset;
  const params = current.params || {};
  const imageSource = params.image || null;

  const handleResolve = (value) => {
    setVisible(false);
    const r = resolverRef.current;
    resolverRef.current = null;
    r && r(value);
  };

  return (
    <>
      {children}
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            {imageSource ? (
              <Image source={typeof imageSource === "string" ? { uri: imageSource } : imageSource} style={styles.image} resizeMode="contain" />
            ) : null}

            <Text style={styles.title}>
              {title ? title.replace("{{id}}", params.id ?? "") : ""}
            </Text>

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.actionsRow}>
                <Pressable style={[styles.button, styles.continueBtn]} onPress={() => handleResolve(true)}>
                <Text style={styles.continueText}>Confirmar</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.cancelBtn]} onPress={() => handleResolve(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  image: {
  width: "100%",
  height: 260,      // 🔥 más grande
  borderRadius: 12,
  marginBottom: 15,
    },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    color: "#444",
  },
  actionsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#c7c4c4ff",
  },
  continueBtn: {
    backgroundColor: "#ff8f05ff",
  },
  cancelText: { fontSize: 16, color: "black", fontWeight: "700" },
  continueText: { fontSize: 16, color: "black", fontWeight: "700" },
});

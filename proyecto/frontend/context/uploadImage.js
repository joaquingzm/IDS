export async function uploadImageToCloudinary(uri, { uploadPreset = "preset_gratuito", cloudName = "dfzo3p0yo", maxRetries = 1 } = {}) {
  if (!uri) throw new Error("uploadImageToCloudinary: se requiere un uri válido");

  // Intentos (retry simple en caso de fallos transitorios)
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 1) fetch the uri -> blob (funciona tanto en web como en móvil)
      const response = await fetch(uri);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`No se pudo leer el uri. status=${response.status} body=${text}`);
      }
      const blob = await response.blob();

      // 2) formData
      const formData = new FormData();
      const filename = `photo_${Date.now()}.jpg`;
      formData.append("file", blob, filename);
      formData.append("upload_preset", uploadPreset);

      // 3) POST a Cloudinary
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      // 4) parse respuesta (podría no ser JSON si falla)
      let data;
      try {
        data = await res.json();
      } catch (e) {
        const txt = await res.text().catch(() => null);
        throw new Error(`Cloudinary no devolvió JSON. status=${res.status} body=${txt}`);
      }

      if (!res.ok) {
        console.error("❌ Error Cloudinary:", data);
        throw new Error(data?.error?.message || `Error al subir la imagen a Cloudinary (status ${res.status})`);
      }

      if (!data.secure_url && !data.url) {
        throw new Error("Cloudinary respondió sin secure_url");
      }

      console.log("✅ Subida exitosa a Cloudinary:", data.secure_url || data.url);
      return data.secure_url || data.url;
    } catch (error) {
      console.warn(`uploadImageToCloudinary attempt ${attempt} failed:`, error);
      lastErr = error;
      // si quedan reintentos, esperamos un poco (backoff simple)
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }
    }
  }

  // Si llegamos acá, todos los intentos fallaron
  console.error("uploadImageToCloudinary: todos los intentos fallaron", lastErr);
  throw lastErr;
}
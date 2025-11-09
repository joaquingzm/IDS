export async function uploadImageToCloudinary(uri) {
  const CLOUD_NAME = "dfzo3p0yo";
  const UPLOAD_PRESET = "preset_gratuito";

  const formData = new FormData();

    const response = await fetch(uri);
  const blob = await response.blob();
  formData.append("file", blob, `photo_${Date.now()}.jpg`);

  formData.append("upload_preset", UPLOAD_PRESET);
  

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌Error Cloudinary:", data);
      throw new Error(`Error al subir la imagen a Cloudinary: ${data.error?.message || "sin mensaje"}`);
    }

    console.log(" Subida exitosa a Cloudinary:", data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error("Error subiendo imagen a Cloudinary:", error);
    throw error;
  }
}


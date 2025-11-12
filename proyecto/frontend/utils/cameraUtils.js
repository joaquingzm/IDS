import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export async function openCameraAndTakePhoto() {
  try {
    // 1. Permisos (solo en móvil)
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        alert('Se necesitan permisos de cámara y galería');
        return null;
      }
    }


    // 2. Tomar foto
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    // 3. Validar resultado
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const uri = result.assets[0].uri;

    console.log('URI de foto (para usar en app):', uri);
    return uri;

  } catch (error) {
    console.error('Error al tomar foto:', error);
    alert('No se pudo tomar la foto');
    return null;
  }
}
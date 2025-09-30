import * as ImagePicker from 'expo-image-picker';

export class MediaService {
  static async ensureCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  }

  static async ensureMediaLibraryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === ImagePicker.PermissionStatus.GRANTED;
  }

  static async capturePhoto(options = {}) {
    const hasPermission = await this.ensureCameraPermission();
    if (!hasPermission) {
      return { cancelled: true, reason: 'permission_denied' };
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      ...options,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets?.[0];
    return asset ? { cancelled: false, uri: asset.uri } : { cancelled: true };
  }

  static async pickImage(options = {}) {
    const hasPermission = await this.ensureMediaLibraryPermission();
    if (!hasPermission) {
      return { cancelled: true, reason: 'permission_denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      ...options,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets?.[0];
    return asset ? { cancelled: false, uri: asset.uri } : { cancelled: true };
  }
}

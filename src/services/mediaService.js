import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

let FileSystem;

try {
  FileSystem = require('expo-file-system/legacy');
} catch (error) {
  FileSystem = require('expo-file-system');
}

let MediaLibrary = null;
try {
  MediaLibrary = require('expo-media-library');
} catch (error) {}

const SAMPLE_IMAGE_DIR = `${FileSystem.documentDirectory}sample-images`;

const statAsync = FileSystem.statAsync ?? FileSystem.getInfoAsync;

async function safeStat(path) {
  try {
    return await statAsync(path);
  } catch (error) {
    return null;
  }
}

async function ensureSampleDir() {
  const dirInfo = await safeStat(SAMPLE_IMAGE_DIR);
  if (!dirInfo || !dirInfo.exists) {
    const makeDirAsync = FileSystem.makeDirectoryAsync ?? FileSystem.makeDirAsync;
    if (makeDirAsync) {
      await makeDirAsync(SAMPLE_IMAGE_DIR, { intermediates: true });
    }
  }
}

async function saveToDeviceLibrary(uri) {
  if (!MediaLibrary || !uri) {
    return;
  }

  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
  } catch (error) {
    console.error('Galeri kaydetme hatası:', error);
  }
}

async function processAsset(asset) {
  if (!asset?.uri) {
    return { cancelled: true };
  }

  await ensureSampleDir();

  let workingAsset = asset;

  const resizeActions = [];
  if (asset.width && asset.width > 1024) {
    resizeActions.push({ resize: { width: 1024 } });
  }

  if (resizeActions.length > 0) {
    const manipResult = await ImageManipulator.manipulateAsync(
      asset.uri,
      resizeActions,
      {
        compress: 0.65,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    workingAsset = { ...asset, uri: manipResult.uri };
  }

  const fileName = `sample_${Date.now()}.jpg`;
  const destination = `${SAMPLE_IMAGE_DIR}/${fileName}`;

  await FileSystem.copyAsync({ from: workingAsset.uri, to: destination });
  const info = await safeStat(destination) ?? {};

  return {
    cancelled: false,
    uri: destination,
    size: info.size ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
  };
}

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
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      saveToPhotos: true,
      ...options,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets?.[0];
    if (asset?.uri) {
      await saveToDeviceLibrary(asset.uri);
    }
    return processAsset(asset);
  }

  static async pickImage(options = {}) {
    const hasPermission = await this.ensureMediaLibraryPermission();
    if (!hasPermission) {
      return { cancelled: true, reason: 'permission_denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
      ...options,
    });

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets?.[0];
    return processAsset(asset);
  }

  static async deletePhoto(uri) {
    if (!uri) {
      return;
    }

    const info = await safeStat(uri);
    if (info?.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  }

  static async saveToDeviceLibrary(uri) {
    return saveToDeviceLibrary(uri);
  }
}

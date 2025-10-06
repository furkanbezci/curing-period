import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform, PermissionsAndroid } from 'react-native';

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

async function ensureAndroidMediaPermission() {
  if (Platform.OS !== 'android' || !PermissionsAndroid?.request) {
    return true;
  }

  try {
    const sdkInt = Platform.Version ?? 0;

    if (sdkInt >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ].filter(Boolean);

    if (!permissions.length) {
      return true;
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);
    return permissions.every(perm => results?.[perm] === PermissionsAndroid.RESULTS.GRANTED);
  } catch (error) {
    console.error('Android galeri izni alınamadı:', error);
    return false;
  }
}

function hasMediaLibraryAccess(permission) {
  if (!permission) {
    return false;
  }

  if (permission.granted) {
    return true;
  }

  const privilege = permission.accessPrivileges;
  return privilege === 'limited' || privilege === 'addOnly';
}

async function ensureMediaLibraryAccess() {
  if (!MediaLibrary) {
    return false;
  }

  try {
    if (typeof MediaLibrary.getPermissionsAsync === 'function') {
      const current = await MediaLibrary.getPermissionsAsync();
      if (hasMediaLibraryAccess(current)) {
        return true;
      }
    }

    if (Platform.OS === 'android') {
      const androidGranted = await ensureAndroidMediaPermission();
      if (!androidGranted) {
        return false;
      }

      if (typeof MediaLibrary.getPermissionsAsync === 'function') {
        const afterAndroid = await MediaLibrary.getPermissionsAsync();
        if (hasMediaLibraryAccess(afterAndroid)) {
          return true;
        }
      }
    }

    const requested = Platform.OS === 'ios'
      ? await MediaLibrary.requestPermissionsAsync({ accessPrivileges: 'addOnly' })
      : await MediaLibrary.requestPermissionsAsync();
    return hasMediaLibraryAccess(requested);
  } catch (error) {
    console.error('Galeri izinleri alınamadı:', error);
    return false;
  }
}

async function saveToDeviceLibrary(uri) {
  if (!MediaLibrary || !uri) {
    return false;
  }

  const hasPermission = await ensureMediaLibraryAccess();
  if (!hasPermission) {
    return false;
  }

  try {
    if (typeof MediaLibrary.saveToLibraryAsync === 'function') {
      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    }

    await MediaLibrary.createAssetAsync(uri);
    return true;
  } catch (error) {
    console.error('Galeri kaydetme hatası:', error);
    return false;
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
    const response = await ImagePicker.requestCameraPermissionsAsync();
    return response?.granted ?? false;
  }

  static async ensureMediaLibraryPermission(writeOnly = true) {
    const response = await ImagePicker.requestMediaLibraryPermissionsAsync(writeOnly);
    return response?.granted ?? false;
  }

  static async capturePhoto(options = {}) {
    const { saveToGallery = true, ...pickerOptions } = options;

    const hasCameraPermission = await this.ensureCameraPermission();
    if (!hasCameraPermission) {
      return { cancelled: true, reason: 'permission_denied' };
    }

    if (saveToGallery) {
      await ensureMediaLibraryAccess();
    }

    let result;
    try {
      result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        saveToPhotos: saveToGallery,
        ...pickerOptions,
      });
    } catch (error) {
      const message = error?.message ?? '';
      if (message.toLowerCase().includes('camera') && message.toLowerCase().includes('available')) {
        return { cancelled: true, reason: 'camera_unavailable' };
      }
      throw error;
    }

    if (result.canceled) {
      return { cancelled: true };
    }

    const asset = result.assets?.[0];
    const processed = await processAsset(asset);

    if (!processed.cancelled && processed.uri && saveToGallery) {
      const savedOriginal = asset?.uri ? await saveToDeviceLibrary(asset.uri) : false;
      if (!savedOriginal && processed.uri !== asset?.uri) {
        await saveToDeviceLibrary(processed.uri);
      }
    }

    return processed;
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

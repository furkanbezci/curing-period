import { Alert } from 'react-native';
import { StorageService } from '../services/storageService';
import { NotificationService } from '../services/notificationService';
import { MediaService } from '../services/mediaService';
import { CalendarService } from '../services/calendarService';

export async function runAppInitialization() {
  await NotificationService.initialize();
  const hasPermission = await NotificationService.requestPermissions();

  if (!hasPermission) {
    Alert.alert(
      'Bildirim İzni',
      'Bildirimler için izin verilmedi. Uygulama tam işlevsel olmayabilir.'
    );
  }

  let loadedSamples;
  try {
    loadedSamples = await StorageService.loadSamples();
  } catch (error) {
    console.error('Numuneler yüklenemedi:', error);
    loadedSamples = [];
  }

  const storedSettings = (await StorageService.loadSettings()) || {};
  let initialSavePreference =
    typeof storedSettings.saveToGalleryEnabled === 'boolean'
      ? storedSettings.saveToGalleryEnabled
      : true;

  if (initialSavePreference) {
    try {
      const galleryStatus = await MediaService.getSaveToGalleryAccessStatus();
      if (!galleryStatus.granted) {
        initialSavePreference = false;
        await StorageService.saveSettings({
          ...storedSettings,
          saveToGalleryEnabled: false,
        });
      }
    } catch (error) {
      console.error('Galeri izin durumu kontrol edilemedi:', error);
      initialSavePreference = false;
    }
  }

  const calendarGranted = await CalendarService.requestPermissions();
  console.log('√calendarGranted', calendarGranted);
  if (!calendarGranted) {
    console.warn('Takvim izni verilmedi.');
  }

  return {
    samples: loadedSamples,
    saveToGalleryEnabled: initialSavePreference,
    calendarPermissionGranted: calendarGranted,
  };
}

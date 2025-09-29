import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export class StorageService {
  static async saveSamples(samples) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(samples));
      return true;
    } catch (error) {
      console.error('Numuneler kaydedilemedi:', error);
      return false;
    }
  }

  static async loadSamples() {
    try {
      const samples = await AsyncStorage.getItem(STORAGE_KEYS.SAMPLES);
      return samples ? JSON.parse(samples) : [];
    } catch (error) {
      console.error('Numuneler yüklenemedi:', error);
      return [];
    }
  }

  static async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Ayarlar kaydedilemedi:', error);
      return false;
    }
  }

  static async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
      return {};
    }
  }

  static async clearAllData() {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.SAMPLES, STORAGE_KEYS.SETTINGS]);
      return true;
    } catch (error) {
      console.error('Veriler temizlenemedi:', error);
      return false;
    }
  }
}

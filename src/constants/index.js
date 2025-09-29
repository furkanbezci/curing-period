export const COLORS = {
  primary: '#2563EB',
  secondary: '#64748B',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  light: '#F8FAFC',
  dark: '#1E293B',
  white: '#FFFFFF',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
};

export const CURE_PERIODS = [
  { label: '3 Gün', value: 3, description: 'Erken mukavemet' },
  { label: '7 Gün', value: 7, description: 'Standart kontrol' },
  { label: '14 Gün', value: 14, description: 'Orta süre' },
  { label: '28 Gün', value: 28, description: 'Tam mukavemet' },
  { label: '56 Gün', value: 56, description: 'Uzun süre' },
  { label: '90 Gün', value: 90, description: 'Çok uzun süre' }
];

export const STORAGE_KEYS = {
  SAMPLES: 'beton_kur_samples_v2',
  SETTINGS: 'beton_kur_settings'
};

export const NOTIFICATION_CHANNELS = {
  CURE_REMINDER: 'cure_reminder',
  CURE_COMPLETED: 'cure_completed'
};

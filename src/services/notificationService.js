import * as Notifications from 'expo-notifications';
import { NOTIFICATION_CHANNELS } from '../constants';

export class NotificationService {
  static async initialize() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await this.createNotificationChannels();
  }

  static async createNotificationChannels() {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CURE_REMINDER, {
      name: 'Kür Hatırlatıcı',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CURE_COMPLETED, {
      name: 'Kür Tamamlandı',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
    });
  }

  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  static async scheduleCureNotification(sampleId, sampleName, dueDate) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Beton Kür Süresi Doldu',
          body: `${sampleName} numunesinin ${this.formatDueDate(dueDate)} tarihinde kür süresi tamamlandı.`,
          sound: true,
          data: { sampleId, type: 'cure_completed' },
        },
        trigger: new Date(dueDate),
      });

      return notificationId;
    } catch (error) {
      console.error('Bildirim planlanamadı:', error);
      return null;
    }
  }

  static async scheduleReminderNotification(sampleId, sampleName, reminderDate) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Kür Hatırlatması',
          body: `${sampleName} numunesinin kür süresi yaklaşıyor. Kontrol edin.`,
          sound: true,
          data: { sampleId, type: 'cure_reminder' },
        },
        trigger: new Date(reminderDate),
      });

      return notificationId;
    } catch (error) {
      console.error('Hatırlatma planlanamadı:', error);
      return null;
    }
  }

  static async cancelNotification(notificationId) {
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        return true;
      } catch (error) {
        console.error('Bildirim iptal edilemedi:', error);
        return false;
      }
    }
    return true;
  }

  static formatDueDate(date) {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

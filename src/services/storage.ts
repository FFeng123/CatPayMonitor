import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig, PaymentNotification, STORAGE_KEYS } from '../types';

export const storageService = {
  // Save server URL
  async setServerUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
  },

  // Get server URL
  async getServerUrl(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
  },

  // Save device key
  async setDeviceKey(key: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_KEY, key);
  },

  // Get device key
  async getDeviceKey(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.DEVICE_KEY);
  },

  // Get full config
  async getConfig(): Promise<AppConfig | null> {
    const [serverUrl, deviceKey] = await Promise.all([
      this.getServerUrl(),
      this.getDeviceKey(),
    ]);

    if (serverUrl && deviceKey) {
      return { serverUrl, deviceKey };
    }
    return null;
  },

  // Save full config
  async setConfig(config: AppConfig): Promise<void> {
    await Promise.all([
      this.setServerUrl(config.serverUrl),
      this.setDeviceKey(config.deviceKey),
    ]);
  },

  // Check if configured
  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return config !== null;
  },

  // Save notifications
  async setNotifications(notifications: PaymentNotification[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS,
      JSON.stringify(notifications)
    );
  },

  // Get notifications
  async getNotifications(): Promise<PaymentNotification[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  },

  // Add notification
  async addNotification(notification: PaymentNotification): Promise<void> {
    const notifications = await this.getNotifications();
    notifications.unshift(notification);
    // Keep only last 100 notifications
    const trimmed = notifications.slice(0, 100);
    await this.setNotifications(trimmed);
  },

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SERVER_URL,
      STORAGE_KEYS.DEVICE_KEY,
      STORAGE_KEYS.NOTIFICATIONS,
    ]);
  },
};

// Configuration types
export interface AppConfig {
  serverUrl: string;
  deviceKey: string;
}

// Notification types
export type PaymentType = 'wechat' | 'alipay';

export interface PaymentNotification {
  id: string;
  type: PaymentType;
  amount: number;
  message: string;
  timestamp: number;
}

// Report types
export interface ReportRequest {
  deviceKey: string;
  amount: number;
  type: PaymentType;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
}

// Storage keys
export const STORAGE_KEYS = {
  SERVER_URL: '@catpay_server_url',
  DEVICE_KEY: '@catpay_device_key',
  NOTIFICATIONS: '@catpay_notifications',
} as const;

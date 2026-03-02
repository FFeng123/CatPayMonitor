import { useEffect, useCallback, useRef } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { PaymentNotification, PaymentType } from '../types';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';

const { NotificationMonitorModule } = NativeModules;

interface UseNotificationOptions {
  onNotification?: (notification: PaymentNotification) => void;
}

// Regex patterns for extracting amounts
const AMOUNT_PATTERNS = [
  /¥(\d+(?:\.\d{1,2})?)/,
  /(\d+(?:\.\d{1,2})?)元/,
  /收款(\d+(?:\.\d{1,2})?)/,
  /到账(\d+(?:\.\d{1,2})?)/,
  /(\d+\.?\d*)/,
];

function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  return null;
}

function detectPaymentType(packageName: string, text: string): PaymentType | null {
  const lowerText = text.toLowerCase();

  // WeChat payment
  if (packageName === 'com.tencent.mm') {
    if (lowerText.includes('微信支付') || lowerText.includes('收款') || lowerText.includes('到账')) {
      return 'wechat';
    }
  }

  // Alipay
  if (packageName === 'com.eg.android.AlipayGphone') {
    if (lowerText.includes('支付宝') || lowerText.includes('收款') || lowerText.includes('到账')) {
      return 'alipay';
    }
  }

  return null;
}

export function useNotification(options: UseNotificationOptions = {}) {
  const { onNotification } = options;
  const isProcessingRef = useRef(false);

  const handleNotification = useCallback(async (
    event: { packageName: string; text: string; title: string }
  ) => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    try {
      const { packageName, text, title } = event;
      const fullText = `${title} ${text}`;

      // Detect payment type
      const paymentType = detectPaymentType(packageName, fullText);
      if (!paymentType) {
        return;
      }

      // Extract amount
      const amount = extractAmount(fullText);
      if (!amount || amount <= 0) {
        console.log('Could not extract amount from notification:', fullText);
        return;
      }

      // Get config
      const config = await storageService.getConfig();
      if (!config) {
        console.log('No config found, skipping report');
        return;
      }

      // Create notification object
      const notification: PaymentNotification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: paymentType,
        amount,
        message: fullText.substring(0, 200),
        timestamp: Date.now(),
      };

      // Save to local storage
      await storageService.addNotification(notification);

      // Report to server
      const result = await apiService.reportPayment(config.serverUrl, {
        deviceKey: config.deviceKey,
        amount,
        type: paymentType,
      });

      console.log('Payment reported:', notification, 'Result:', result);

      // Call callback
      if (onNotification) {
        onNotification(notification);
      }
    } catch (error) {
      console.error('Error processing notification:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [onNotification]);

  useEffect(() => {
    if (!NotificationMonitorModule) {
      console.warn('NotificationMonitorModule not available');
      return;
    }

    const eventEmitter = new NativeEventEmitter(NotificationMonitorModule);

    // Listen for notifications from native module
    const subscription = eventEmitter.addListener(
      'onNotificationReceived',
      handleNotification
    );

    // Start listening
    NotificationMonitorModule.startListening();

    return () => {
      subscription.remove();
      NotificationMonitorModule.stopListening();
    };
  }, [handleNotification]);

  return {
    isAvailable: !!NotificationMonitorModule,
  };
}

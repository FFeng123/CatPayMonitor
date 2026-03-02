import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { ConfigScreen } from './src/screens/ConfigScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { storageService } from './src/services/storage';
import { PaymentNotification } from './src/types';
import { NotificationMonitorModule } from './src/native/NotificationMonitorModule';

export default function App() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [lastNotification, setLastNotification] = useState<PaymentNotification | null>(null);

  // Check if app is configured
  useEffect(() => {
    const checkConfig = async () => {
      const configured = await storageService.isConfigured();
      setIsConfigured(configured);
    };
    checkConfig();
  }, []);

  // Process notification and extract amount
  const processNotification = useCallback(async (event: { packageName: string; title: string; text: string }) => {
    const { packageName, title, text } = event;
    const fullText = `${title} ${text}`;
    const lowerText = fullText.toLowerCase();

    // Detect payment type
    let paymentType: 'wechat' | 'alipay' | null = null;

    if (packageName === 'com.tencent.mm') {
      if (lowerText.includes('微信支付') || lowerText.includes('收款') || lowerText.includes('到账')) {
        paymentType = 'wechat';
      }
    } else if (packageName === 'com.eg.android.AlipayGphone') {
      if (lowerText.includes('支付宝') || lowerText.includes('收款') || lowerText.includes('到账')) {
        paymentType = 'alipay';
      }
    }

    if (!paymentType) {
      return;
    }

    // Extract amount
    const amountPatterns = [
      /¥(\d+(?:\.\d{1,2})?)/,
      /(\d+(?:\.\d{1,2})?)元/,
      /收款(\d+(?:\.\d{1,2})?)/,
      /到账(\d+(?:\.\d{1,2})?)/,
      /(\d+\.?\d*)/,
    ];

    let amount: number | null = null;
    for (const pattern of amountPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        amount = parseFloat(match[1]);
        if (!isNaN(amount) && amount > 0) {
          break;
        }
      }
    }

    if (!amount || amount <= 0) {
      console.log('Could not extract amount:', fullText);
      return;
    }

    // Get config and report
    const config = await storageService.getConfig();
    if (!config) {
      return;
    }

    // Save notification
    const notification: PaymentNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: paymentType,
      amount,
      message: fullText.substring(0, 200),
      timestamp: Date.now(),
    };

    await storageService.addNotification(notification);
    setLastNotification(notification);

    // Report to server
    try {
      const response = await fetch(`${config.serverUrl}/api/device/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceKey: config.deviceKey,
          amount,
          type: paymentType,
        }),
      });

      if (response.ok) {
        Alert.alert(
          '收款通知',
          `收到${paymentType === 'wechat' ? '微信' : '支付宝'}收款 ¥${amount.toFixed(2)}`,
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      console.error('Failed to report:', error);
    }
  }, []);

  // Set up native event listener
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const removeListener = NotificationMonitorModule.addListener(processNotification);

    // Start listening
    NotificationMonitorModule.startListening();

    return () => {
      removeListener();
      NotificationMonitorModule.stopListening();
    };
  }, [processNotification]);

  const handleConfigComplete = () => {
    setIsConfigured(true);
  };

  // Show loading while checking config
  if (isConfigured === null) {
    return <View style={styles.container} />;
  }

  // Show config screen if not configured
  if (!isConfigured) {
    return (
      <View style={styles.container}>
        <ConfigScreen onConfigComplete={handleConfigComplete} />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Show home screen
  return (
    <View style={styles.container}>
      <HomeScreen onNotificationReceived={setLastNotification} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

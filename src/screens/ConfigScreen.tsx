import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';

interface ConfigScreenProps {
  onConfigComplete: () => void;
}

export function ConfigScreen({ onConfigComplete }: ConfigScreenProps) {
  const [serverUrl, setServerUrl] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // Validate inputs
    const trimmedUrl = serverUrl.trim();
    const trimmedKey = deviceKey.trim();

    if (!trimmedUrl) {
      Alert.alert('错误', '请输入服务器地址');
      return;
    }

    if (!trimmedKey) {
      Alert.alert('错误', '请输入设备Key');
      return;
    }

    // Validate URL format
    try {
      new URL(trimmedUrl);
    } catch {
      Alert.alert('错误', '服务器地址格式不正确');
      return;
    }

    setIsLoading(true);

    try {
      // Test connection first
      const isConnected = await apiService.testConnection(trimmedUrl);
      if (!isConnected) {
        Alert.alert(
          '连接失败',
          '无法连接到服务器，请检查地址是否正确',
          [{ text: '确定' }]
        );
        setIsLoading(false);
        return;
      }

      // Save config
      await storageService.setConfig({
        serverUrl: trimmedUrl,
        deviceKey: trimmedKey,
      });

      Alert.alert('成功', '配置已保存', [
        { text: '确定', onPress: onConfigComplete },
      ]);
    } catch (error) {
      Alert.alert('错误', '保存配置失败，请重试');
      console.error('Save config error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>CatPay 监控</Text>
          <Text style={styles.subtitle}>首次配置</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>服务器地址</Text>
          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="例如: http://192.168.1.100:3000"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>设备Key</Text>
          <TextInput
            style={styles.input}
            value={deviceKey}
            onChangeText={setDeviceKey}
            placeholder="请输入设备Key"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '保存中...' : '保存配置'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            配置完成后，应用将自动监听微信和支付宝的支付通知，
            并将收款金额上报到服务器。
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginTop: 24,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
});

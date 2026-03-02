import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { PaymentNotification, AppConfig } from '../types';
import { storageService } from '../services/storage';

interface HomeScreenProps {
  onNotificationReceived?: (notification: PaymentNotification) => void;
}

export function HomeScreen({ onNotificationReceived }: HomeScreenProps) {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastNotification, setLastNotification] = useState<PaymentNotification | null>(null);

  const loadData = useCallback(async () => {
    const [notifs, cfg] = await Promise.all([
      storageService.getNotifications(),
      storageService.getConfig(),
    ]);
    setNotifications(notifs);
    setConfig(cfg);
  }, []);

  useEffect(() => {
    loadData();

    // Listen for new notifications
    if (onNotificationReceived) {
      const handler = (notif: PaymentNotification) => {
        setLastNotification(notif);
        setNotifications(prev => [notif, ...prev]);
      };
      // This would be connected in the parent component
    }
  }, [loadData, onNotificationReceived]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleClear = () => {
    Alert.alert(
      '清除记录',
      '确定要清除所有记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await storageService.setNotifications([]);
            setNotifications([]);
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: PaymentNotification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {item.type === 'wechat' ? '微信' : '支付宝'}
          </Text>
        </View>
        <Text style={styles.amount}>¥{item.amount.toFixed(2)}</Text>
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {item.message}
      </Text>
      <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无收款记录</Text>
      <Text style={styles.emptySubtext}>
        收到微信或支付宝收款通知后会自动显示
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>收款记录</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearButton}>清除</Text>
          </TouchableOpacity>
        )}
      </View>

      {config && (
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>服务器:</Text>
            <Text style={styles.statusValue} numberOfLines={1}>
              {config.serverUrl}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>设备:</Text>
            <Text style={styles.statusValue} numberOfLines={1}>
              {config.deviceKey}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {lastNotification && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>
            收到 {lastNotification.type === 'wechat' ? '微信' : '支付宝'} 收款
            ¥{lastNotification.amount.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    fontSize: 16,
    color: '#ff3b30',
  },
  statusBar: {
    backgroundColor: '#e8f4fd',
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  statusValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: 12,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#07c160',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#07c160',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  toast: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#07c160',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

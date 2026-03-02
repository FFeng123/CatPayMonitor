import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { NotificationMonitorModule: NativeModule } = NativeModules;

interface NotificationEvent {
  packageName: string;
  title: string;
  text: string;
}

class NotificationMonitorModuleClass {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && NativeModule) {
      this.eventEmitter = new NativeEventEmitter(NativeModule);
    }
  }

  async startListening(): Promise<boolean> {
    if (NativeModule) {
      return NativeModule.startListening();
    }
    return false;
  }

  async stopListening(): Promise<boolean> {
    if (NativeModule) {
      return NativeModule.stopListening();
    }
    return false;
  }

  addListener(callback: (event: NotificationEvent) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener(
      'onNotificationReceived',
      callback
    );

    return () => subscription.remove();
  }

  removeAllListeners(): void {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('onNotificationReceived');
    }
  }
}

export const NotificationMonitorModule = new NotificationMonitorModuleClass();

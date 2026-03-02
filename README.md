# CatPayMonitor

Android 应用，用于监听系统通知，当收到微信/支付宝支付通知时，提取金额并上报到 CatPay 服务器。

## 功能特性

- 监听微信支付通知
- 监听支付宝支付通知
- 自动提取收款金额
- 上报到服务器 `/api/device/report`
- 首次配置服务器地址和设备Key

## 技术栈

- React Native + Expo
- TypeScript
- 原生 Android NotificationListenerService

## 构建

### 本地构建

```bash
# 安装依赖
npm install

# 生成 Android 项目
npx expo prebuild --platform android

# 构建 Debug APK
cd android && ./gradlew assembleDebug

# 构建 Release APK
cd android && ./gradlew assembleRelease
```

### GitHub Actions

推送代码后，GitHub Actions 会自动构建 Release APK。

## 权限

- `BIND_NOTIFICATION_LISTENER_SERVICE` - 监听通知
- `POST_NOTIFICATIONS` - 发送通知
- `INTERNET` - 网络请求

## 使用

1. 安装 APK 到手机
2. 首次启动配置服务器地址和设备 Key
3. 授予通知监听权限
4. 收到微信/支付宝收款通知后自动上报

## API

### 上报接口

```
POST /api/device/report
Content-Type: application/json

{
  "deviceKey": "设备Key",
  "amount": 1.23,
  "type": "wechat" | "alipay"
}
```

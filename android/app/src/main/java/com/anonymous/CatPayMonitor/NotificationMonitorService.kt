package com.anonymous.catpaymonitor

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationMonitorService : NotificationListenerService() {

    private val TAG = "NotificationMonitor"

    // WeChat and Alipay package names
    private val WECHAT_PACKAGE = "com.tencent.mm"
    private val ALIPAY_PACKAGE = "com.eg.android.AlipayGphone"

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return

        val packageName = sbn.packageName
        val notification = sbn.notification

        // Only process WeChat and Alipay notifications
        if (packageName != WECHAT_PACKAGE && packageName != ALIPAY_PACKAGE) {
            return
        }

        // Get notification content
        val extras = notification.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val combinedText = "$title $text"

        Log.d(TAG, "Notification from $packageName: $combinedText")

        // Check if it's a payment notification
        if (isPaymentNotification(combinedText)) {
            // Send to React Native
            NotificationMonitorModule.sendNotification(packageName, title, text)
        }
    }

    private fun isPaymentNotification(text: String): Boolean {
        val lowerText = text.lowercase()

        // WeChat payment keywords
        if (lowerText.contains("微信支付") || lowerText.contains("收款") || lowerText.contains("到账")) {
            return true
        }

        // Alipay payment keywords
        if (lowerText.contains("支付宝") || lowerText.contains("收款") || lowerText.contains("到账")) {
            return true
        }

        return false
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Not needed
    }
}

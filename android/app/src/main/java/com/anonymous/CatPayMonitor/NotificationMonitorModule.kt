package com.anonymous.catpaymonitor

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationMonitorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "NotificationModule"
    private var notificationService: NotificationMonitorService? = null
    private var isBound = false
    private var reactContext: ReactApplicationContext? = null

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            Log.d(TAG, "Service connected")
            isBound = true
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            Log.d(TAG, "Service disconnected")
            notificationService = null
            isBound = false
        }
    }

    init {
        reactContext = reactContext
        // Set up callback to send events to React Native
        NotificationMonitorModule.setCallback { packageName, title, text ->
            sendEventToReactNative(packageName, title, text)
        }
    }

    private fun sendEventToReactNative(packageName: String, title: String, text: String) {
        val context = reactContext ?: return

        val params = Arguments.createMap().apply {
            putString("packageName", packageName)
            putString("title", title)
            putString("text", text)
        }

        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onNotificationReceived", params)

        Log.d(TAG, "Sent notification to React Native: $packageName - $title")
    }

    override fun getName(): String = "NotificationMonitorModule"

    @ReactMethod
    fun startListening(promise: Promise) {
        try {
            val context = reactApplicationContext

            // Try to bind to the notification service
            val intent = Intent(context, NotificationMonitorService::class.java)
            context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)

            // Start the service
            context.startService(intent)

            promise.resolve(true)
            Log.d(TAG, "Started listening for notifications")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start listening", e)
            promise.reject("ERROR", "Failed to start listening: ${e.message}")
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            if (isBound) {
                reactApplicationContext.unbindService(serviceConnection)
                isBound = false
            }
            promise.resolve(true)
            Log.d(TAG, "Stopped listening for notifications")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to stop listening", e)
            promise.reject("ERROR", "Failed to stop listening: ${e.message}")
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for NativeEventEmitter
    }

    companion object {
        private var reactCallback: ((String, String, String) -> Unit)? = null

        fun sendNotification(packageName: String, title: String, text: String) {
            reactCallback?.invoke(packageName, title, text)
        }

        fun setCallback(callback: (String, String, String) -> Unit) {
            reactCallback = callback
        }
    }
}

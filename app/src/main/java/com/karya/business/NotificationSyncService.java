package com.karya.business;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Native Android Background Sync Service
 * Keeps active in background even when app is closed or screen is locked.
 * Polls Firestore REST API for new booking alerts.
 * Wakes up device screen and displays high-priority lockscreen notifications.
 */
public class NotificationSyncService extends Service {

    private static final String TAG = "VMH_SyncService";
    private static final String FOREGROUND_CHANNEL_ID = "vmh_service_channel_v1";
    private static final String ALERT_CHANNEL_ID = "karya_business_channel_v3";
    private static final int FOREGROUND_NOTIFICATION_ID = 2001;

    private static final String FIRESTORE_ALERT_URL =
            "https://firestore.googleapis.com/v1/projects/verma-marriage-hall/databases/(default)/documents/vmh_alerts/active_alert?key=AIzaSyBBbUJ6DA0tRDALZC4Oqx_GX7F2R1K6qgc";

    private volatile boolean isRunning = false;
    private Thread syncThread;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        startServiceInForeground();
        startAlertPollingThread();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            // 1. Silent foreground service channel
            NotificationChannel serviceChannel = new NotificationChannel(
                    FOREGROUND_CHANNEL_ID,
                    "वर्मा मैरिज हॉल - बैकग्राउंड सिंक",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("लाइव बुकिंग और अलर्ट्स के लिए निरंतर सिंक");
            serviceChannel.setShowBadge(false);
            serviceChannel.enableVibration(false);
            serviceChannel.setSound(null, null);
            nm.createNotificationChannel(serviceChannel);

            // 2. High priority alert channel for lock screen
            NotificationChannel alertChannel = new NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "व्यापार सिंक अलर्ट्स",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.setDescription("नए बिल और मैरिज हॉल बुकिंग के नोटिफिकेशन");
            alertChannel.enableVibration(true);
            alertChannel.setVibrationPattern(new long[]{0, 500, 250, 500});
            alertChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            alertChannel.setShowBadge(true);
            nm.createNotificationChannel(alertChannel);
        }
    }

    private void startServiceInForeground() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        int iconRes = getApplicationInfo().icon != 0 ? getApplicationInfo().icon : android.R.drawable.stat_notify_sync;

        Notification notification = new NotificationCompat.Builder(this, FOREGROUND_CHANNEL_ID)
                .setSmallIcon(iconRes)
                .setContentTitle("वर्मा मैरिज हॉल")
                .setContentText("बैकग्राउंड लाइव सिंक सक्रिय है")
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .setContentIntent(pendingIntent)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(FOREGROUND_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(FOREGROUND_NOTIFICATION_ID, notification);
        }
    }

    private void startAlertPollingThread() {
        if (isRunning) return;
        isRunning = true;

        syncThread = new Thread(() -> {
            Log.d(TAG, "NotificationSyncService polling thread started");
            boolean isFirstRun = true;

            while (isRunning) {
                try {
                    pollActiveAlert(isFirstRun);
                    if (isFirstRun) isFirstRun = false;
                } catch (Throwable t) {
                    Log.w(TAG, "Alert poll loop exception: " + t.getMessage());
                }

                try {
                    // Check every 7.5 seconds
                    Thread.sleep(7500);
                } catch (InterruptedException ie) {
                    break;
                }
            }
            Log.d(TAG, "NotificationSyncService polling thread stopped");
        });
        syncThread.setDaemon(true);
        syncThread.start();
    }

    private void pollActiveAlert(boolean isFirstRun) {
        HttpURLConnection conn = null;
        BufferedReader reader = null;
        try {
            URL url = new URL(FIRESTORE_ALERT_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                return;
            }

            reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            JSONObject root = new JSONObject(sb.toString());
            JSONObject fields = root.optJSONObject("fields");
            if (fields == null) return;

            String alertId = "";
            if (fields.has("alertId")) {
                alertId = fields.getJSONObject("alertId").optString("stringValue", "");
            }
            String senderDeviceId = "";
            if (fields.has("senderDeviceId")) {
                senderDeviceId = fields.getJSONObject("senderDeviceId").optString("stringValue", "");
            }
            String title = "वर्मा मैरिज हॉल - अलर्ट 🔔";
            if (fields.has("title")) {
                title = fields.getJSONObject("title").optString("stringValue", title);
            }
            String message = "";
            if (fields.has("message")) {
                message = fields.getJSONObject("message").optString("stringValue", "");
            }

            if (alertId.isEmpty()) return;

            SharedPreferences prefs = getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE);
            String localDeviceId = prefs.getString("device_id", "");
            String lastSeenAlertId = prefs.getString("last_alert_id", "");

            // If first run and no saved last_alert_id, seed it so we don't alert on past events
            if (isFirstRun && lastSeenAlertId.isEmpty()) {
                prefs.edit().putString("last_alert_id", alertId).apply();
                return;
            }

            // Check if alert is new and sent by ANOTHER device
            if (!alertId.equals(lastSeenAlertId)) {
                prefs.edit().putString("last_alert_id", alertId).apply();

                // If sent by this same device, ignore notification
                if (!localDeviceId.isEmpty() && localDeviceId.equals(senderDeviceId)) {
                    Log.d(TAG, "Ignoring self-generated alert: " + alertId);
                    return;
                }

                Log.d(TAG, "New alert received from other device: " + alertId + " -> " + title);
                wakeScreenAndPostNotification(title, message);
            }

        } catch (Exception e) {
            // Expected on network blips or offline
            Log.d(TAG, "Firestore REST poll note: " + e.getMessage());
        } finally {
            if (reader != null) {
                try { reader.close(); } catch (Exception ignored) {}
            }
            if (conn != null) {
                try { conn.disconnect(); } catch (Exception ignored) {}
            }
        }
    }

    private void wakeScreenAndPostNotification(String title, String message) {
        try {
            // 1. Wake screen for 5 seconds even when phone is locked
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                        PowerManager.ACQUIRE_CAUSES_WAKEUP |
                        PowerManager.ON_AFTER_RELEASE,
                        "VMH:AlertScreenWakeLock"
                );
                wakeLock.acquire(5000);
            }
        } catch (Throwable t) {
            Log.w(TAG, "WakeLock error:", t);
        }

        try {
            // 2. Post high-priority, lockscreen-visible notification
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    (int) System.currentTimeMillis(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            int iconRes = getApplicationInfo().icon != 0 ? getApplicationInfo().icon : android.R.drawable.stat_notify_chat;

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                    .setSmallIcon(iconRes)
                    .setContentTitle(title)
                    .setContentText(message)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                    .setAutoCancel(true)
                    .setSound(defaultSoundUri)
                    .setVibrate(new long[]{0, 500, 250, 500})
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // Visible on Lock Screen
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setContentIntent(pendingIntent);

            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                // If app is actively in foreground, user is already seeing in-app alert & hearing chime;
                // do not clutter notification shade with duplicates!
                if (!MainActivity.isAppInForeground) {
                    nm.notify(MainActivity.ALERT_NOTIFICATION_ID, builder.build());
                }
            }
        } catch (Throwable t) {
            Log.e(TAG, "Notification post error:", t);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!isRunning) {
            startAlertPollingThread();
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        if (syncThread != null) {
            syncThread.interrupt();
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

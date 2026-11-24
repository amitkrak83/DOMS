package com.karya.business;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import android.content.SharedPreferences;
import android.content.ContentValues;
import android.content.ClipData;
import android.provider.MediaStore;
import android.provider.Settings;
import android.os.Environment;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.content.pm.ResolveInfo;
import com.google.firebase.messaging.FirebaseMessaging;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private static final String CHANNEL_ID = "karya_business_channel_v3";
    private static final int NOTIFICATION_PERMISSION_CODE = 101;
    private static final String TAG = "KaryaMainActivity";

    public static volatile boolean isAppInForeground = false;
    public static final int ALERT_NOTIFICATION_ID = 2026;

    @Override
    protected void onResume() {
        super.onResume();
        isAppInForeground = true;
    }

    @Override
    protected void onPause() {
        super.onPause();
        isAppInForeground = false;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // System bar styling for punch-hole camera & immersive feel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            window.setStatusBarColor(Color.parseColor("#78350f"));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                window.setNavigationBarColor(Color.parseColor("#ffffff"));
                View decor = window.getDecorView();
                decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
            }
        }

        createNotificationChannel();
        checkAndRequestNotificationPermission();

        // Initialize permanent Hardware Device ID in native SharedPreferences
        try {
            String hardwareId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
            if (hardwareId == null || hardwareId.isEmpty()) {
                hardwareId = "vmh_" + Build.MANUFACTURER + "_" + Build.MODEL.replaceAll("\\s+", "");
            }
            SharedPreferences nativePrefs = getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE);
            nativePrefs.edit().putString("device_id", hardwareId).apply();
            Log.d(TAG, "Hardware device_id initialized: " + hardwareId);
        } catch (Exception e) {
            Log.e(TAG, "Error initializing hardware device_id", e);
        }

        // Initialize Firebase Cloud Messaging for instant push notifications
        try {
            FirebaseMessaging.getInstance().subscribeToTopic("all_devices")
                    .addOnCompleteListener(task -> Log.d(TAG, "Subscribed to FCM topic all_devices: " + task.isSuccessful()));
            FirebaseMessaging.getInstance().subscribeToTopic("vmh_bookings")
                    .addOnCompleteListener(task -> Log.d(TAG, "Subscribed to FCM topic vmh_bookings: " + task.isSuccessful()));

            FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    String token = task.getResult();
                    Log.d(TAG, "FCM Token retrieved on app start: " + token);
                    getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE)
                            .edit()
                            .putString("fcm_token", token)
                            .apply();
                    runOnUiThread(() -> {
                        if (webView != null) {
                            webView.evaluateJavascript("window.onFcmTokenReceived ? window.onFcmTokenReceived('" + token + "') : null;", null);
                        }
                    });
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error initializing Firebase Cloud Messaging", e);
        }

        // Dismiss any previous sticky foreground sync notifications and ensure background service is stopped


        webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setDefaultTextEncodingName("UTF-8");
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setUseWideViewPort(false);
        webSettings.setLoadWithOverviewMode(false);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        // Native Android Bridge to JavaScript
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidApp");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    Uri uri = request.getUrl();
                    String path = uri.getPath();
                    if (path != null) {
                        String assetPath = null;
                        String mimeType = "application/javascript";
                        if (path.endsWith("tailwind.min.js")) {
                            assetPath = "tailwind.min.js";
                        } else if (path.endsWith("qrcode.min.js")) {
                            assetPath = "qrcode.min.js";
                        } else if (path.endsWith("html2canvas.min.js")) {
                            assetPath = "html2canvas.min.js";
                        } else if (path.endsWith("jspdf.umd.min.js")) {
                            assetPath = "jspdf.umd.min.js";
                        } else if (path.endsWith("firebase-app-compat.js")) {
                            assetPath = "js/firebase-app-compat.js";
                        } else if (path.endsWith("firebase-firestore-compat.js")) {
                            assetPath = "js/firebase-firestore-compat.js";
                        } else if (path.endsWith("styles.css")) {
                            assetPath = "styles.css";
                            mimeType = "text/css";
                        }

                        if (assetPath != null) {
                            try {
                                InputStream is = getAssets().open(assetPath);
                                return new WebResourceResponse(mimeType, "UTF-8", is);
                            } catch (Exception e) {
                                Log.w(TAG, "shouldInterceptRequest failed for asset: " + assetPath, e);
                            }
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.contains("wa.me/"))) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        Log.e(TAG, "Error handling URL scheme: " + url, e);
                        return true;
                    }
                }
                return super.shouldOverrideUrlLoading(view, url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    String url = request.getUrl().toString();
                    if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.contains("wa.me/")) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            Log.e(TAG, "Error handling URL scheme: " + url, e);
                            return true;
                        }
                    }
                }
                return super.shouldOverrideUrlLoading(view, request);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (failingUrl != null && failingUrl.contains("ota_index.html")) {
                    Log.w(TAG, "OTA bundle failed to load, falling back to asset index.html");
                    File ota = new File(getFilesDir(), "ota_index.html");
                    if (ota.exists()) ota.delete();
                    view.loadUrl("file:///android_asset/index.html");
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }

            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                Log.d("WebViewConsole", consoleMessage.message() + " -- Line "
                        + consoleMessage.lineNumber() + " of "
                        + consoleMessage.sourceId());
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, android.webkit.JsResult result) {
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                result.confirm();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, android.webkit.JsResult result) {
                result.cancel();
                return true;
            }
        });

        // 1. Ensure all core runtime assets (Tailwind, Firebase, etc.) exist in filesDir
        copyAssetsToFilesDir();

        // 2. APK Version Upgrade Protection:
        // If the installed APK binary is newer than previous run, wipe outdated OTA bundle
        // so app boots cleanly from the new APK's native assets!
        int currentVersionCode = BuildConfig.VERSION_CODE;
        SharedPreferences prefs = getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE);
        int lastVersionCode = prefs.getInt("last_apk_version_code", -1);
        if (currentVersionCode > lastVersionCode) {
            Log.i(TAG, "New APK version detected: " + currentVersionCode + " (was " + lastVersionCode + "). Resetting OTA bundle.");
            File ota = new File(getFilesDir(), "ota_index.html");
            if (ota.exists()) {
                ota.delete();
            }
            prefs.edit().putInt("last_apk_version_code", currentVersionCode).apply();
        }

        // 3. Load OTA Live Web Bundle if exists, otherwise fallback to Asset index.html
        File otaBundle = new File(getFilesDir(), "ota_index.html");
        if (otaBundle.exists() && otaBundle.length() > 30000) {
            Log.d(TAG, "Loading from OTA bundle: " + otaBundle.getAbsolutePath() + " (" + otaBundle.length() + " bytes)");
            webView.loadUrl("file://" + otaBundle.getAbsolutePath());
        } else {
            Log.d(TAG, "Loading from base asset: file:///android_asset/index.html");
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    private void copyAssetsToFilesDir() {
        String[] assetsToCopy = new String[]{
            "tailwind.min.js",
            "qrcode.min.js",
            "html2canvas.min.js",
            "jspdf.umd.min.js",
            "styles.css"
        };
        for (String assetName : assetsToCopy) {
            try {
                File outFile = new File(getFilesDir(), assetName);
                if (!outFile.exists() || outFile.length() == 0) {
                    copyAssetFile(assetName, outFile);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to copy asset: " + assetName, e);
            }
        }
        try {
            File jsDir = new File(getFilesDir(), "js");
            if (!jsDir.exists()) jsDir.mkdirs();
            String[] jsAssets = new String[]{
                "js/firebase-app-compat.js",
                "js/firebase-firestore-compat.js"
            };
            for (String jsAsset : jsAssets) {
                String fileName = jsAsset.substring(jsAsset.lastIndexOf('/') + 1);
                File outFile = new File(jsDir, fileName);
                if (!outFile.exists() || outFile.length() == 0) {
                    copyAssetFile(jsAsset, outFile);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to copy js assets", e);
        }
    }

    private void copyAssetFile(String assetPath, File outFile) {
        try (InputStream in = getAssets().open(assetPath);
             OutputStream out = new FileOutputStream(outFile)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            out.flush();
            Log.d(TAG, "Copied asset to files: " + outFile.getAbsolutePath());
        } catch (Exception e) {
            Log.w(TAG, "Could not copy asset " + assetPath + ": " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "व्यापार सिंक अलर्ट्स";
            String description = "नए बिल और मैरिज हॉल बुकिंग के नोटिफिकेशन";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 400, 200, 400});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setShowBadge(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    public void checkAndRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        NOTIFICATION_PERMISSION_CODE);
            }
        }
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public String getNativeDeviceId() {
            try {
                String androidId = Settings.Secure.getString(mContext.getContentResolver(), Settings.Secure.ANDROID_ID);
                if (androidId != null && !androidId.isEmpty() && !"9774d56d682e549c".equals(androidId)) {
                    return "android_" + androidId;
                }
                SharedPreferences prefs = mContext.getSharedPreferences("VMH_DEVICE_SPECIFIC", Context.MODE_PRIVATE);
                String id = prefs.getString("unique_device_uuid", "");
                if (id == null || id.isEmpty()) {
                    id = "dev_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
                    prefs.edit().putString("unique_device_uuid", id).apply();
                }
                return id;
            } catch (Exception e) {
                return "android_" + Math.abs(android.os.Build.FINGERPRINT.hashCode());
            }
        }

        @JavascriptInterface
        public void shareApk() {
            try {
                File srcApk = new File(mContext.getApplicationInfo().sourceDir);
                if (!srcApk.exists()) {
                    Log.e(TAG, "Source APK not found: " + srcApk.getAbsolutePath());
                    return;
                }
                File dstApk = new File(mContext.getCacheDir(), "VermaMarriageHall.apk");

                // Copy APK if not existing or length differs
                if (!dstApk.exists() || dstApk.length() != srcApk.length()) {
                    java.io.InputStream in = new java.io.FileInputStream(srcApk);
                    java.io.OutputStream out = new java.io.FileOutputStream(dstApk);
                    byte[] buf = new byte[16384];
                    int len;
                    while ((len = in.read(buf)) > 0) {
                        out.write(buf, 0, len);
                    }
                    in.close();
                    out.close();
                }

                Uri apkUri = androidx.core.content.FileProvider.getUriForFile(
                        mContext,
                        mContext.getPackageName() + ".fileprovider",
                        dstApk
                );

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("application/vnd.android.package-archive");
                shareIntent.putExtra(Intent.EXTRA_STREAM, apkUri);
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, "वर्मा मैरिज हॉल - आधिकारिक डिजिटल ऐप");
                shareIntent.putExtra(Intent.EXTRA_TEXT, "🏛️ वर्मा मैरिज हॉल (Verma Marriage Hall)\nडिजिटल बिलिंग, रसीद कट्टा एवं विवाह बुकिंग प्रबंधन ऐप।\nस्थान: ग्राम असनहरा, बस्ती (उ.प्र.)");
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, "वर्मा मैरिज हॉल ऐप शेयर करें (APK File)");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                java.util.List<android.content.pm.ResolveInfo> resInfoList = mContext.getPackageManager()
                        .queryIntentActivities(chooser, android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
                for (android.content.pm.ResolveInfo resolveInfo : resInfoList) {
                    String packageName = resolveInfo.activityInfo.packageName;
                    mContext.grantUriPermission(packageName, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }

                mContext.startActivity(chooser);
            } catch (Exception e) {
                Log.e(TAG, "Error sharing APK file", e);
            }
        }

        @JavascriptInterface
        public void saveApkToDownloads() {
            shareApk();
        }

        @JavascriptInterface
        public void dialPhone(String phone) {
            try {
                if (phone == null || phone.isEmpty()) return;
                Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phone));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Error dialing phone: " + phone, e);
            }
        }

        @JavascriptInterface
        public void openWhatsAppChat(String phone) {
            try {
                if (phone == null || phone.isEmpty()) return;
                String clean = phone.replaceAll("[^0-9]", "");
                if (clean.length() == 10) clean = "91" + clean;
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/" + clean));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Error opening WhatsApp chat for: " + phone, e);
            }
        }

        @JavascriptInterface
        public void shareCsv(String csvContent, String filename, String title) {
            try {
                File cacheDir = new File(mContext.getCacheDir(), "shared_docs");
                if (!cacheDir.exists()) cacheDir.mkdirs();
                File file = new File(cacheDir, filename != null && !filename.isEmpty() ? filename : "VMH_Bookings.csv");
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                fos.flush();
                fos.close();

                Uri contentUri = FileProvider.getUriForFile(mContext,
                        mContext.getPackageName() + ".fileprovider", file);

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/csv");
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title != null ? title : "वर्मा मैरिज हॉल - बुकिंग्स डेटा");
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, title != null ? title : "एक्सेल फाइल शेयर या सेव करें");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(chooser);
            } catch (Exception e) {
                Log.e(TAG, "Error sharing CSV", e);
            }
        }

        @JavascriptInterface
        public String getFcmToken() {
            try {
                return mContext.getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE)
                        .getString("fcm_token", "");
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public void syncNativeDeviceId(String deviceId) {
            // Keep native device ID hardware-bound and unique per device
            Log.d(TAG, "Native device_id requested by JS: " + deviceId);
        }

        @JavascriptInterface
        public void syncNativeLastAlertId(String alertId) {
            try {
                if (alertId != null && !alertId.isEmpty()) {
                    mContext.getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE)
                            .edit()
                            .putString("last_alert_id", alertId)
                            .apply();
                    Log.d(TAG, "Native last_alert_id synced: " + alertId);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error syncing native last_alert_id", e);
            }
        }

        @JavascriptInterface
        public void showNotification(String title, String message) {
            try {
                Intent intent = new Intent(mContext, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                PendingIntent pendingIntent = PendingIntent.getActivity(mContext, 0, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

                int iconRes = mContext.getApplicationInfo().icon;
                if (iconRes == 0) {
                    iconRes = android.R.drawable.stat_notify_chat;
                }

                NotificationCompat.Builder notificationBuilder =
                        new NotificationCompat.Builder(mContext, CHANNEL_ID)
                                .setSmallIcon(iconRes)
                                .setContentTitle(title)
                                .setContentText(message)
                                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                                .setAutoCancel(true)
                                .setSound(defaultSoundUri)
                                .setVibrate(new long[]{0, 400, 200, 400})
                                .setPriority(NotificationCompat.PRIORITY_MAX)
                                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                                .setDefaults(NotificationCompat.DEFAULT_ALL)
                                .setContentIntent(pendingIntent);

                NotificationManager notificationManager =
                        (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

                if (notificationManager != null) {
                    notificationManager.notify(ALERT_NOTIFICATION_ID, notificationBuilder.build());
                    Log.d(TAG, "Notification posted (ID " + ALERT_NOTIFICATION_ID + "): " + title);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error posting notification", e);
            }
        }

        @JavascriptInterface
        public void playNativeAlertSound() {
            try {
                Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                android.media.Ringtone r = RingtoneManager.getRingtone(mContext, defaultSoundUri);
                if (r != null) {
                    r.play();
                }
            } catch (Exception e) {
                Log.e(TAG, "Error playing native ringtone", e);
            }
        }

        @JavascriptInterface
        public void shareImage(String base64Data, String filename, String title, String caption) {
            try {
                if (base64Data.contains(",")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }
                byte[] decoded = Base64.decode(base64Data, Base64.DEFAULT);

                File cacheDir = new File(mContext.getCacheDir(), "shared_images");
                if (!cacheDir.exists()) cacheDir.mkdirs();

                File imageFile = new File(cacheDir, filename);
                FileOutputStream fos = new FileOutputStream(imageFile);
                fos.write(decoded);
                fos.flush();
                fos.close();

                Uri contentUri = FileProvider.getUriForFile(mContext,
                        mContext.getPackageName() + ".fileprovider", imageFile);

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("image/png");
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                if (caption != null && !caption.isEmpty()) {
                    shareIntent.putExtra(Intent.EXTRA_TEXT, caption);
                }
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, title != null ? title : "Share Receipt Photo");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(chooser);

            } catch (Exception e) {
                Log.e(TAG, "Error sharing image", e);
                runOnUiThread(() -> Toast.makeText(mContext, "Error sharing photo: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
        }

        @JavascriptInterface
        public void sharePdf(String base64Data, String filename, String title, String caption) {
            try {
                if (base64Data.contains(",")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }
                byte[] decoded = Base64.decode(base64Data, Base64.DEFAULT);

                File cacheDir = new File(mContext.getCacheDir(), "shared_files");
                if (!cacheDir.exists()) cacheDir.mkdirs();

                File pdfFile = new File(cacheDir, filename);
                FileOutputStream fos = new FileOutputStream(pdfFile);
                fos.write(decoded);
                fos.flush();
                fos.close();

                Uri contentUri = FileProvider.getUriForFile(mContext,
                        mContext.getPackageName() + ".fileprovider", pdfFile);

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("application/pdf");
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                if (caption != null && !caption.isEmpty()) {
                    shareIntent.putExtra(Intent.EXTRA_TEXT, caption);
                }
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, title != null ? title : "Share Receipt PDF");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(chooser);

            } catch (Exception e) {
                Log.e(TAG, "Error sharing PDF", e);
                runOnUiThread(() -> Toast.makeText(mContext, "Error sharing PDF: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
        }

        @JavascriptInterface
        public void printPage() {
            runOnUiThread(() -> {
                try {
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null && webView != null) {
                        PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter("VMH_Receipt");
                        printManager.print("VMH_Receipt", printAdapter, new PrintAttributes.Builder().build());
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Print error", e);
                    Toast.makeText(mContext, "Print error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public boolean saveOtaBundle(String htmlContent, String version) {
            try {
                if (htmlContent == null || htmlContent.length() < 30000) return false;
                copyAssetsToFilesDir();
                File otaFile = new File(mContext.getFilesDir(), "ota_index.html");
                FileOutputStream fos = new FileOutputStream(otaFile);
                fos.write(htmlContent.getBytes("UTF-8"));
                fos.flush();
                fos.close();

                mContext.getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE)
                        .edit()
                        .putString("ota_version", version != null ? version : "live")
                        .apply();
                Log.d(TAG, "OTA bundle written successfully. Version: " + version + ", Size: " + otaFile.length());
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Error saving OTA bundle", e);
                return false;
            }
        }

        @JavascriptInterface
        public boolean clearOtaBundle() {
            try {
                File otaFile = new File(mContext.getFilesDir(), "ota_index.html");
                if (otaFile.exists()) {
                    otaFile.delete();
                }
                mContext.getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE)
                        .edit()
                        .remove("ota_version")
                        .apply();
                Log.d(TAG, "OTA bundle cleared");
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Error clearing OTA bundle", e);
                return false;
            }
        }

        @JavascriptInterface
        public String getOtaVersion() {
            try {
                return mContext.getSharedPreferences("VMH_PREFS", Context.MODE_PRIVATE)
                        .getString("ota_version", "");
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public String getNativeAppVersion() {
            return BuildConfig.VERSION_NAME;
        }

        @JavascriptInterface
        public void reloadApp() {
            runOnUiThread(() -> {
                try {
                    File otaBundle = new File(mContext.getFilesDir(), "ota_index.html");
                    if (otaBundle.exists() && otaBundle.length() > 30000) {
                        Log.d(TAG, "Reloading from OTA bundle");
                        webView.loadUrl("file://" + otaBundle.getAbsolutePath());
                    } else {
                        Log.d(TAG, "Reloading from asset index.html");
                        webView.loadUrl("file:///android_asset/index.html");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error reloading app", e);
                }
            });
        }
    }

    private long backPressedTime = 0;

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("window.handleAndroidBackPressed ? window.handleAndroidBackPressed() : false;", value -> {
                if ("true".equals(value) || "\"true\"".equals(value)) {
                    // Handled inside JavaScript (e.g., smoothly returned to Dashboard)
                    return;
                }
                // Double tap back within 2 seconds to exit app from dashboard
                if (backPressedTime + 2000 > System.currentTimeMillis()) {
                    super.onBackPressed();
                } else {
                    Toast.makeText(this, "ऐप से बाहर निकलने के लिए दोबारा बैक दबाएं", Toast.LENGTH_SHORT).show();
                    backPressedTime = System.currentTimeMillis();
                }
            });
        } else {
            super.onBackPressed();
        }
    }
}

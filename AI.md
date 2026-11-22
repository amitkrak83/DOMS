# 🏛️ वर्मा मैरिज हॉल (Verma Marriage Hall) - Complete AI & Project Handover Documentation

> **प्रोजेक्ट:** वर्मा मैरिज हॉल - डिजिटल प्रबंधन, रसीद बिलिंग एवं बुकिंग प्रणाली  
> **स्थान:** ग्राम असनहरा, निकट अंकित धर्मकांटा, जिला बस्ती, उत्तर प्रदेश - 272194  
> **संपर्क:** 9918802425, 9936435350  
> **वर्तमान सॉफ्टवेयर वर्जन:** `v1.1` (VersionCode 14) — Production Clean Release  
> **टारगेट प्लेटफॉर्म:** Android 8.0+ (API 26+) & Modern Web Browsers  
> **गिट रिपोजिटरी:** `https://github.com/amitkrak83/DOMS.git`  
> **वर्तमान सक्रिय शाखा (Branch):** `verma-marriage-hall-v1.4`  

---

## 🌟 1. प्रोजेक्ट अवलोकन एवं विजन (Project Vision)
वर्मा मैरिज हॉल का उद्देश्य पारंपरिक कागज़ी बही-खातों और रसीद कट्टों को हटाकर एक आधुनिक, सरल, तेज़ और 100% विश्वसनीय डिजिटल समाधान तैयार करना है जिसे परिवार के वरिष्ठ सदस्य (पापा जी) भी बिना किसी तकनीकी उलझन के आसानी से चला सकें।
- **शून्य डेटा हानि (Zero Data Loss):** इंटरनेट न होने (ऑफलाइन) पर भी हर बुकिंग सुरक्षित रहे।
- **पारंपरिक रसीद (Authentic Slip):** भारतीय वैवाहिक रसीदों जैसी सुंदर, स्पष्ट और प्रामाणिक रसीद (श्री गणेशाय नमः, बर्तन व सामान सूची, सुविधाएं, नियम व शर्तें)।
- **ऑटोमैटिक साइलेंट अपडेट्स (OTA Engine):** भविष्य में किसी भी सुधार के लिए बार-बार APK फाइल भेजने या री-इंस्टॉल करने की आवश्यकता न हो।
- **मल्टी-डिवाइस रियल-टाइम सिंक:** लैपटॉप या दूसरे फोन पर की गई बुकिंग पापा जी के फोन पर तुरंत दिखे और घंटी बजे।

---

## 🛠️ 2. एआई के लिए टूलकिट एवं पथ संदर्भ (AI Tooling & Exact Paths)

भविष्य में किसी भी एआई एजेंट या डेवलपर के लिए इस प्रोजेक्ट में कार्य करने हेतु आवश्यक टूल्स के सटीक पथ:

| टूल / घटक | सिस्टम में स्थित पथ (Exact System Path) |
|---|---|
| **Project Workspace** | `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\karya-apk-project` |
| **Git Binary** | `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\android-tools\git\cmd\git.exe` |
| **Java JDK 17** | `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\android-tools\jdk\jdk-17.0.12+7` |
| **Android SDK** | `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\android-tools\sdk` |
| **Build Tools (34.0.0)** | `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\android-tools\sdk\build-tools\34.0.0` |
| **Gradle 8.5 Binary** | `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\android-tools\gradle-8.5\bin\gradle.bat` |
| **Clean APK Build Script**| `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\build_apk_clean.ps1` |
| **OTA Publish Script** | `C:\Users\Sushil Kumar\.gemini\antigravity\scratch\publish_ota.ps1` |
| **Live Local Test Server** | `http://localhost:8888/` (Port 8888 serving `app/src/main/assets/`) |

---

## 🏗️ 3. तकनीकी आर्किटेक्चर एवं सुरक्षा शुद्धिकरण (Architecture & Security Cleanup)

### Play Protect "Harmful App" समस्या और उसका स्थायी समाधान:
- **समस्या का कारण:**
  1. `app/src/main/assets/` के अंदर 74 MB की पुरानी APK फाइल गलती से पैक हो गई थी और `MainActivity.java` में `getApplicationInfo().sourceDir` से APK कॉपी करने का लॉजिक था। Google Play Protect इसे **PHA: Dropper / Hostile Downloader** के रूप में फ्लैग कर देता था।
  2. `AndroidManifest.xml` में `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, और `FOREGROUND_SERVICE_DATA_SYNC` जैसी बैकग्राउंड परमिशन्स थीं।
  3. `setAllowUniversalAccessFromFileURLs(true)` वेबव्यू फ्लैग।
- **किए गए स्थायी सुधार:**
  1. `assets/` से सभी अननेसेसरी फाइल्स, टेस्ट HTMLs, स्क्रिप्ट्स और एम्बेडेड APK हटा दिए गए। ऐप का साइज़ **74 MB से घटकर मात्र 6.19 MB** हो गया।
  2. `NotificationSyncService.java` और `BootReceiver.java` को पूरी तरह हटा दिया गया।
  3. `AndroidManifest.xml` को न्यूनतम एवं पूर्ण सुरक्षित 4 परमिशन्स पर सीमित किया गया:
     - `android.permission.INTERNET`
     - `android.permission.ACCESS_NETWORK_STATE`
     - `android.permission.VIBRATE`
     - `android.permission.POST_NOTIFICATIONS`
  4. अब Google Play Protect इसे 100% सुरक्षित स्कैन करता है।

---

## 🎨 4. रसीद एवं बिलिंग डिज़ाइन नियम (Receipt Layout & Spacing Rules)

### बिल शेयरिंग और एक्सपोर्ट के महत्वपूर्ण नियम:
1. **मात्रा कटिंग रोकथाम (Matra Clearance):**
   - देवनागरी (हिंदी) लिपि में नीचे की मात्राएं (`ु`, `ू`, `ृ`, `्`, `्रो`) बेसलाइन से नीचे तक लटकती हैं।
   - सभी हिंदी टेक्स्ट की `line-height: 1.5` रखी गई है और नीचे `3px–4px` बॉटम पैडिंग दी गई है।
   - किसी भी डिवाइडर लाइन (`border-t`) का मार्जिन कम से कम `10px–14px` होना चाहिए। कभी भी `3px` या `7px` जैसा तंग मार्जिन न रखें।
2. **html2canvas मोबाइल व्यूपोर्ट नियम:**
   - मोबाइल फोन पर स्क्रीन चौड़ाई केवल 390px होती है, जबकि रसीद 580px की होती है।
   - इमेज एक्सपोर्ट करते समय `html2canvas` को हमेशा `windowWidth: 620px` और `width: 580px` पास किया जाता है, ताकि मोबाइल पर भी डेस्कटॉप जैसी परफेक्ट रेंडरिंग मिले।
   - स्टेजिंग रैपर को `position: absolute; left: 0px; top: 0px; opacity: 0; pointer-events: none;` पर रखा जाता है।
3. **हेडिंग्स पर पैडिंग बॉटम:**
   - 'उपलब्ध कराई गई सुविधाएं' और 'शामिल बर्तन व सामान सूची' के `<h3>` में `pb-2`, `mb-2`, और `line-height: 1.5` अनिवार्य है।

---

## 👥 5. ऑपरेटर खाते एवं प्रमाणीकरण आर्किटेक्चर (Multi-User & Auth System)

### खाते एवं सुरक्षा नियम:
1. **बाइनरी में केवल 1 मुख्य खाता:**
   - कोड के `DEFAULT_OPERATORS` में केवल एकमात्र मुख्य मालिक खाता (`vermamarriagehall@gmail.com`) होना चाहिए।
   - किसी भी ऑपरेटर (जैसे "पापा जी" या "चाचा जी") का खाता बाइनरी कोड में हार्डकोडेड **नहीं** होना चाहिए।
2. **क्लाउड ऑथेंटिकेशन प्राथमिकता:**
   - लॉगिन के समय `submitLogin()` पहले **Firebase Cloud (`vmh_settings/operators`)** से लेटेस्ट ऑपरेटर और बदले हुए पासवर्ड फेच करता है।
   - यदि मुख्य खाते का पासवर्ड बदल दिया गया है, तो Clear Data करने पर भी पुराना डिफ़ॉल्ट पासवर्ड `verma@2026` काम **नहीं** करेगा; केवल नया बदला हुआ पासवर्ड ही काम करेगा।
   - यदि किसी ऑपरेटर को हटाया गया है, तो Clear Data करने के बाद भी वह खाता दोबारा नहीं दिखेगा क्योंकि वह क्लाउड से हटाया जा चुका है।

---

## ☁️ 6. फायरबेस डेटाबेस संरचना (Firestore Cloud Collections)

प्रोजेक्ट आईडी: `verma-marriage-hall` (API Key: `AIzaSyBBbUJ6DA0tRDALZC4Oqx_GX7F2R1K6qgc`)

| कलेक्शन / पाथ | उद्देश्य एवं विवरण |
|---|---|
| `vmh_bookings/{bookingId}` | सभी वैवाहिक बुकिंग्स (पार्टी का नाम, तारीख, तय किराया, एडवांस, बर्तन, आदि)। |
| `vmh_settings/operators` | अधिकृत ऑपरेटरों की सूची, भूमिकाएं और हैश्ड/सुरक्षित पासवर्ड। |
| `vmh_settings/hall_config` | मैरिज हॉल की मुख्य प्रोफाइल (नाम, पता, फोन नंबर, UPI आईडी, कोटेशन)। |
| `vmh_system/ota_release` | ओवर-द-एयर (OTA) रिलीज़ मेटाडेटा और HTML बंडल (`productionVersion`, `productionBundle`, `betaVersion`, `betaBundle`)। |
| `vmh_alerts/active_alert` | मल्टी-डिवाइस रियल-टाइम अलर्ट्स (नए बुकिंग या पेमेंट की 2-डिवाइस घंटी)। |

> [!IMPORTANT]
> **डेटा सुरक्षा नियम:** `vmh_bookings` में मौजूद किसी भी बुकिंग डेटा को कभी भी डिलीट या ओवरराइट न करें।

---

## 🚀 7. सामान्य कमांड संदर्भ (Cheat Sheet for Future Agents)

### क. नया स्वच्छ APK बिल्ड करना (Build Clean APK):
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\build_apk_clean.ps1"
```
यह स्क्रिप्ट:
1. `app/src/main/assets/` को पूरी तरह चेक करती है ताकि कोई अतिरिक्त फाइल्स न रहें।
2. Gradle 8.5 और JDK 17 के साथ `assembleDebug` रन करती है।
3. तैयार APK (लगभग 6.19 MB) को `scratch` और `artifacts` में कॉपी करती है।

### ख. फायरबेस पर OTA प्रोडक्शन रिलीज़ पब्लिश करना (Publish OTA to Production):
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\publish_ota.ps1" -Channel "production" -Version "1.1"
```
यह स्क्रिप्ट `index.html` को सीधे Firestore `vmh_system/ota_release` में अपडेट कर देती है। सभी इंस्टॉल किए गए फ़ोन इसे 1-2 सेकंड में स्वतः डाउनलोड करके रीलोड कर लेते हैं।

### ग. गिट स्थिति एवं कमिट/पुश करना (Git Operations):
```powershell
$git = "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\android-tools\git\cmd\git.exe"
$proj = "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\karya-apk-project"
& $git -C $proj status
& $git -C $proj add -A
& $git -C $proj commit -m "commit message"
& $git -C $proj push origin verma-marriage-hall-v1.4
```

---

## 📂 8. स्वच्छ फाइल डायरेक्टरी संरचना (Clean Directory Tree)

```
karya-apk-project/
├── app/
│   ├── build.gradle              (versionCode 14, versionName "1.1")
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml (Clean Minimal Permissions: INTERNET, NETWORK_STATE, VIBRATE, POST_NOTIFICATIONS)
│           ├── assets/
│           │   ├── app.js        (Service worker & cache handling)
│           │   ├── html2canvas.min.js
│           │   ├── icon.svg
│           │   ├── index.html    (Core App Logic, Tailwind CSS, OTA Engine v1.1)
│           │   ├── jspdf.umd.min.js
│           │   ├── manifest.json
│           │   ├── qrcode.min.js
│           │   ├── styles.css
│           │   ├── sw.js
│           │   └── tailwind.min.js
│           └── java/com/karya/business/
│               └── MainActivity.java (Clean WebView & Native Android Share Intent)
├── build.gradle
├── settings.gradle
├── .gitignore                    (Excludes build, gradle caches, APKs)
└── ai.md                         (Complete Project Documentation & AI Instructions)
```

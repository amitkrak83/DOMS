# 🏛️ वर्मा मैरिज हॉल (Verma Marriage Hall) - Complete AI & Project Handover Documentation

> **प्रोजेक्ट:** वर्मा मैरिज हॉल - डिजिटल प्रबंधन, रसीद बिलिंग एवं बुकिंग प्रणाली  
> **स्थान:** ग्राम असनहरा, निकट अंकित धर्मकांटा, जिला बस्ती, उत्तर प्रदेश - 272194  
> **संपर्क:** 9918802425, 9936435350  
> **वर्तमान सॉफ्टवेयर वर्जन:** `v1.2.1` (VersionCode 16) — Production Clean Release  
> **टारगेट प्लेटफॉर्म:** Android 8.0+ (API 26+) & Modern Web Browsers  
> **गिट रिपोजिटरी:** `https://github.com/amitkrak83/DOMS.git`  
> **वर्तमान सक्रिय शाखा (Branch):** `verma-marriage-hall-v1.4`  

---

## 🌟 1. प्रोजेक्ट अवलोकन एवं विजन (Project Vision)
वर्मा मैरिज हॉल का उद्देश्य पारंपरिक कागज़ी बही-खातों और रसीद कट्टों को हटाकर एक आधुनिक, सरल, तेज़ और 100% विश्वसनीय डिजिटल समाधान तैयार करना है जिसे परिवार के वरिष्ठ सदस्य (पापा जी) भी बिना किसी तकनीकी उलझन के आसानी से चला सकें।
- **शून्य डेटा हानि (Zero Data Loss):** इंटरनेट न होने (ऑफलाइन) पर भी हर बुकिंग सुरक्षित रहे।
- **पारंपरिक रसीद (Authentic Slip):** भारतीय वैवाहिक रसीदों जैसी सुंदर, स्पष्ट और प्रामाणिक रसीद (श्री गणेशाय नमः, बर्तन व सामान सूची, सुविधाएं, नियम व शर्तें)।
- **ऑटोमैटिक साइलेंट अपडेट्स (OTA Engine):** भविष्य में किसी भी सुधार के लिए बार-बार APK फाइल भेजने या री-इंस्टॉल करने की आवश्यकता न हो।
- **मल्टी-डिवाइस रियल-टाइम सिंक:** लैपटॉप, फोन या टैबलेट पर की गई बुकिंग सभी जुड़े उपकरणों पर तुरंत दिखे और घंटी बजे।

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
- **किए गए स्थायी सुधार:**
  1. `assets/` से सभी अननेसेसरी फाइल्स, टेस्ट HTMLs, स्क्रिप्ट्स और एम्बेडेड APK हटा दिए गए। ऐप का साइज़ **74 MB से घटकर मात्र 6.2 MB** हो गया।
  2. `NotificationSyncService.java` और `BootReceiver.java` को पूरी तरह हटा दिया गया।
  3. `AndroidManifest.xml` को न्यूनतम एवं पूर्ण सुरक्षित 4 परमिशन्स पर सीमित किया गया:
     - `android.permission.INTERNET`
     - `android.permission.ACCESS_NETWORK_STATE`
     - `android.permission.VIBRATE`
     - `android.permission.POST_NOTIFICATIONS`
  4. अब Google Play Protect इसे 100% सुरक्षित स्कैन करता है।

---

## 🔄 4. मल्टी-डिवाइस रियल-टाइम सिंक एवं नोटिफिकेशन आर्किटेक्चर (v1.2)

### समस्या एवं मूल कारण (Root Cause Analysis):
1. **डिवाइस आईडी टकराव (Device ID Collision):**
   - फोन और टैबलेट दोनों के पास एक ही `myDeviceId` (`dev_s0znijp_1795171035836`) था, क्योंकि वह localStorage सिंक के माध्यम से एक से दूसरे में कॉपी हो गया था।
   - जब फोन से नोटिफिकेशन भेजा गया, तो टैबलेट को फायरबेस से अलर्ट तो मिला, लेकिन उसने `senderId === myDeviceId` चेक करके यह समझ लिया कि यह अलर्ट उसने खुद भेजा है, और बीप/नोटिफिकेशन को साइलेंटली ड्राप कर दिया।
2. **क्लाउड डिलीशन का ऑफलाइन री-ऐड (Re-add Deletion Bug):**
   - जब फोन से बुकिंग्स डिलीट की गईं, तो टैबलेट का पुराना सिंक लॉजिक क्लाउड में न मिलने वाली बुकिंग्स को "ऑफ़लाइन बनाई गई नई बुकिंग्स" मानकर वापस रिपोजिटरी में जोड़ देता था और क्लाउड में दोबारा पुश कर देता था।
3. **एंड्रॉइड वेबव्यू स्लीप/वेक (WebView Sleep Zombie Connection):**
   - फोन या टैब की स्क्रीन लॉक होने या बैकग्राउंड में जाने पर वेबव्यू का फायरबेस वेबसॉकेट कनेक्शन फ्रीज हो जाता था। स्क्रीन अनलॉक होने पर जब तक ऐप को रिज्यूम पिंग न मिले, वह पुराना कैश्ड डेटा ही दिखाता रहता था।
4. **हार्डकोडेड फिल्टर बग:**
   - कोड में `b.id !== 'VMH-2026-001'` हार्डकोडेड था, जिसके कारण पहली बुकिंग `VMH-2026-001` लोड होते ही छिप जाती थी।

### v1.2 में लागू किए गए स्थायी समाधान:
1. **हार्डवेयर-आधारित अनूठी डिवाइस आईडी (`android_Settings.Secure.ANDROID_ID`):**
   - प्रत्येक भौतिक डिवाइस (फोन, टैबलेट, लैपटॉप) की डिवाइस आईडी हार्डवेयर लेवल पर अलग और सुरक्षित है। इसे जावास्क्रिप्ट या लोकलस्टोरेज द्वारा ओवरराइट नहीं किया जा सकता।
2. **क्लाउड मास्टर ट्रुथ (Cloud Master Source of Truth):**
   - सिंक के दौरान जब डिवाइस ऑनलाइन होता है, तो फायरबेस क्लाउड डेटा हमेशा मास्टर ट्रुथ होता है। क्लाउड से डिलीट की गई बुकिंग्स टैबलेट या फोन के लोकल कैशे से भी तुरंत हट जाती हैं।
3. **फास्ट आरईएसटी सिंक एवं हार्टबीट रेज़्यूमे (`visibilitychange` & `onfocus`):**
   - जैसे ही यूजर ऐप खोलता है, स्क्रीन ऑन करता है, या टैब पर आता है (`visibilitychange` या `window.onfocus`), 10-सेकंड का हार्टबीट और आरईएसटी पोलर तुरंत फायरबेस से फ्रेश डेटा और पेंडिंग अलर्ट्स सिंक कर लेता है।
4. **हेडर सिंक बैज (One-Tap Live Force Sync):**
   - हेडर में एक लाइव सिंक स्टेटस बैज (`2-फोन सिंक ☁️`) जोड़ा गया है। यदि कभी नेटवर्क ड्रॉप हो, तो यूजर इस पर टैप करके तुरंत फोर्स-सिंक कर सकता है।

---

## 🎛️ 5. एडमिन हब डायनामिक क्रूड प्रबंधन (Dynamic Admin CRUD v1.2)

### क. कार्यक्रम आयोजन प्रबंधन (Event Occasions CRUD):
- एडमिन हब में नया कार्ड **"कार्यक्रम आयोजन"**।
- एडमिन नए आयोजन जोड़ सकता है (जैसे: विवाह समारोह, तिलक, प्रीतिभोज, जन्मदिन, मुंडन, आदि)।
- किसी भी आयोजन का नाम, इमोजी/आइकन एडिट कर सकता है या डिलीट कर सकता है।
- **ऑटोमैटिक फॉर्म सिंक:** बुकिंग फॉर्म में यह डायनामिक टच-चिप्स के रूप में तुरंत रेंडर होता है।

### ख. कार्यक्रम समय स्लॉट प्रबंधन (Timing Slots CRUD):
- एडमिन हब में नया कार्ड **"कार्यक्रम समय स्लॉट"**।
- स्लॉट का नाम (जैसे: रात का कार्यक्रम, दिन का कार्यक्रम, प्रातःकाल स्लॉट), आइकन (🌙, ☀️), समय विवरण ("शाम 04:00 से अगली सुबह 08:00 तक"), और अगला दिन ध्वज (`nextDay`) का पूरा CRUD।
- **डायनामिक उपलब्धता काउंटर:** बुकिंग फॉर्म में "2/2 उपलब्ध", "1/2 उपलब्ध", या "0/2 बुक (पूर्ण)" का डायनामिक कैलकुलेशन।
- **रसीद एवं शेयर इमेज पर डायनामिक स्लॉट समय:** रसीद स्लिप और एक्सपोर्टेड बिल इमेज पर स्लॉट का समय हार्डकोडेड न होकर एडमिन द्वारा निर्धारित समय से स्वतः निकलता है।

### ग. एडमिन स्क्रॉल स्थिति संरक्षण (Scroll Restoration):
- एडमिन हब में नीचे स्क्रॉल करके किसी सब-व्यू में जाने और `← वापस` बटन दबाने पर पेज का स्क्रॉल रीसेट नहीं होता; यूजर ठीक उसी स्थान पर वापस आता है।

---

## 📤 6. हेडर शेयर से असली APK फाइल शेयरिंग (Android FileProvider)

- **समस्या:** हेडर का शेयर आइकन पहले केवल टेक्स्ट मैसेज भेज रहा था, असली APK बाइनरी फाइल शेयर नहीं हो रही थी।
- **समाधान:** `MainActivity.java` में `shareApk()` को `FileProvider` के माध्यम से सुधारा गया। अब शेयर पर क्लिक करने पर `application/vnd.android.package-archive` MIME प्रकार के साथ `VermaMarriageHall.apk` असली फाइल WhatsApp या अन्य ऐप्स पर भेजी जाती है।

---

## 🚪 7. लॉगआउट मोडल स्टैकिंग बग निवारण (Logout Modal Fix)

- **समस्या:** यूजर प्रोफाइल मोडल में "लॉगआउट करें" पर क्लिक करने पर कन्फर्मेशन डायलॉग प्रोफाइल मोडल के पीछे छिप जाता था, और बैक बटन दबाने पर दिखता था।
- **समाधान:** 
  1. `genericConfirmModal` का z-index बढ़ाकर `z-[100]` किया गया।
  2. `logoutCurrentUser()` पहले प्रोफाइल मोडल को बंद करता है, फिर स्वच्छ रूप से कन्फर्मेशन दिखाता है।
  3. "हाँ, लॉगआउट करें" पर क्लिक करने पर सत्र स्वच्छ होकर सीधे लॉगिन स्क्रीन पर ले जाता है।

---

## 🎨 8. रसीद एवं बिलिंग डिज़ाइन नियम (Receipt Layout & Spacing Rules)

1. **मात्रा कटिंग रोकथाम (Matra Clearance):**
   - देवनागरी (हिंदी) लिपि में नीचे की मात्राएं (`ु`, `ू`, `ृ`, `्`, `्रो`) बेसलाइन से नीचे तक लटकती हैं।
   - सभी हिंदी टेक्स्ट की `line-height: 1.5` रखी गई है और नीचे `3px–4px` बॉटम पैडिंग दी गई है।
   - किसी भी डिवाइडर लाइन (`border-t`) का मार्जिन कम से कम `10px–14px` होना चाहिए। कभी भी `3px` या `7px` जैसा तंग मार्जिन न रखें।
2. **html2canvas मोबाइल व्यूपोर्ट नियम:**
   - मोबाइल फोन पर स्क्रीन चौड़ाई केवल 390px होती है, जबकि रसीद 580px की होती है।
   - इमेज एक्सपोर्ट करते समय `html2canvas` को हमेशा `windowWidth: 620px` और `width: 580px` पास किया जाता है, ताकि मोबाइल पर भी डेस्कटॉप जैसी परफेक्ट रेंडरिंग मिले।
   - स्टेजिंग रैपर को `position: absolute; left: 0px; top: 0px; opacity: 0; pointer-events: none;` पर रखा जाता है।

---

## 👥 9. ऑपरेटर खाते एवं प्रमाणीकरण आर्किटेक्चर (Multi-User & Auth System)

1. **बाइनरी में केवल 1 मुख्य खाता:**
   - कोड के `DEFAULT_OPERATORS` में केवल एकमात्र मुख्य मालिक खाता (`vermamarriagehall@gmail.com`) होना चाहिए।
   - किसी भी ऑपरेटर (जैसे "पापा जी" या "चाचा जी") का खाता बाइनरी कोड में हार्डकोडेड **नहीं** होना चाहिए।
2. **क्लाउड ऑथेंटिकेशन प्राथमिकता:**
   - लॉगिन के समय `submitLogin()` पहले **Firebase Cloud (`vmh_settings/operators`)** से लेटेस्ट ऑपरेटर और बदले हुए पासवर्ड फेच करता है।
   - यदि मुख्य खाते का पासवर्ड बदल दिया गया है, तो Clear Data करने पर भी पुराना डिफ़ॉल्ट पासवर्ड `verma@2026` काम **नहीं** करेगा; केवल नया बदला हुआ पासवर्ड ही काम करेगा।

---

## ☁️ 10. फायरबेस डेटाबेस संरचना (Firestore Cloud Collections)

प्रोजेक्ट आईडी: `verma-marriage-hall` (API Key: `AIzaSyBBbUJ6DA0tRDALZC4Oqx_GX7F2R1K6qgc`)

| कलेक्शन / पाथ | उद्देश्य एवं विवरण |
|---|---|
| `vmh_bookings/{bookingId}` | सभी वैवाहिक बुकिंग्स (पार्टी का नाम, तारीख, तय किराया, एडवांस, बर्तन, आदि)। |
| `vmh_settings/operators` | अधिकृत ऑपरेटरों की सूची, भूमिकाएं और सुरक्षित पासवर्ड। |
| `vmh_settings/hall_config` | मैरिज हॉल की मुख्य प्रोफाइल, सुविधाएं, बर्तन सूची, नियम, आयोजन (occasions), और समय स्लॉट (timingSlots)। |
| `vmh_system/ota_release` | ओवर-द-एयर (OTA) रिलीज़ मेटाडेटा और HTML बंडल (`productionVersion`, `productionBundle`)। |
| `vmh_alerts/active_alert` | मल्टी-डिवाइस रियल-टाइम अलर्ट्स (नए बुकिंग या पेमेंट की 2-डिवाइस घंटी)। |

> [!IMPORTANT]
> **डेटा सुरक्षा नियम:** `vmh_bookings` में मौजूद किसी भी बुकिंग डेटा को कभी भी अनपेक्षित रूप से डिलीट या ओवरराइट न करें।

---

## 🚀 11. सामान्य कमांड संदर्भ (Cheat Sheet for Future Agents)

### क. नया स्वच्छ APK बिल्ड करना (Build Clean APK):
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\build_apk_clean.ps1"
```

### ख. फायरबेस पर OTA प्रोडक्शन रिलीज़ पब्लिश करना (Publish OTA to Production):
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\publish_ota.ps1" -Channel "production" -Version "1.2"
```

### ग. गिट स्थिति एवं कमिट/पुश करना (Git Operations):
```powershell
$git = "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\android-tools\git\cmd\git.exe"
$proj = "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\karya-apk-project"
& $git -C $proj status
& $git -C $proj add -A
& $git -C $proj commit -m "feat: dynamic occasion/slot CRUD, real APK share, isolated device IDs and multi-device sync"
& $git -C $proj push origin verma-marriage-hall-v1.4
```

---

## 📂 12. स्वच्छ डायरेक्टरी संरचना (Clean Tree)

```
karya-apk-project/
├── app/
│   ├── build.gradle              (versionCode 15, versionName "1.2")
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml (Clean Minimal Permissions: INTERNET, NETWORK_STATE, VIBRATE, POST_NOTIFICATIONS)
│           ├── assets/
│           │   ├── app.js        (Service worker & cache handling)
│           │   ├── html2canvas.min.js
│           │   ├── icon.svg
│           │   ├── index.html    (Core App Logic, Tailwind CSS, OTA Engine v1.2, Dynamic Occasion/Slot CRUD)
│           │   ├── jspdf.umd.min.js
│           │   ├── manifest.json
│           │   ├── qrcode.min.js
│           │   ├── styles.css
│           │   ├── sw.js
│           │   └── tailwind.min.js
│           └── java/com/karya/business/
│               └── MainActivity.java (Isolated Hardware Device ID & Native FileProvider APK Sharing)
├── build.gradle
├── settings.gradle
├── .gitignore                    (Excludes build, gradle caches, APKs)
└── AI.md                         (Complete Project Documentation & AI Instructions)
```

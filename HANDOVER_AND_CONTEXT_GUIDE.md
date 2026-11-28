# 🏛️ वर्मा मैरिज हॉल (VMH) — दूसरे लैपटॉप हेतु संपूर्ण हैंडओवर एवं संदर्भ गाइड
*(Complete Zero-Dependency Handover, Setup & Context Guide for Transition to Another Laptop)*

> **प्रोजेक्ट:** वर्मा मैरिज हॉल डिजिटल प्रबंधन एवं बुकिंग सिस्टम  
> **रिपॉजिटरी:** `https://github.com/amitkrak83/DOMS.git`  
> **मुख्य विकास शाखा (VMH):** `verma-marriage-hall-v1.4`  
> **FMCG शाखा (कोल्ड ड्रिंक्स व हल्दीराम्स):** `fmcg-cold-drinks-and-haldirams`  
> **तारीख:** 28 नवम्बर 2026  
> **वर्तमान संस्करण स्थिति:**  
> - 🔒 **प्रोडक्शन ऐप (Production):** `v2.1.2` (versionCode 30, Package: `com.karya.business`) — 100% सुरक्षित, अछूता एवं स्थिर बाइनरी (5.97 MB)  
> - 🚀 **बीटा ऐप (Beta Channel):** `v2.5.3-beta` (versionCode 30, Package: `com.karya.business.beta`) — नवीनतम लाइव OTA (641 KB) एवं APK (7.30 MB)  

---

## 📌 1. नए लैपटॉप पर त्वरित सेटअप (Setup on New Laptop)

### 1.1 कोड क्लोन करना (Clone Repository)
```bash
# 1. मुख्य मैरिज हॉल प्रोजेक्ट (VMH v1.4) क्लोन करें:
git clone -b verma-marriage-hall-v1.4 https://github.com/amitkrak83/DOMS.git vmh-project
cd vmh-project

# 2. FMCG (कोल्ड ड्रिंक्स व हल्दीराम्स) शाखा की जाँच या क्लोन:
git fetch origin fmcg-cold-drinks-and-haldirams:fmcg-cold-drinks-and-haldirams
```

### 1.2 आवश्यक विकास उपकरण (Development Prerequisites)
1. **Java JDK:** OpenJDK 17 (Java 17)
2. **Android SDK:** Compile SDK 34, Min SDK 24, Build Tools 34.0.0
3. **Gradle:** Gradle 8.5 (या `./gradlew`)
4. **Node.js:** Node 18+ (सहायक स्क्रिप्ट्स, सिंटैक्स पार्सिंग एवं टेस्टिंग हेतु)

### 1.3 एनवायरनमेंट वेरिएबल्स सेट करना (Windows PowerShell Example)
```powershell
$env:JAVA_HOME = "C:\Path\To\jdk-17"
$env:ANDROID_HOME = "C:\Path\To\android-sdk"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
```

### 1.4 दोनों एपीके का निर्माण (Build APKs)
* **बीटा ऐप बिल्ड (Debug/Beta APK):**
  ```bash
  gradle assembleDebug
  # आउटपुट: app/build/outputs/apk/debug/app-debug.apk
  # पैकेज: com.karya.business.beta | लेबल: VMH (Beta) | वर्ज़न: v2.5.3-beta
  ```
* **प्रोडक्शन ऐप बिल्ड (Release APK):**
  ```bash
  gradle assembleRelease
  # आउटपुट: app/build/outputs/apk/release/app-release.apk
  # पैकेज: com.karya.business | लेबल: वर्मा मैरिज हॉल | वर्ज़न: v2.1.2
  ```

---

## 🧪 2. स्वचालित टेस्टिंग एवं स्क्रिप्ट्स (Automated Verification)

प्रोजेक्ट के अंदर `scripts/` फ़ोल्डर में आवश्यक स्वचालित टूल्स उपलब्ध हैं:

1. **HTML व स्क्रिप्ट्स सिंटैक्स सत्यापन:**
   ```bash
   node scripts/validate_scripts.js
   # यह सुनिश्चित करता है कि index.html के सभी 16 जावास्क्रिप्ट ब्लॉक्स 100% सिंटैक्स एरर-फ्री हैं।
   ```

2. **बिलिंग CRUD व पेमेंट पार्शियल अपडेट टेस्ट सूट:**
   ```bash
   node scripts/test_billing_crud.js
   # यह टेस्ट करता है:
   # - ₹2 गलती से दर्ज एडवांस को 0 करने पर पेमेंट रिकॉर्ड का पूर्ण विलोपन व बैलेंस रीकैलकुलेशन।
   # - एडवांस को ₹5,000 करने पर PAY-1 का सही अपडेट।
   # - लेजर से पेमेंट डिलीट करने पर शेष बकाया का स्वतः बढ़ना।
   # - बर्तन सूची में अनचेक किए गए सामान का बिल से स्वतः बाहर होना।
   # - रसीद टॉप बार 3-बटन स्वच्छ लेआउट की पुष्टि।
   # - WebView 100% टेक्स्ट ज़ूम लॉक व FCM डेटा पुश सत्यापन।
   ```

3. **बीटा इन-ऐप OTA क्लाउड डिप्लॉयमेंट:**
   ```bash
   node scripts/deploy_beta_ota.js
   # यह index.html को क्लाउड पर vmh_system/ota_beta और vmh_system/ota_release (मेटाडेटा) पर डिप्लॉय करता है।
   ```

---

## ☁️ 3. फ़ायरबेस एवं क्लाउड आर्किटेक्चर (Firebase & Cloud Architecture)

* **फ़ायरबेस प्रोजेक्ट:** `verma-marriage-hall`
* **डेटाबेस:** Cloud Firestore (Default Database)
* **REST API Base URL:** `https://firestore.googleapis.com/v1/projects/verma-marriage-hall/databases/(default)/documents/`
* **API Key:** `AIzaSyBBbUJ6DA0tRDALZC4Oqx_GX7F2R1K6qgc`

### डेटा पृथक्करण एवं टॉपिक मैपिंग (Dual-Environment Collections):
| वातावरण | पैकेज आईडी | ऐप लेबल | बुकिंग्स कलेक्शन | अलर्ट्स कलेक्शन | ऑपरेटर सेटिंग्स | OTA डॉक्युमेंट | FCM टॉपिक्स |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **प्रोडक्शन** | `com.karya.business` | वर्मा मैरिज हॉल | `vmh_bookings` | `vmh_alerts` | `vmh_settings/operators` | `vmh_system/ota_release` | `all_devices`, `vmh_bookings` |
| **बीटा** | `com.karya.business.beta` | VMH (Beta) | `beta_vmh_bookings` | `beta_vmh_alerts` | `beta_vmh_settings/operators` | `vmh_system/ota_beta` | `beta_all_devices`, `beta_vmh_bookings` |

### 🔔 FCM पुश ब्रॉडकास्ट कंडीशन:
`dispatchFcmPush` फंक्शन में कंडीशन लागू है:
`condition: "'all_devices' in topics || 'beta_all_devices' in topics"`
- यह सुनिश्चित करता है कि जब किसी एक ऐप से बुकिंग या पेमेंट दर्ज हो, तो दोनों ऐप एनवायरनमेंट्स (प्रोडक्शन व बीटा) के सभी फ़ोनों पर बिना छूटे अलर्ट जाए।
- पेलोड से टॉप-लेवल `notification` हटाकर शुद्ध `data` मैसेज भेजा जाता है, जिससे `MyFirebaseMessagingService.java` में `senderDeviceId === myDeviceId` के तहत भेजने वाले फोन पर रिंग नहीं बजती, जबकि दूसरे फ़ोनों पर तेज रिंग और वाइब्रेशन बजता है।

---

## 🏛️ 4. हालिया लागू किए गए समाधान (Latest Fixes in v2.5.3-beta)

1. **एडवांस पेमेंट शून्य रीसेट एवं लेजर नियंत्रण:**
   - जब भी यूजर बुकिंग एडिट करके एडवांस को `0` करता है, तो `saveCurrentBooking()` फंक्शन पुराने गलत पेमेंट रिकॉर्ड (उदा. ₹2) को पूरी तरह हटा देता है। एडवांस `₹0` और बैलेंस ड्यू कुल किराए के बराबर हो जाता है।
   - रसीद पर एकल भुगतान (सिंगल पेमेंट) होने पर भी पेमेंट लेजर टेबल दिखती है, और `⋮` बटन से कभी भी 'पेमेंट बदलें (Edit)' या 'भुगतान हटाएं (Delete)' किया जा सकता है।
2. **रसीद टॉप-बार 3-बटन स्वच्छ लेआउट:**
   - रसीद के ऊपर से गैर-जरूरी `[भुगतान]` (बॉडी में पहले से उपलब्ध) और `[सेवाएँ]` (एडिट फॉर्म में उपलब्ध) बटन हटा दिए गए।
   - ऊपर केवल 3 बड़े, स्पष्ट और समान चौड़ाई के बटन हैं: **[शेयर]**, **[एडिट]**, **[डिलीट]**।
3. **1-स्टेप डायरेक्ट शेयर (WhatsApp/Share Sheet):**
   - शेयर पर क्लिक करने पर कोई भी फोटो/पीडीएफ चयन पॉपअप नहीं आता। सीधे रसीद की हाई-डेफिनिशन PNG फोटो तैयार होकर WhatsApp/शेयर मेनू में खुलती है।
4. **बर्तन व सामान सूची में चेकबॉक्स:**
   - हर बर्तन के आगे चेकबॉक्स जोड़ा गया। किसी बुकिंग में कोई सामान न देने पर अनचेक कर सकते हैं, जिससे वह फाइनल रसीद से स्वतः बाहर हो जाता है।
5. **यूनिवर्सल फॉन्ट साइज़ लॉक (100% TextZoom Lock):**
   - `MainActivity.java` में `webSettings.setTextZoom(100);` एवं CSS में `text-size-adjust: 100% !important;` लागू किया गया है।
   - Motorola G64 समेत किसी भी फोन की सिस्टम फॉन्ट सेटिंग्स में फॉन्ट बड़ा या छोटा होने पर भी ऐप के लेआउट और अक्षरों पर कोई प्रभाव नहीं पड़ता।

---

## 🔑 5. डिफ़ॉल्ट ऑपरेटर क्रेडेंशियल्स (Operator Login Credentials)

| ऑपरेटर नाम | भूमिका | डिफ़ॉल्ट पासवर्ड |
| :--- | :--- | :--- |
| **वर्मा मैरिज हॉल** | मालिक (Owner/Admin) | `1234` |
| **सुशील कुमार** | वरिष्ठ ऑपरेटर (Manager) | `1234` |
| **अमित वर्मा** | सहायक ऑपरेटर (Staff) | `1234` |

---

## 🏪 6. FMCG प्रोजेक्ट स्थिति (कोल्ड ड्रिंक्स व हल्दीराम्स)

* **शाखा:** `origin/fmcg-cold-drinks-and-haldirams`
* **मुख्य विनिर्देश:** `VERMA_COLD_DRINK_HALDIRAM_APP_SPECIFICATION.md` (14-पॉइंट विस्तृत PRD)
* **वेब प्रोटोटाइप सिमुलेटर:** `verma_rice_mill_fmcg_screens_preview.html` (6-स्क्रीन इंटरएक्टिव मॉकअप)
* **हैंडओवर गाइड:** `FMCG_HANDOVER_AND_KICKOFF.md`
* **विशेष फीचर:** स्मार्ट ऑटो-मार्जिन कैलकुलेटर (1.14x / 1.16x मल्टीप्लायर फॉर्मूला)।

---

## 🎯 7. नए लैपटॉप पर अगले कदम एवं कार्य योजना (Next Steps on New Laptop)

1. **पापा जी के दृष्टिकोण से यूएक्स सरलीकरण (Senior Citizen Accessibility Review):**
   - भाग 2 में लिस्ट किए गए क्लटर आइटम्स पर चर्चा:
     - फॉर्म में गैर-जरूरी खाली सेक्शन्स को हाइड रखना।
     - एडमिन सेटिंग्स में डेवलपर ऑप्शन्स को केवल पिन से सुरक्षित रखना ताकि गलती से क्लिक न हो।
     - अत्यधिक छोटे हिंट्स व फुटर्स को न्यूनतम 13px-14px पर सेट करना।
2. **प्रोडक्शन रिलीज निर्णय:**
   - जब यूज़र बीटा ऐप (v2.5.3-beta) की संपूर्ण टेस्टिंग से पूरी तरह संतुष्ट हों, तब यूज़र की स्पष्ट अनुमति लेकर ही प्रोडक्शन चैनल पर प्रोमोट करना। (वर्तमान में प्रोडक्शन v2.1.2 पर 100% लॉक है)।
3. **FMCG ऐप का कार्यान्वयन:**
   - शाखा `fmcg-cold-drinks-and-haldirams` पर कोल्ड ड्रिंक एवं हल्दीराम्स ऐप का विकास शुरू करना।

---
*यह संपूर्ण दस्तावेज GitHub रिपॉजिटरी पर कमिटेड है और नए सिस्टम पर बिना किसी रुकावट के कार्य जारी रखने का एकमात्र आधिकारिक 'Source of Truth' है।*

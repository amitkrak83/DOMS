# 🏛️ वर्मा मैरिज हॉल (VMH) — दूसरे लैपटॉप हेतु हैंडओवर एवं संदर्भ गाइड
*(Complete Handover, Setup & Context Guide for Transition to Another Laptop)*

> **प्रोजेक्ट:** वर्मा मैरिज हॉल डिजिटल प्रबंधन एवं बुकिंग सिस्टम  
> **रिपॉजिटरी:** `https://github.com/amitkrak83/DOMS.git`  
> **मुख्य विकास शाखा (VMH):** `verma-marriage-hall-v1.4`  
> **FMCG शाखा (कोल्ड ड्रिंक्स व हल्दीराम्स):** `fmcg-cold-drinks-and-haldirams`  
> **तारीख:** 26 नवम्बर 2026  
> **वर्तमान संस्करण स्थिति:**  
> - 🔒 **प्रोडक्शन (Production):** `v2.1.2` (versionCode 25, Package: `com.karya.business`) — 100% सुरक्षित, अछूता एवं लॉक  
> - 🚀 **बीटा (Beta Channel):** `v2.5.2-beta` (versionCode 29, Package: `com.karya.business.beta`) — नवीनतम लाइव OTA एवं APK  

---

## 📌 1. नए लैपटॉप पर त्वरित सेटअप (Setup on New Laptop)

### 1.1 कोड क्लोन करना (Clone Repository)
```bash
git clone -b verma-marriage-hall-v1.4 https://github.com/amitkrak83/DOMS.git vmh-project
cd vmh-project
```

### 1.2 आवश्यक विकास उपकरण (Development Prerequisites)
1. **Java JDK:** OpenJDK 17 (Java 17)
2. **Android SDK:** Compile SDK 34, Min SDK 24, Build Tools 34.0.0
3. **Gradle:** Gradle 8.5 (या `./gradlew`)
4. **Node.js (वैकल्पिक/सहायक):** Node 18+ (HTML पार्सिंग एवं सिंटैक्स सत्यापन हेतु)

### 1.3 एपीके निर्माण (Build APK)
* **बीटा ऐप बिल्ड (Debug/Beta APK):**
  ```bash
  gradle assembleDebug
  # आउटपुट: app/build/outputs/apk/debug/app-debug.apk (VMH Beta - v2.5.2-beta)
  ```
* **प्रोडक्शन ऐप बिल्ड (Release APK):**
  ```bash
  gradle assembleRelease
  # आउटपुट: app/build/outputs/apk/release/app-release.apk (v2.1.2 Production)
  ```

---

## ☁️ 2. फ़ायरबेस एवं क्लाउड आर्किटेक्चर (Firebase & Cloud Architecture)

* **फ़ायरबेस प्रोजेक्ट:** `verma-marriage-hall`
* **डेटाबेस:** Cloud Firestore (Default Database)
* **वेब REST API URL:** `https://firestore.googleapis.com/v1/projects/verma-marriage-hall/databases/(default)/documents/`
* **API Key:** `AIzaSyBBbUJ6DA0tRDALZC4Oqx_GX7F2R1K6qgc`

### डेटा पृथक्करण (Dual-Environment Collections):
| वातावरण | बुकिंग्स कलेक्शन | अलर्ट्स कलेक्शन | सेटिंग्स/ऑपरेटर | OTA डॉक्युमेंट | FCM टॉपिक्स |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **प्रोडक्शन (v2.1.2)** | `vmh_bookings` | `vmh_alerts` | `vmh_settings/operators` | `vmh_system/ota_release` | `all_devices`, `vmh_bookings` |
| **बीटा (v2.5.2-beta)** | `beta_vmh_bookings` | `beta_vmh_alerts` | `beta_vmh_settings/operators` | `vmh_system/ota_beta` | `beta_all_devices`, `beta_vmh_bookings` |

---

## 🚀 3. क्लाउड OTA डिप्लॉयमेंट प्रक्रिया (Deploying In-App Updates)

यदि आप `app/src/main/assets/index.html` में कोई भी बदलाव करते हैं:
1. **सिंटैक्स सत्यापन:** सुनिश्चित करें कि सभी 16 `<script>` ब्लॉक्स में कोई सिंटैक्स एरर न हो।
2. **वर्ज़न हमेशा बढ़ाएं:** वर्ज़न नंबर (उदा. `2.5.2-beta` से `2.5.3-beta`) और `versionCode` बढ़ाएं।
3. **बीटा OTA पब्लिश (PowerShell / REST API):**
   - फ़ाइल `app/src/main/assets/index.html` की सम्पूर्ण सामग्री को फ़ायरबेस पर `vmh_system/ota_beta` में `betaBundle` फ़ील्ड में पैच करें।
   - साथ ही `vmh_system/ota_release` के केवल मेटाडेटा (`betaVersion`) को अपडेट करें।
   - **अत्यंत महत्वपूर्ण:** `vmh_system/ota_release` के `productionBundle` (555 KB) को कभी भी बिना यूज़र की स्पष्ट लिखित अनुमति के ओवरराइट न करें! प्रोडक्शन हमेशा लॉक और सुरक्षित रहना चाहिए।

---

## 🔑 4. डिफ़ॉल्ट ऑपरेटर क्रेडेंशियल्स (Operator Login Credentials)

| ऑपरेटर नाम | भूमिका | डिफ़ॉल्ट पासवर्ड |
| :--- | :--- | :--- |
| **वर्मा मैरिज हॉल** | मालिक (Owner/Admin) | `1234` |
| **सुशील कुमार** | वरिष्ठ ऑपरेटर (Manager) | `1234` |
| **अमित वर्मा** | सहायक ऑपरेटर (Staff) | `1234` |

---

## 📂 5. प्रमुख दस्तावेज़ व संदर्भ (Master Documentation Links)

1. [PROJECT_MASTER_TRACKER.md](file:///PROJECT_MASTER_TRACKER.md) — संपूर्ण प्रोजेक्ट का लिविंग सोर्स ऑफ़ ट्रुथ, सभी 28 फीचर्स की स्थिति, डिसीजन लॉग एवं नियम।
2. [VALUE_ADDED_SERVICES_AND_DIESEL_PROPOSAL.md](file:///VALUE_ADDED_SERVICES_AND_DIESEL_PROPOSAL.md) — अतिरिक्त सेवाएँ (DJ, कॉफी, स्टेज, फ्रूट) और जनरेटर डीजल व्यवस्था का स्वीकृत प्रस्ताव।
3. [VERMA_COLD_DRINK_HALDIRAM_APP_SPECIFICATION.md](file:///VERMA_COLD_DRINK_HALDIRAM_APP_SPECIFICATION.md) — शाखा `fmcg-cold-drinks-and-haldirams` पर कोल्ड ड्रिंक एजेंसी एवं हल्दीराम्स होलसेल डिस्ट्रीब्यूटर ऐप की 14-बिंदु विस्तृत विनिर्देश।

---
*यह दस्तावेज़ नए सिस्टम पर बिना किसी पूर्व निर्भरता के निर्बाध कार्य जारी रखने हेतु तैयार किया गया है।*

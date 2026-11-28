# 🏛️ वर्मा मैरिज हॉल (VMH) — डिजिटल प्रबंधन एवं बुकिंग सिस्टम
*(Verma Marriage Hall — Digital ERP & Booking Management System)*

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Production](https://img.shields.io/badge/Production-v2.1.2-blue.svg)]()
[![Beta](https://img.shields.io/badge/Beta-v2.5.3--beta-amber.svg)]()

इस रिपॉजिटरी में **वर्मा मैरिज हॉल (VMH)** का संपूर्ण डिजिटल ERP, बुकिंग, बिलिंग, इन-ऐप क्लाउड OTA और नोटिफिकेशन सिस्टम शामिल है।

---

## 📌 त्वरित संदर्भ एवं केंद्रीय दस्तावेज़ (Single Source of Truth)

1. 📖 **[PROJECT_MASTER_TRACKER.md](./PROJECT_MASTER_TRACKER.md)** — संपूर्ण प्रोजेक्ट का लिविंग मास्टर ट्रैकर, सभी 34 फीचर्स की स्थिति, आर्किटेक्चरल डिसीजन लॉग एवं बाइनरी स्थिति।
2. 🚀 **[HANDOVER_AND_CONTEXT_GUIDE.md](./HANDOVER_AND_CONTEXT_GUIDE.md)** — दूसरे लैपटॉप पर काम शुरू करने हेतु संपूर्ण गाइड (क्लोन, बिल्ड, फायरबेस क्रेडेंशियल्स, टेस्टिंग एवं अगला रोडमैप)।
3. 📄 **[VALUE_ADDED_SERVICES_AND_DIESEL_PROPOSAL.md](./VALUE_ADDED_SERVICES_AND_DIESEL_PROPOSAL.md)** — अतिरिक्त सेवाओं (DJ, कॉफी, स्टेज, फ्रूट) और जनरेटर डीजल व्यवस्था का स्वीकृत प्रस्ताव।

---

## 🌿 गिट शाखाएँ (Git Branches Overview)

* **`verma-marriage-hall-v1.4` (वर्तमान मुख्य शाखा):**
  - मैरिज हॉल ऐप का पूर्ण सोर्स कोड, Android WebView नेटिव ब्रिज, क्लाउड सिंक इंजन, और स्वचालित टेस्ट स्क्रिप्ट्स।
  - **बीटा ऐप:** `v2.5.3-beta` (versionCode 30, Package: `com.karya.business.beta`)
  - **प्रोडक्शन ऐप:** `v2.1.2` (versionCode 30, Package: `com.karya.business` — 100% लॉक एवं सुरक्षित)

* **`fmcg-cold-drinks-and-haldirams` (कोका-कोला व हल्दीराम्स डिस्ट्रीब्यूशन):**
  - वर्मा राइस मिल हेतु कोल्ड ड्रिंक एजेंसी एवं हल्दीराम्स होलसेल डिस्ट्रीब्यूटर ऐप का 14-पॉइंट विस्तृत PRD (`VERMA_COLD_DRINK_HALDIRAM_APP_SPECIFICATION.md`)।
  - 6-स्क्रीन इंटरएक्टिव वेब प्रोटोटाइप (`verma_rice_mill_fmcg_screens_preview.html`) एवं हैंडओवर गाइड (`FMCG_HANDOVER_AND_KICKOFF.md`)।

---

## 🛠️ नए सिस्टम पर त्वरित कमांड्स (Quick Commands)

### 1. क्लोन करना:
```bash
git clone -b verma-marriage-hall-v1.4 https://github.com/amitkrak83/DOMS.git
cd DOMS
```

### 2. टेस्ट चलाना:
```bash
node scripts/validate_scripts.js
node scripts/test_billing_crud.js
```

### 3. APK बिल्ड करना:
```bash
# बीटा ऐप (VMH Beta):
gradle assembleDebug

# प्रोडक्शन ऐप (वर्मा मैरिज हॉल):
gradle assembleRelease
```

### 4. बीटा OTA क्लाउड डिप्लॉय करना:
```bash
node scripts/deploy_beta_ota.js
```

---
*अधिक जानकारी और सम्पूर्ण विवरण हेतु कृपया [HANDOVER_AND_CONTEXT_GUIDE.md](./HANDOVER_AND_CONTEXT_GUIDE.md) देखें।*

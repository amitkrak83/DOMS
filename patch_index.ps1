$indexPath = "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\karya-apk-project\app\src\main\assets\index.html"
$content = Get-Content -Path $indexPath -Raw -Encoding utf8

# 1. Operators Isolation: Replace vmh_settings for operators with getCollName('vmh_settings')
# and vmh_operators in localStorage with getCollName('vmh_operators')

$content = $content.Replace(
    "const stored = localStorage.getItem('vmh_operators');",
    "const stored = localStorage.getItem(getCollName('vmh_operators'));"
)
$content = $content.Replace(
    "localStorage.setItem('vmh_operators',",
    "localStorage.setItem(getCollName('vmh_operators'),"
)

# fetchOperatorsFromCloud
$content = $content.Replace(
    "const doc = await firestoreDb.collection('vmh_settings').doc('operators').get();",
    "const doc = await firestoreDb.collection(getCollName('vmh_settings')).doc('operators').get();"
)
$content = $content.Replace(
    "const url = `${FIRESTORE_BASE_URL}/vmh_settings/operators?key=${FIREBASE_API_KEY}`;",
    "const url = `${FIRESTORE_BASE_URL}/${getCollName('vmh_settings')}/operators?key=${FIREBASE_API_KEY}`;"
)

# Realtime listener on operators
$content = $content.Replace(
    "firestoreDb.collection('vmh_settings').doc('operators').onSnapshot((doc) => {",
    "firestoreDb.collection(getCollName('vmh_settings')).doc('operators').onSnapshot((doc) => {"
)

# syncOperatorsToCloud
$content = $content.Replace(
    "await firestoreDb.collection('vmh_settings').doc('operators').set({",
    "await firestoreDb.collection(getCollName('vmh_settings')).doc('operators').set({"
)

# 2. UPI Dynamic QR Code & Amount Reflection
$oldUpiWidget = @'
      const qrDivId = containerId + '_liveQr';
      container.innerHTML = `
        <div class="space-y-2.5 text-center">
          <!-- UPI ID ROW WITH 1-CLICK COPY BUTTON -->
          <div class="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
            <div class="text-left min-w-0 pr-2">
              <span class="text-[9.5px] font-bold text-slate-500 block leading-tight">मालिक का UPI ID:</span>
              <span class="font-mono font-black text-xs text-emerald-950 select-all truncate block">${escapeHtml(upiId)}</span>
            </div>
            <button type="button" onclick="copyUpiIdToClipboard('${escapeHtml(upiId)}')" class="text-[11px] font-black bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg btn-tactile flex items-center gap-1 shrink-0">
              <span>📋</span> <span>कॉपी</span>
            </button>
          </div>

          <!-- DYNAMIC QR CODE CONTAINER -->
          <div class="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
            <div id="${qrDivId}" class="p-1 bg-white inline-block rounded-lg"></div>
            <p class="text-[11.5px] font-black text-emerald-900 mt-2 flex items-center justify-center gap-1">
              <span>📲</span> <span>स्कैन कर ${amtNum > 0 ? '₹' + amtNum.toLocaleString('en-IN') : 'रकम'} भेजें</span>
            </p>
            <p class="text-[9.5px] text-slate-500 mt-0.5">${escapeHtml(hallConfig.merchantName || hallConfig.name)} • PhonePe • GPay • Paytm मान्य</p>
          </div>
        </div>
      `;

      const targetDiv = document.getElementById(qrDivId);
      if (!targetDiv) return;

      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hallConfig.merchantName || hallConfig.name)}&am=${amtNum > 0 ? amtNum : ''}&cu=INR&tn=${encodeURIComponent((notePrefix || 'VMH') + ' ' + name)}`;
'@

$newUpiWidget = @'
      const qrDivId = containerId + '_liveQr';
      const amtParam = amtNum > 0 ? amtNum.toFixed(2) : '';
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hallConfig.merchantName || hallConfig.name)}${amtParam ? '&am=' + amtParam : ''}&cu=INR&tn=${encodeURIComponent((notePrefix || 'VMH') + ' ' + name)}`;

      container.innerHTML = `
        <div class="space-y-2.5 text-center">
          <!-- UPI ID ROW WITH 1-CLICK COPY BUTTON -->
          <div class="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
            <div class="text-left min-w-0 pr-2">
              <span class="text-[9.5px] font-bold text-slate-500 block leading-tight">मालिक का UPI ID:</span>
              <span class="font-mono font-black text-xs text-emerald-950 select-all truncate block">${escapeHtml(upiId)}</span>
            </div>
            <button type="button" onclick="copyUpiIdToClipboard('${escapeHtml(upiId)}')" class="text-[11px] font-black bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg btn-tactile flex items-center gap-1 shrink-0">
              <span>📋</span> <span>कॉपी</span>
            </button>
          </div>

          <!-- DYNAMIC QR CODE CONTAINER -->
          <div class="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
            ${amtNum > 0 
              ? `<div class="mb-2"><span class="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs font-mono inline-block">भुगतान राशि: ₹${amtNum.toLocaleString('en-IN')}</span></div>`
              : `<div class="mb-2"><span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block">रकम खाली (ग्राहक अपने UPI ऐप में भरेगा)</span></div>`
            }
            <div id="${qrDivId}" class="p-1.5 bg-white inline-block rounded-xl border border-slate-200 shadow-2xs"></div>
            <p class="text-[12px] font-black text-emerald-900 mt-2 flex items-center justify-center gap-1">
              <span>📲</span> <span>स्कैन कर ${amtNum > 0 ? '₹' + amtNum.toLocaleString('en-IN') : 'रकम'} भेजें</span>
            </p>
            <p class="text-[9.5px] text-slate-500 mt-0.5">${escapeHtml(hallConfig.merchantName || hallConfig.name)} • PhonePe • GPay • Paytm मान्य</p>
          </div>
        </div>
      `;

      const targetDiv = document.getElementById(qrDivId);
      if (!targetDiv) return;
'@

$content = $content.Replace($oldUpiWidget, $newUpiWidget)

# Update renderLiveUpiQr to consider Advance OR Total Rent
$oldRenderLive = @'
    function renderLiveUpiQr() {
      const advAmt = parseFloat(document.getElementById('inputAdvancePaid').value) || 0;
      const custName = document.getElementById('hallCustName').value.trim() || "Customer";
      const badgeAmt = document.getElementById('upiBadgeAmount');
      if (badgeAmt) badgeAmt.innerText = "₹ " + advAmt.toLocaleString('en-IN');
      renderUnifiedUpiWidget('upiQrContent', advAmt, custName, 'VMH Advance');
    }
'@

$newRenderLive = @'
    function renderLiveUpiQr() {
      const advAmt = parseFloat(document.getElementById('inputAdvancePaid')?.value) || 0;
      const totalRent = parseFloat(document.getElementById('inputTotalRent')?.value) || 0;
      const targetAmt = advAmt > 0 ? advAmt : (totalRent > 0 ? totalRent : 0);
      const custName = document.getElementById('hallCustName')?.value.trim() || "Customer";
      const badgeAmt = document.getElementById('upiBadgeAmount');
      if (badgeAmt) badgeAmt.innerText = "₹ " + targetAmt.toLocaleString('en-IN');
      renderUnifiedUpiWidget('upiQrContent', targetAmt, custName, advAmt > 0 ? 'VMH Advance' : 'VMH Booking');
    }
'@

$content = $content.Replace($oldRenderLive, $newRenderLive)

# Update calcHallBalance to refresh live QR when total rent is typed
$oldCalcBalance = "el.className = ""text-sm font-black text-red-600"";`n        }`n      }`n      snapshotBookingForm();"
$newCalcBalance = "el.className = ""text-sm font-black text-red-600"";`n        }`n      }`n      if (currentAdvMode === 'upi') {`n        renderLiveUpiQr();`n      }`n      snapshotBookingForm();"
$content = $content.Replace($oldCalcBalance, $newCalcBalance)

# 3. Add App Version Banner in adminHubView
$hubHeaderAnchor = @"
          <!-- Hub Sticky Header -->
          <div class="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            <button type="button" onclick="navigateBack()" class="text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg btn-tactile flex items-center gap-1 shadow-2xs shrink-0">
              <span id="btnBackAdmin">← वापस</span>
            </button>
            <div class="text-center flex-1 px-1">
              <span id="adminTitleBadge" class="text-sm font-black text-amber-900 block leading-tight">👑 मालिक एडमिन हब</span>
              <span id="adminSubtitleBadge" class="text-[10px] font-bold text-slate-500">वर्मा मैरिज हॉल डिजिटल नियंत्रण केंद्र</span>
            </div>
            <div class="w-12"></div>
          </div>
"@

$hubHeaderWithVersionCard = @"
          <!-- Hub Sticky Header -->
          <div class="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
            <button type="button" onclick="navigateBack()" class="text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg btn-tactile flex items-center gap-1 shadow-2xs shrink-0">
              <span id="btnBackAdmin">← वापस</span>
            </button>
            <div class="text-center flex-1 px-1">
              <span id="adminTitleBadge" class="text-sm font-black text-amber-900 block leading-tight">👑 मालिक एडमिन हब</span>
              <span id="adminSubtitleBadge" class="text-[10px] font-bold text-slate-500">वर्मा मैरिज हॉल डिजिटल नियंत्रण केंद्र</span>
            </div>
            <div class="w-12"></div>
          </div>

          <!-- PERMANENT APP VERSION & SYSTEM INFO BANNER (VISIBLE TO ALL: OWNER & OPERATORS) -->
          <div class="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-xs flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-base shrink-0">
                🏛️
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-black text-amber-300">वर्मा मैरिज हॉल</span>
                  <span id="settingsChannelBadge" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                    प्रोडक्शन
                  </span>
                </div>
                <p class="text-[9.5px] text-slate-300 leading-tight">डिजिटल बिलिंग, रसीद कट्टा एवं विवाह बुकिंग प्रबंधन</p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">ऐप वर्जन</span>
              <span id="settingsHubVersionText" class="text-sm font-black text-amber-400 font-mono">v2.4.0</span>
            </div>
          </div>
"@

$content = $content.Replace($hubHeaderAnchor, $hubHeaderWithVersionCard)

# Update updateAuthUI to set settingsHubVersionText and settingsChannelBadge
$oldAuthUiVer = @"
      if (verBadge) {
        verBadge.innerText = 'v' + curVer;
      }
"@

$newAuthUiVer = @"
      if (verBadge) {
        verBadge.innerText = 'v' + curVer;
      }
      const hubVer = document.getElementById('settingsHubVersionText');
      if (hubVer) hubVer.innerText = 'v' + curVer;
      const chBadge = document.getElementById('settingsChannelBadge');
      if (chBadge) {
        chBadge.innerText = IS_BETA_APP ? 'बीटा टेस्टिंग' : 'प्रोडक्शन';
        chBadge.className = `text-[9px] font-black px-2 py-0.5 rounded-full ${IS_BETA_APP ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'} shadow-2xs`;
      }
"@

$content = $content.Replace($oldAuthUiVer, $newAuthUiVer)

# 4. Microphone Automatic Resume upon Permission Grant
$oldStartVoice = @"
    function startVoiceInput(targetInputId) {
      // 1. Android Native Runtime Permission check
      if (window.AndroidApp && typeof window.AndroidApp.hasAudioPermission === 'function') {
        if (!window.AndroidApp.hasAudioPermission()) {
          if (typeof window.AndroidApp.requestAudioPermission === 'function') {
            window.AndroidApp.requestAudioPermission();
          }
          showToast("🎙️ कृपया स्क्रीन पर आने वाली माइक अनुमति (Allow) पर क्लिक करें।");
          return;
        }
      }
"@

$newStartVoice = @"
    let pendingVoiceTargetId = null;

    window.onNativeAudioPermissionGranted = function() {
      showToast("✅ माइक अनुमति मिल गई!");
      if (pendingVoiceTargetId) {
        const tid = pendingVoiceTargetId;
        pendingVoiceTargetId = null;
        setTimeout(() => startVoiceInput(tid), 250);
      }
    };

    async function startVoiceInput(targetInputId) {
      pendingVoiceTargetId = targetInputId;

      // 1. Android Native Runtime Permission check
      if (window.AndroidApp && typeof window.AndroidApp.hasAudioPermission === 'function') {
        if (!window.AndroidApp.hasAudioPermission()) {
          if (typeof window.AndroidApp.requestAudioPermission === 'function') {
            window.AndroidApp.requestAudioPermission();
          }
          showToast("🎙️ कृपया स्क्रीन पर आने वाली माइक अनुमति (Allow) पर क्लिक करें।");
          return;
        }
      } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
        } catch (e) {
          console.warn("getUserMedia prompt note:", e);
        }
      }
"@

$content = $content.Replace($oldStartVoice, $newStartVoice)

[System.IO.File]::WriteAllText($indexPath, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated index.html with all fixes!"

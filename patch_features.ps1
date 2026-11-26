$indexPath = "C:\Users\Sushil Kumar\.gemini\antigravity\scratch\karya-apk-project\app\src\main\assets\index.html"
$content = Get-Content -Path $indexPath -Raw -Encoding utf8

# 1. Phone number optional in HTML label
$oldPhoneLabel = '<label id="labelCustPhone" class="text-xs font-black text-slate-800 block mb-1">`n              मोबाइल नंबर (Contact Mobile) *`n            </label>'
$newPhoneLabel = '<label id="labelCustPhone" class="text-xs font-bold text-slate-700 block mb-1">`n              मोबाइल नंबर (Contact Mobile - वैकल्पिक)`n            </label>'
$content = $content.Replace($oldPhoneLabel, $newPhoneLabel)

# 2. Phone number optional in saveCurrentBooking validation
$oldPhoneVal = @"
      if (!phone) {
        showToast("⚠️ कृपया संपर्क मोबाइल नंबर दर्ज करें!");
        document.getElementById('hallCustPhone').focus();
        return;
      }
      if (phone.length !== 10) {
        showToast("⚠️ कृपया पूरा 10 अंकों का मोबाइल नंबर दर्ज करें!");
        document.getElementById('hallCustPhone').focus();
        return;
      }
"@

$newPhoneVal = @"
      if (phone && phone.length > 0 && phone.length !== 10) {
        showToast("⚠️ यदि मोबाइल नंबर डाल रहे हैं, तो पूरा 10 अंकों का नंबर दर्ज करें!");
        document.getElementById('hallCustPhone').focus();
        return;
      }
"@

$content = $content.Replace($oldPhoneVal, $newPhoneVal)

# 3. Add Booking Date input in New Booking Form
$oldEventDateSection = @"
        <!-- SECTION B: EVENT DATE & EXACT 2 TIME SLOTS (IN-APP CUSTOM SELECTORS) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-xs">
          <div class="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <span class="text-sm">📅</span>
            <h3 id="formSectionEventTitle" class="text-sm font-black text-slate-900">कार्यक्रम दिनांक एवं समय स्लॉट</h3>
          </div>

          <!-- IN-APP THEMED DATE PICKER BUTTON (NO NATIVE BLACK CALENDAR) -->
          <div>
            <label id="labelEventDate" class="text-xs font-bold text-slate-700 block mb-1">
              आयोजन दिनांक (Event Date) *
            </label>
"@

$newEventDateSection = @"
        <!-- SECTION B: EVENT DATE & EXACT 2 TIME SLOTS (IN-APP CUSTOM SELECTORS) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-xs">
          <div class="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
            <span class="text-sm">📅</span>
            <h3 id="formSectionEventTitle" class="text-sm font-black text-slate-900">कार्यक्रम दिनांक एवं समय स्लॉट</h3>
          </div>

          <!-- EDITABLE BOOKING DATE -->
          <div>
            <label id="labelBookingDate" class="text-xs font-bold text-slate-700 block mb-1">
              रसीद / बुकिंग दिनांक (Booking Date)
            </label>
            <input type="date" id="hallBookingDate" class="w-full text-xs sm:text-sm font-bold p-3 bg-white border-2 border-slate-300 rounded-xl outline-none focus:border-amber-600 focus:bg-white text-slate-950">
            <span class="text-[9.5px] text-slate-500 mt-0.5 block">डिफ़ॉल्ट आज की तारीख; पुरानी बुकिंग दर्ज करने पर तारीख बदल सकते हैं।</span>
          </div>

          <!-- IN-APP THEMED DATE PICKER BUTTON (NO NATIVE BLACK CALENDAR) -->
          <div>
            <label id="labelEventDate" class="text-xs font-bold text-slate-700 block mb-1">
              आयोजन दिनांक (Event Date) *
            </label>
"@

$content = $content.Replace($oldEventDateSection, $newEventDateSection)

# 4. In editLoadedBooking, set hallBookingDate
$oldEditLoaded = "document.getElementById('hallCustAddress').value = b.partyAddress || '';"
$newEditLoaded = @"
      document.getElementById('hallCustAddress').value = b.partyAddress || '';
      if (b.bookingDate) {
        document.getElementById('hallBookingDate').value = b.bookingDate;
      } else if (b.bookingDateStr) {
        const parts = b.bookingDateStr.split('/');
        if (parts.length === 3) {
          document.getElementById('hallBookingDate').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
"@
$content = $content.Replace($oldEditLoaded, $newEditLoaded)

# 5. In resetNewBookingForm, default hallBookingDate to today
$oldResetForm = "document.getElementById('hallCustName').value = '';"
$newResetForm = @"
      document.getElementById('hallCustName').value = '';
      const todayIsoInit = new Date().toISOString().split('T')[0];
      const bkDateInp = document.getElementById('hallBookingDate');
      if (bkDateInp) bkDateInp.value = todayIsoInit;
"@
$content = $content.Replace($oldResetForm, $newResetForm)

# 6. In saveCurrentBooking, save edited bookingDate
$oldSaveBookingDate = @"
      const today = new Date();
      const bookingDateStr = `${today.getDate() < 10 ? '0' + today.getDate() : today.getDate()}/${(today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1)}/${today.getFullYear()}`;
"@

$newSaveBookingDate = @"
      const rawBookingDate = document.getElementById('hallBookingDate')?.value;
      let bookingDateStr = '';
      let bookingDateIso = '';
      if (rawBookingDate) {
        bookingDateIso = rawBookingDate;
        const bParts = rawBookingDate.split('-');
        if (bParts.length === 3) {
          bookingDateStr = `${bParts[2]}/${bParts[1]}/${bParts[0]}`;
        }
      }
      if (!bookingDateStr) {
        const today = new Date();
        bookingDateStr = `${today.getDate() < 10 ? '0' + today.getDate() : today.getDate()}/${(today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1)}/${today.getFullYear()}`;
        bookingDateIso = today.toISOString().split('T')[0];
      }
"@
$content = $content.Replace($oldSaveBookingDate, $newSaveBookingDate)

# Also ensure bookingDate is saved in bookingRecord
$oldRecordPayload = "bookingDateStr: bookingDateStr,"
$newRecordPayload = "bookingDateStr: bookingDateStr,`n        bookingDate: bookingDateIso,"
$content = $content.Replace($oldRecordPayload, $newRecordPayload)

# 7. Add Payment Date in receivePaymentModal
$oldPayModalAmount = @"
        <!-- Input for Payment Amount -->
        <div>
          <label class="text-xs font-black text-slate-800 block mb-1">प्राप्त रकम (Amount Received ₹) *</label>
          <input type="number" id="payModalAmount" oninput="validatePayModalAmount()" placeholder="उदा. 20000" class="w-full text-base font-black p-3 bg-white border-2 border-slate-300 text-slate-950 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-emerald-800">
          <p id="payModalError" class="hidden text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
            <span>⚠️</span> <span id="payModalErrorText">राशि बकाया से अधिक नहीं हो सकती!</span>
          </p>
"@

$newPayModalAmount = @"
        <!-- Input for Payment Amount -->
        <div>
          <label class="text-xs font-black text-slate-800 block mb-1">प्राप्त रकम (Amount Received ₹) *</label>
          <input type="number" id="payModalAmount" oninput="validatePayModalAmount()" placeholder="उदा. 20000" class="w-full text-base font-black p-3 bg-white border-2 border-slate-300 text-slate-950 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-emerald-800">
          <p id="payModalError" class="hidden text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
            <span>⚠️</span> <span id="payModalErrorText">राशि बकाया से अधिक नहीं हो सकती!</span>
          </p>
        </div>

        <!-- Input for Payment Date (Editable) -->
        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">
            भुगतान प्राप्त दिनांक (Payment Date)
          </label>
          <input type="date" id="payModalDate" class="w-full text-xs font-bold p-2.5 bg-white border-2 border-slate-300 rounded-xl outline-none focus:border-emerald-600 focus:bg-white text-slate-900">
          <span class="text-[9.5px] text-slate-500 mt-0.5 block">डिफ़ॉल्ट आज की तारीख; यदि पहले भुगतान मिला था तो तारीख बदल सकते हैं।</span>
        </div>
"@
$content = $content.Replace($oldPayModalAmount, $newPayModalAmount)

# 8. In openReceivePaymentModal, set payModalDate to today
$oldOpenPayModal = "document.getElementById('receivePaymentModal')?.classList.remove('hidden');"
$newOpenPayModal = @"
      const todayPayIso = new Date().toISOString().split('T')[0];
      const payDtInp = document.getElementById('payModalDate');
      if (payDtInp) payDtInp.value = todayPayIso;
      document.getElementById('receivePaymentModal')?.classList.remove('hidden');
"@
$content = $content.Replace($oldOpenPayModal, $newOpenPayModal)

# 9. In submitReceivedPayment, use payModalDate
$oldSubmitPayDate = @"
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = `${now.getDate() < 10 ? '0' + now.getDate() : now.getDate()}/${(now.getMonth() + 1) < 10 ? '0' + (now.getMonth() + 1) : (now.getMonth() + 1)}/${now.getFullYear()}`;
"@

$newSubmitPayDate = @"
      const customPayDate = document.getElementById('payModalDate')?.value;
      let dateStr = '';
      if (customPayDate) {
        const parts = customPayDate.split('-');
        if (parts.length === 3) {
          dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      if (!dateStr) {
        dateStr = `${now.getDate() < 10 ? '0' + now.getDate() : now.getDate()}/${(now.getMonth() + 1) < 10 ? '0' + (now.getMonth() + 1) : (now.getMonth() + 1)}/${now.getFullYear()}`;
      }
"@
$content = $content.Replace($oldSubmitPayDate, $newSubmitPayDate)

# 10. Add edit payment date helper function
$helperJs = @"

    async function promptEditPaymentDate(paymentId, curDate) {
      const newDate = prompt("नया भुगतान दिनांक दर्ज करें (DD/MM/YYYY):", curDate || "");
      if (!newDate || !newDate.trim() || newDate.trim() === curDate) return;
      const b = realMarriageBookings.find(x => x.id === currentPayBookingId);
      if (!b || !b.payments) return;
      const targetPay = b.payments.find((p, idx) => p.id === paymentId || String(idx) === String(paymentId));
      if (targetPay) {
        targetPay.date = newDate.trim();
        await syncBookingToCloud(b);
        showToast("✅ भुगतान दिनांक अपडेट किया गया!");
        openReceivePaymentModal(currentPayBookingId);
      }
    }
"@
$content = $content.Replace("function closeReceivePaymentModal() {", "$helperJs`n    function closeReceivePaymentModal() {")

# Also add edit button in past payments list
$oldPastListRow = @'
            <span class="font-black text-emerald-800 font-mono text-xs">+ ₹${(parseFloat(p.amount) || 0).toLocaleString('en-IN')}</span>
          </div>
'@
$newPastListRow = @'
            <div class="flex items-center gap-1.5">
              <span class="font-black text-emerald-800 font-mono text-xs">+ ₹${(parseFloat(p.amount) || 0).toLocaleString('en-IN')}</span>
              <button type="button" onclick="promptEditPaymentDate('${p.id || idx}', '${escapeHtml(p.date || '')}')" title="दिनांक बदलें" class="text-[10px] text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 btn-tactile">✏️</button>
            </div>
          </div>
'@
$content = $content.Replace($oldPastListRow, $newPastListRow)

[System.IO.File]::WriteAllText($indexPath, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated phone optional, booking date edit, and payment date edit!"

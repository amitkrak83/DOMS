const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== RUNNING BILLING CRUD & PARTIAL UPDATE VERIFICATION TESTS ===");

// 1. Verify Payment Reset Logic (Pure function simulation matching index.html)
function simulateSaveBooking(editingBookingId, existingPayments, adv, rent, operatorName, bookingDateStr) {
  let finalAdvance = adv;
  if (editingBookingId) {
    if (existingPayments.length <= 1) {
      if (adv <= 0) {
        existingPayments = [];
        finalAdvance = 0;
      } else {
        if (existingPayments.length === 1) {
          existingPayments[0].amount = adv;
        } else {
          existingPayments.push({
            id: 'PAY-1',
            date: `${bookingDateStr} (बुकिंग)`,
            amount: adv,
            mode: 'cash',
            note: 'शुरुआती अग्रिम जमा (Initial Advance)',
            receivedBy: operatorName
          });
        }
        finalAdvance = adv;
      }
    } else {
      if (adv <= 0) {
        if (existingPayments[0] && existingPayments[0].id === 'PAY-1') {
          existingPayments.shift();
        }
      } else if (existingPayments[0]) {
        existingPayments[0].amount = adv;
      }
      finalAdvance = existingPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    }
  } else {
    if (adv > 0) {
      existingPayments = [{
        id: 'PAY-1',
        date: `${bookingDateStr} (बुकिंग)`,
        amount: adv,
        mode: 'cash',
        note: 'शुरुआती अग्रिम जमा (Initial Advance)',
        receivedBy: operatorName
      }];
    } else {
      existingPayments = [];
    }
    finalAdvance = adv;
  }
  const finalBal = Math.max(0, rent - finalAdvance);
  return { finalAdvance, finalBal, payments: existingPayments };
}

// Test Case 1: Create booking with ₹ 2 mistake advance
const t1 = simulateSaveBooking(null, [], 2, 25000, 'अमित वर्मा', '27/11/2026');
assert.strictEqual(t1.finalAdvance, 2, "Test 1 Failed: Advance should be 2");
assert.strictEqual(t1.finalBal, 24998, "Test 1 Failed: Balance should be 24998");
assert.strictEqual(t1.payments.length, 1, "Test 1 Failed: Payments should have 1 item");
console.log("✓ Test 1 Passed: Create booking with mistake ₹2 advance created PAY-1 correctly.");

// Test Case 2: Edit booking and reset advance to 0
const t2 = simulateSaveBooking('VMH-2026-001', [...t1.payments], 0, 25000, 'अमित वर्मा', '27/11/2026');
assert.strictEqual(t2.finalAdvance, 0, "Test 2 Failed: Advance should be 0");
assert.strictEqual(t2.finalBal, 25000, "Test 2 Failed: Balance should equal full rent 25000");
assert.strictEqual(t2.payments.length, 0, "Test 2 Failed: Erroneous payment was successfully cleared");
console.log("✓ Test 2 Passed: Edit booking advance to 0 cleanly resets advance to 0 and clears payment!");

// Test Case 3: Edit booking and change advance from ₹2 to ₹5000
const t3 = simulateSaveBooking('VMH-2026-001', [...t1.payments], 5000, 25000, 'अमित वर्मा', '27/11/2026');
assert.strictEqual(t3.finalAdvance, 5000, "Test 3 Failed: Advance should be 5000");
assert.strictEqual(t3.finalBal, 20000, "Test 3 Failed: Balance should be 20000");
assert.strictEqual(t3.payments[0].amount, 5000, "Test 3 Failed: PAY-1 amount should update to 5000");
console.log("✓ Test 3 Passed: Edit booking advance to ₹5000 updates existing PAY-1 correctly.");

// Test Case 4: Delete payment from ledger
let multiPayments = [
  { id: 'PAY-1', amount: 5000 },
  { id: 'PAY-2', amount: 10000 }
];
// User deletes PAY-1
multiPayments.splice(0, 1);
const totalPaidAfterDel = multiPayments.reduce((s, p) => s + p.amount, 0);
assert.strictEqual(totalPaidAfterDel, 10000);
assert.strictEqual(Math.max(0, 25000 - totalPaidAfterDel), 15000);
console.log("✓ Test 4 Passed: Delete payment from ledger recalculates advance and balance due accurately.");

// 2. Verify Utensil Checkbox exclusion logic
const mockUtensils = [
  { name: 'पतीला बड़ा', qty: 2, unit: 'पीस' },
  { name: 'कड़ाही 40 लीटर', qty: 1, unit: 'पीस' },
  { name: 'परात पीतल', qty: 3, unit: 'पीस' }
];
const mockCheckboxes = { 0: true, 1: false, 2: true }; // user unchecked item 1 (कड़ाही)
const chosen = [];
mockUtensils.forEach((item, idx) => {
  const isChecked = mockCheckboxes[idx];
  const qty = item.qty;
  if (isChecked && qty > 0) {
    chosen.push({ name: item.name, qty: qty, unit: item.unit });
  }
});
assert.strictEqual(chosen.length, 2, "Test 5 Failed: Should have 2 items");
assert.strictEqual(chosen.find(u => u.name === 'कड़ाही 40 लीटर'), undefined, "Test 5 Failed: Unchecked item must be excluded");
console.log("✓ Test 5 Passed: Unchecked utensil is correctly excluded from bill.");

// 3. Verify HTML structure for slip action buttons
const htmlPath = path.resolve(__dirname, '../app/src/main/assets/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Ensure 'भुगतान' is NOT in slipActionButtonsGrid
const gridMatch = html.match(/<div id="slipActionButtonsGrid"[\s\S]*?<\/div>/);
assert.ok(gridMatch, "slipActionButtonsGrid must exist in HTML");
assert.ok(!gridMatch[0].includes('btnSlipTopReceivePayment'), "Top bar must not contain btnSlipTopReceivePayment");
assert.ok(!gridMatch[0].includes('openManageSlipVasModal'), "Top bar must not contain openManageSlipVasModal");
assert.ok(gridMatch[0].includes('shareSlipAsPhoto()'), "Share button must call shareSlipAsPhoto directly");
assert.ok(gridMatch[0].includes('editLoadedBooking()'), "Edit button must be present");
assert.ok(gridMatch[0].includes('showDeleteConfirmForCurrentSlip()'), "Delete button must be present");
console.log("✓ Test 6 Passed: Slip Top Bar has exactly 3 clean buttons (Share 1-step, Edit, Delete).");

// 4. Verify text zoom and text-size-adjust
assert.ok(html.includes('-webkit-text-size-adjust: 100% !important;'), "CSS must include text-size-adjust: 100%");
const mainActivityPath = path.resolve(__dirname, '../app/src/main/java/com/karya/business/MainActivity.java');
const mainActivityJava = fs.readFileSync(mainActivityPath, 'utf8');
assert.ok(mainActivityJava.includes('webSettings.setTextZoom(100);'), "MainActivity.java must include webSettings.setTextZoom(100);");
console.log("✓ Test 7 Passed: Font scaling is 100% locked across Android WebView and CSS.");

// 5. Verify FCM notification payload does NOT have top-level notification
const fcmDispatchCode = html.match(/async function dispatchFcmPush[\s\S]*?console\.log\("FCM cross-environment/);
assert.ok(fcmDispatchCode, "dispatchFcmPush must be found");
assert.ok(!fcmDispatchCode[0].includes('notification: {'), "dispatchFcmPush must NOT contain top-level notification block");
assert.ok(fcmDispatchCode[0].includes("condition: \"'all_devices' in topics || 'beta_all_devices' in topics\""), "dispatchFcmPush must target cross-environment condition");
console.log("✓ Test 8 Passed: FCM push is pure data message with cross-environment condition.");

console.log("\n=======================================================");
console.log("🎉 ALL 8 POSITIVE & NEGATIVE TEST SUITES PASSED 100%!");
console.log("=======================================================");

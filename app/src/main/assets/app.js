const DEFAULT_SERVER = 'https://occur-competition-raleigh-wallace.trycloudflare.com';
let serverBase = localStorage.getItem('karya_server_url') || (window.location.origin.startsWith('http') ? window.location.origin : DEFAULT_SERVER);

function getServerUrl(path) {
  if (serverBase.endsWith('/')) {
    return serverBase.slice(0, -1) + path;
  }
  return serverBase + path;
}

window.changeServerUrl = function() {
  const current = serverBase;
  const newUrl = prompt('सर्वर का पता (Server URL):', current);
  if (newUrl && newUrl.trim()) {
    serverBase = newUrl.trim();
    localStorage.setItem('karya_server_url', serverBase);
    alert('सर्वर अपडेट हो गया! रीकनेक्ट हो रहा है...');
    location.reload();
  }
};

// Unique Device ID generator per phone
let myDeviceId = localStorage.getItem('karya_device_id');
if (!myDeviceId) {
  myDeviceId = 'phone_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('karya_device_id', myDeviceId);
}

// Current User Role: 'owner' | 'partner' | 'worker'
let myRole = localStorage.getItem('karya_role') || 'worker';
let activeFilter = 'all'; // 'all' | 'distribution' | 'marriage_hall'

// 1. Permanent Local Storage Persistence (Zero data loss even after app kill!)
let transactions = [];
try {
  transactions = JSON.parse(localStorage.getItem('karya_cached_transactions') || '[]');
} catch (e) {
  transactions = [];
}

let processedAlertIds = new Set();
let pollTimer = null;

// Audio Synthesizer (Cash Register Chime & Alert)
let audioCtx = null;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    if (type === 'cash') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.setValueAtTime(880.00, now + 0.1);
      osc2.frequency.setValueAtTime(1174.66, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } else {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {}
}

// Initialize on App Start
function init() {
  updateRoleUI();
  // Render cached transactions immediately!
  renderTransactions();
  updateStats();
  
  // Sync fresh from server
  fetchInitialData();
  startSyncPolling();
}

// Role Switcher
window.selectRole = function(role) {
  myRole = role;
  localStorage.setItem('karya_role', role);
  playSound('pop');
  updateRoleUI();
};

function updateRoleUI() {
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === myRole);
  });
  const roleNameMap = {
    owner: '👑 मालिक (Owner)',
    partner: '🤝 साझेदार (Partner)',
    worker: '👷‍♂️ कर्मचारी (Worker)'
  };
  const roleDisplay = document.getElementById('currentRoleDisplay');
  if (roleDisplay) roleDisplay.textContent = roleNameMap[myRole] || myRole;
}

// Fetch Initial Data from Server & Persist in LocalStorage
async function fetchInitialData() {
  try {
    const res = await fetch(getServerUrl('/api/data?t=' + Date.now()));
    const data = await res.json();
    if (data.success && data.transactions && data.transactions.length > 0) {
      transactions = data.transactions;
      localStorage.setItem('karya_cached_transactions', JSON.stringify(transactions));
      renderTransactions();
      updateStats();
    }
  } catch (err) {
    console.log('Server unreachable, using offline cached data');
  }
}

// Real-Time Polling Sync
function startSyncPolling() {
  if (pollTimer) clearInterval(pollTimer);

  async function poll() {
    try {
      const url = getServerUrl(`/api/poll?deviceId=${myDeviceId}&role=${myRole}&t=${Date.now()}`);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json();

      const connPill = document.getElementById('connectedCountText');
      if (connPill) {
        const count = data.connectedPhonesCount || 1;
        connPill.textContent = `${count} Phone Sync Active`;
      }

      if (data.alerts && Array.isArray(data.alerts)) {
        data.alerts.forEach(alert => {
          if (!processedAlertIds.has(alert.id)) {
            processedAlertIds.add(alert.id);
            handleIncomingAlert(alert);
          }
        });
      }
    } catch (e) {
      console.log('Poll error:', e);
    }
  }

  poll();
  pollTimer = setInterval(poll, 1500);
}

// Handle Incoming Alert from another phone
function handleIncomingAlert(alert) {
  // 1. Play Cash Register Chime
  playSound('cash');

  // 2. Vibrate Phone
  if (navigator.vibrate) {
    navigator.vibrate([0, 400, 200, 400]);
  }

  // 3. In-App Banner
  showSyncBanner(alert.title, alert.message);

  // 4. Native Android Status Bar & Lock Screen Notification via Java Bridge
  if (window.AndroidApp && window.AndroidApp.showNotification) {
    window.AndroidApp.showNotification(alert.title, alert.message);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(alert.title, {
          body: alert.message,
          icon: 'icon.svg',
          badge: 'icon.svg',
          vibrate: [0, 400, 200, 400],
          tag: 'karya-sync-' + alert.id,
          renotify: true
        });
      }).catch(e => console.log(e));
    }
  }

  // 5. Append to transaction list and save permanently in LocalStorage
  if (alert.transaction) {
    const exists = transactions.some(t => t.id === alert.transaction.id);
    if (!exists) {
      transactions.unshift(alert.transaction);
      localStorage.setItem('karya_cached_transactions', JSON.stringify(transactions));
      renderTransactions();
      updateStats();
    }
  }
}

// UI Rendering
function renderTransactions() {
  const container = document.getElementById('transactionList');
  if (!container) return;

  const filtered = transactions.filter(t => {
    if (activeFilter === 'all') return true;
    return t.type === activeFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">📋</div>
        <p>अभी तक कोई एंट्री नहीं है।</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(tx => {
    const isCoca = tx.type === 'distribution';
    const icon = isCoca ? '🥤' : '🏛️';
    const iconClass = isCoca ? 'distribution' : 'marriage_hall';
    const statusText = tx.paymentStatus === 'paid' ? 'नकद भुगतान (Paid)' : (tx.paymentStatus === 'credit' ? 'उधार (Credit)' : 'एडवांस जमा (Advance)');
    const statusClass = tx.paymentStatus === 'paid' ? 'status-paid' : (tx.paymentStatus === 'credit' ? 'status-credit' : 'status-advance');

    return `
      <div class="tx-card">
        <div class="tx-left">
          <div class="tx-icon ${iconClass}">${icon}</div>
          <div class="tx-details">
            <div class="tx-title">${escapeHtml(tx.title)}</div>
            <div class="tx-customer">👤 ${escapeHtml(tx.customer)}</div>
            <div class="tx-creator">दर्ज किया: ${escapeHtml(tx.createdBy)} • ${tx.timestamp}</div>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount">₹${Number(tx.amount).toLocaleString('en-IN')}</div>
          <span class="tx-status ${statusClass}">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateStats() {
  const cocaTotal = transactions
    .filter(t => t.type === 'distribution')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const hallTotal = transactions
    .filter(t => t.type === 'marriage_hall')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const cocaEl = document.getElementById('statCocaTotal');
  const hallEl = document.getElementById('statHallTotal');
  if (cocaEl) cocaEl.textContent = `₹${cocaTotal.toLocaleString('en-IN')}`;
  if (hallEl) hallEl.textContent = `₹${hallTotal.toLocaleString('en-IN')}`;
}

window.filterCategory = function(type, elem) {
  activeFilter = type;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  elem.classList.add('active');
  playSound('pop');
  renderTransactions();
};

// Modal & Form Submission
let currentFormType = 'distribution';

window.openNewModal = function() {
  playSound('pop');
  document.getElementById('entryModal').classList.add('open');
};

window.closeNewModal = function() {
  document.getElementById('entryModal').classList.remove('open');
};

window.setFormType = function(type) {
  currentFormType = type;
  document.getElementById('typeBtnCoca').className = `type-btn ${type === 'distribution' ? 'active coca' : ''}`;
  document.getElementById('typeBtnHall').className = `type-btn ${type === 'marriage_hall' ? 'active hall' : ''}`;

  document.getElementById('cocaFields').style.display = type === 'distribution' ? 'block' : 'none';
  document.getElementById('hallFields').style.display = type === 'marriage_hall' ? 'block' : 'none';
  playSound('pop');
};

window.handleNewEntry = async function(e) {
  e.preventDefault();

  const roleLabels = { owner: 'Owner (मालिक)', partner: 'Partner (साझेदार)', worker: 'Worker (कर्मचारी)' };
  const creatorLabel = roleLabels[myRole] || myRole;

  let title = '';
  let customer = '';
  let amount = 0;
  let advance = 0;
  let paymentStatus = 'paid';

  if (currentFormType === 'distribution') {
    const items = document.getElementById('cocaItemsInput').value.trim() || 'कोका-कोला 20 पेटी';
    customer = document.getElementById('cocaCustomerInput').value.trim() || 'नकद ग्राहक';
    amount = Number(document.getElementById('cocaAmountInput').value) || 0;
    paymentStatus = document.getElementById('cocaPaymentSelect').value;
    title = items;
  } else {
    const eventType = document.getElementById('hallEventSelect').value;
    customer = document.getElementById('hallCustomerInput').value.trim() || 'बुकिंग पार्टी';
    amount = Number(document.getElementById('hallTotalAmountInput').value) || 0;
    advance = Number(document.getElementById('hallAdvanceInput').value) || 0;
    paymentStatus = 'advance_paid';
    title = `मैरिज हॉल बुकिंग (${eventType})`;
  }

  if (amount <= 0) {
    alert('कृपया सही राशि (Amount) भरें!');
    return;
  }

  const payload = {
    type: currentFormType,
    title,
    customer,
    amount,
    advance,
    paymentStatus,
    createdBy: creatorLabel,
    role: myRole,
    deviceId: myDeviceId
  };

  try {
    const res = await fetch(getServerUrl('/api/transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      playSound('cash');
      transactions.unshift(result.transaction);
      // Persist in LocalStorage
      localStorage.setItem('karya_cached_transactions', JSON.stringify(transactions));
      renderTransactions();
      updateStats();
      closeNewModal();
      document.getElementById('cocaAmountInput').value = '';
      document.getElementById('hallTotalAmountInput').value = '';
    }
  } catch (err) {
    alert('Network error while saving!');
  }
};

function showSyncBanner(title, message) {
  const banner = document.getElementById('syncAlertBanner');
  if (!banner) return;
  document.getElementById('syncBannerTitle').textContent = title;
  document.getElementById('syncBannerMsg').textContent = message;
  banner.style.display = 'block';

  setTimeout(() => {
    banner.style.display = 'none';
  }, 6000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);

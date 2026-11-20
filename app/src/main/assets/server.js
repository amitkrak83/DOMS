const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = __dirname;
const DB_FILE = path.join(__dirname, 'business_data.json');

// Initialize Database if not exists
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    transactions: [
      {
        id: 'tx_init_1',
        type: 'distribution',
        title: 'कोका-कोला (Coca-Cola) 50 पेटी डिलीवरी',
        customer: 'गुप्ता किराना स्टोर (स्टेशन रोड)',
        amount: 15000,
        paymentStatus: 'paid', // 'paid' | 'credit'
        createdBy: 'Worker (राकेश)',
        role: 'worker',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().slice(0, 10)
      },
      {
        id: 'tx_init_2',
        type: 'marriage_hall',
        title: 'मैरिज हॉल बुकिंग (तिलक समारोह)',
        customer: 'वर्मा जी (सुल्तानपुर)',
        amount: 85000,
        advance: 25000,
        eventDate: '2026-12-05',
        paymentStatus: 'advance_paid',
        createdBy: 'Owner (मालिक)',
        role: 'owner',
        timestamp: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().slice(0, 10)
      }
    ],
    devices: {}
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

function getDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { transactions: [], devices: {} };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let activeClients = []; // SSE connections
let pendingAlerts = []; // Alert queue for polling
let activeDeviceHeartbeats = {}; // Track live 3 phones

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-Role, X-Device-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. GET /api/data - Fetch full shared data
  if (req.url === '/api/data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const db = getDB();
    res.end(JSON.stringify({
      success: true,
      transactions: db.transactions,
      activeDevices: Object.keys(activeDeviceHeartbeats).length,
      serverTime: new Date().toLocaleTimeString()
    }));
    return;
  }

  // 2. GET /api/poll - Heartbeat & Instant Alert Delivery for 3 phones
  if (req.url.startsWith('/api/poll') && req.method === 'GET') {
    const urlParams = new URL(req.url, `http://localhost:${PORT}`);
    const deviceRole = urlParams.searchParams.get('role') || 'unknown';
    const deviceId = urlParams.searchParams.get('deviceId') || 'dev_1';

    // Update heartbeat
    activeDeviceHeartbeats[deviceId] = { role: deviceRole, lastSeen: Date.now() };

    // Clean stale devices (older than 10 seconds)
    const now = Date.now();
    for (const [id, info] of Object.entries(activeDeviceHeartbeats)) {
      if (now - info.lastSeen > 10000) delete activeDeviceHeartbeats[id];
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    // Send alerts created in last 45 seconds that were NOT created by this same device
    const freshAlerts = pendingAlerts.filter(a => (now - a.created < 45000) && a.senderDeviceId !== deviceId);

    res.end(JSON.stringify({
      success: true,
      alerts: freshAlerts,
      connectedPhonesCount: Object.keys(activeDeviceHeartbeats).length,
      serverTime: new Date().toLocaleTimeString()
    }));
    return;
  }

  // 3. POST /api/transactions - Add new Bill or Hall Booking & Broadcast to other 2 phones
  if (req.url === '/api/transactions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const db = getDB();

        const newEntry = {
          id: 'tx_' + Date.now(),
          type: payload.type || 'distribution', // 'distribution' | 'marriage_hall'
          title: payload.title || 'नया बिल',
          customer: payload.customer || 'अज्ञात ग्राहक',
          amount: Number(payload.amount) || 0,
          advance: Number(payload.advance) || 0,
          eventDate: payload.eventDate || '',
          paymentStatus: payload.paymentStatus || 'paid',
          createdBy: payload.createdBy || 'Worker',
          role: payload.role || 'worker',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().slice(0, 10)
        };

        db.transactions.unshift(newEntry);
        saveDB(db);

        // Prepare Alert for the other 2 phones
        const alertMsg = payload.type === 'marriage_hall'
          ? `🏛️ ${payload.createdBy} ने मैरिज हॉल बुकिंग जोड़ी: ₹${payload.amount} (${payload.customer})`
          : `🥤 ${payload.createdBy} ने नया बिल बनाया: ₹${payload.amount} (${payload.customer})`;

        const alertObj = {
          id: 'alert_' + Date.now(),
          type: 'TRANSACTION_ADDED',
          title: '🔔 नया अपडेट (Live Sync)',
          message: alertMsg,
          transaction: newEntry,
          senderDeviceId: payload.deviceId || '',
          created: Date.now()
        };

        // Add to alert queue so polling phones pick it up
        pendingAlerts.push(alertObj);
        if (pendingAlerts.length > 30) pendingAlerts.shift();

        // Broadcast to SSE if connected
        const sseData = `data: ${JSON.stringify(alertObj)}\n\n`;
        activeClients.forEach(c => {
          try { c.res.write(sseData); } catch (e) {}
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, transaction: newEntry }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. SSE /api/subscribe
  if (req.url === '/api/subscribe' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const clientId = Date.now() + Math.random().toString();
    const newClient = { id: clientId, res };
    activeClients.push(newClient);

    res.write(`: ${' '.repeat(2048)}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

    req.on('close', () => {
      activeClients = activeClients.filter(c => c.id !== clientId);
    });
    return;
  }

  // Static File Serving
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Service-Worker-Allowed': '/'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Karya Business Engine] running on http://0.0.0.0:${PORT}/`);
});

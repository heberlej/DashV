const https = require('https');

const options = {
  hostname: 'your-proxmox-host',
  port: 8006,
  path: '/api2/json/version',
  method: 'GET',
  headers: {
    'Authorization': 'PVEAPIToken=root@pam!dashv:your-token-secret'
  },
  rejectUnauthorized: false,
  timeout: 3000
};

const req = https.request(options, (res) => {
  console.log('✅ Verbindung erfolgreich! Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response:', data.substring(0, 300));
  });
});

req.on('error', (e) => {
  console.error('❌ Fehler:', e.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Timeout nach 3 Sekunden');
  req.destroy();
  process.exit(1);
});

req.end();

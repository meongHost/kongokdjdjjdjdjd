import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import axios from 'axios';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup __dirname di ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = path.join(__dirname, '../config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const PTERO_URL = config.server_panel.url;
const API_KEY = config.server_panel.key;

const app = express();

app.set('views', path.join(__dirname, '../views')); // path ke views di luar api/
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'secretkey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    sameSite: 'lax',
    maxAge: 1000 * 60 * 10
  }
}));

// Helper functions
function toRupiah(number) {
  return Number(number).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
}

function generateRandomText(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return [...Array(length)].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// --- Routes dan fungsi kamu disini ---
// (salin semua route dan fungsi dari kode kamu ke sini,
// cukup tambahkan path fix agar routing tetap berjalan)

// contoh route utama:
app.get('/', (req, res) => {
  res.render('index');
});

// ... semua route yang kamu buat seperti /admin/dashboard, /buypanel, dll ...

// Middleware requireAdmin
app.get('/account', (req, res) => {
  const data = req.session.accountData;
  if (!data) return res.redirect('/');
  req.session.paymentStatus = null;
  res.render('account', data);
});
// Endpoint untuk halaman pembelian panel server

// Halaman awal input user dan ram

// Route untuk halaman admin



// Middleware untuk memeriksa apakah user sudah login sebagai admin


// Route dashboard admin yang hanya bisa diakses admin


// Route lainnya yang membutuhkan autentikasi admin

// Admin dashboard route
app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')); // BACA ULANG DI SINI

    const usersRes = await fetch(`${config.server_panel.url}/api/application/users?include=servers`, {
      headers: {
        'Authorization': `Bearer ${config.server_panel.key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const usersJson = await usersRes.json();

    const akun = usersJson.data.map(user => {
      let totalRam = 0;
      const servers = user.attributes.relationships?.servers?.data || [];

      servers.forEach(server => {
        totalRam += server.attributes.limits.memory || 0;
      });

      return {
        id: user.attributes.id,
        username: user.attributes.username,
        email: user.attributes.email,
        ram: totalRam,
        createdAt: user.attributes.created_at
      };
    });

    res.render('admin/dashboard', { akun, config });
  } catch (err) {
    console.error('Gagal memuat dashboard:', err);
    res.status(500).send('Terjadi kesalahan.');
  }
});


// Endpoint untuk mendapatkan konfigurasi
app.get('/admin/settings', (req, res) => {
  try {
    
    res.render('admin/settings', { config });
  } catch (err) {
    console.error('Gagal membaca config.json:', err);
    res.status(500).send('Terjadi kesalahan saat memuat pengaturan.');
  }
});

// Endpoint untuk menyimpan perubahan konfigurasi


// Tentukan path untuk file config.json


app.post('/admin/settings', (req, res) => {
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const { base_url, secret_key, server_url, server_url1, server_key, egg, location, price } = req.body;

  try {
    const newConfig = {
      api: {
        base_url,
        secret_key
      },
     server_panel: { url: server_url, url1: server_url1, key: server_key, egg: egg, location: location },


      price: {
        panel_packages: price
      },
      my_group: {
        name: "Nama Grup Kamu",
        url: "https://chat.whatsapp.com/...",
        profile_picture: "https://i.ibb.co/xyz123/profile.jpg"
      }
    };

    // Menyimpan perubahan ke config.json
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    
    // Redirect ke dashboard setelah perubahan disimpan
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Gagal menyimpan konfigurasi:', err);
    res.status(500).send('Terjadi kesalahan saat menyimpan konfigurasi.');
  }
});

// Route untuk list user
app.get('/admin/users', async (req, res) => {
  try {
    const usersRes = await fetch(`${config.server_panel.url}/api/application/users`, {
      headers: {
        "Authorization": "Bearer " + config.server_panel.key
      }
    });
    const usersData = await usersRes.json();
    res.render('admin/users', { users: usersData.data });
  } catch (err) {
    console.error(err);
    res.send('Terjadi kesalahan saat mengambil data pengguna.');
  }
});

// Route untuk backup
app.get('/admin/backup', async (req, res) => {
  try {
    const backupRes = await fetch(`${config.server_panel.url}/api/application/servers/backup`, {
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + config.server_panel.key
      }
    });
    const backupData = await backupRes.json();
    res.json({ status: 'success', backup: backupData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Gagal melakukan backup.' });
  }
});

// Route untuk membuat user
app.post('/admin/create-user', async (req, res) => {
  const { username, email } = req.body;
  const password = generateRandomText(8);

  try {
    const userRes = await fetch(`${config.server_panel.url}/api/application/users`, {
      method: 'POST',
      headers: {
        "Authorization": "Bearer " + config.server_panel.key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: username,
        language: "en",
        password
      })
    });
    const userData = await userRes.json();
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.send('Gagal membuat pengguna baru.');
  }
});

// Route untuk menghapus user



app.post('/admin/delete-user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Ambil data user dan semua server-nya
    const userRes = await fetch(`${config.server_panel.url}/api/application/users/${userId}?include=servers`, {
      headers: {
        'Authorization': `Bearer ${config.server_panel.key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const userData = await userRes.json();
    const servers = userData.attributes.relationships?.servers?.data || [];

    // Hapus semua server milik user
    for (const server of servers) {
      const serverId = server.attributes.id;

      await fetch(`${config.server_panel.url}/api/application/servers/${serverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.server_panel.key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`Server ${serverId} milik user ${userId} dihapus.`);
    }

    // Hapus user dari panel
    const deleteUser = await fetch(`${config.server_panel.url}/api/application/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.server_panel.key}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!deleteUser.ok) {
      throw new Error('Gagal menghapus user dari panel.');
    }

    console.log(`User ${userId} berhasil dihapus.`);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Gagal hapus user:', err);
    res.status(500).send('Gagal menghapus user.');
  }
});

// Route untuk mengubah konfigurasi
app.post('/admin/config', (req, res) => {
  const { newConfig } = req.body;
  fs.writeFileSync('./config.json', JSON.stringify(JSON.parse(newConfig), null, 2));
  res.redirect('/admin');
});

// Route untuk melihat histori pembelian
app.get('/admin/history', async (req, res) => {
  try {
    const history = JSON.parse(fs.readFileSync('./purchase-history.json', 'utf-8'));
    res.render('admin/history', { history });
  } catch (err) {
    console.error(err);
    res.send('Gagal mengambil histori pembelian.');
  }
});

// Proses pembelian dan pembayaran
// Proses pembelian dan pembayaran
// check-payment.js





app.get('/check-payment', async (req, res) => {
  const panelData = req.session.panelData;

  if (!panelData || !panelData.paymentId) {
    return res.json({ status: 'waiting' });
  }

  console.log('Session panelData:', panelData);
  console.log('Checking payment for ID:', panelData.paymentId);

  try {
    const response = await fetch(`${config.api.base_url}/api/h2h/deposit/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: panelData.paymentId, // pakai paymentId di sini
        api_key: config.api.secret_key
      })
    });

    const result = await response.json();
    console.log("API Response:", result);

    if (!result || typeof result !== 'object' || !result.data || !result.data.status) {
      return res.status(500).json({ status: 'error', message: 'Response dari API tidak sesuai.' });
    }

    const data = result.data;

    if (data.status === 'success') {
      if (!req.session.created) {
        const accountInfo = await createPanelAccount(
          panelData.username,
          panelData.memo,
          panelData.disk,
          panelData.cpu
        );
        req.session.created = true;
        req.session.accountData = accountInfo;
        req.session.paymentStatus = 'success';
      }

      return res.json({ status: 'success' });
    } else if (['failed', 'cancel', 'canceled'].includes(data.status)) {
      return res.json({ status: 'failed' });
    } else {
      return res.json({ status: 'waiting' });
    }

  } catch (err) {
    console.error('Error cek pembayaran:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});
// Endpoint untuk mengecek status pembayaran dari client
app.get('/payment-status', (req, res) => {
  if (req.session.paymentStatus === 'success') {
    res.json({ status: 'success' });
  } else {
    res.json({ status: 'pending' });
  }
});
app.post('/buypanel', async (req, res) => {
  const { username, ram } = req.body;

  const ramData = {
    '1gb': { memo: 1125, disk: 1125, cpu: 40 },
    '2gb': { memo: 2125, disk: 2125, cpu: 60 },
    '3gb': { memo: 3125, disk: 3125, cpu: 80 },
    '4gb': { memo: 4125, disk: 4125, cpu: 100 },
    '5gb': { memo: 5125, disk: 5125, cpu: 120 },
    '6gb': { memo: 6125, disk: 6125, cpu: 140 },
    '7gb': { memo: 7125, disk: 7125, cpu: 160 },
    '8gb': { memo: 8125, disk: 8125, cpu: 180 },
    '9gb': { memo: 9125, disk: 9125, cpu: 200 },
    '0gb': { memo: 0, disk: 0, cpu: 0 }
  };

  if (!ramData[ram]) return res.send('RAM tidak tersedia.');

  const { memo, disk, cpu } = ramData[ram];
  const nominal = config.price.panel_packages[ram];
  const reffId = generateRandomText(10);

  try {
    const paymentRes = await axios.post(`${config.api.base_url}/api/h2h/deposit/create`, {
      reff_id: reffId,
      type: 'ewallet',
      method: 'QRISFAST',
      nominal: nominal,
      api_key: config.api.secret_key
    });

    const qrData = paymentRes.data.data;

    // Simpan semua data yang dibutuhkan di session
    req.session.panelData = {
      username,
      ram,
      memo,
      disk,
      cpu,
      reffId: qrData.reff_id,
      paymentId: qrData.id // <-- Tambahkan ini
    };

    res.render('payment', {
      qrImage: qrData.qr_image_url,
      reffId: qrData.reff_id,
      nominal: qrData.nominal,
      fee: qrData.fee,
      get_balance: qrData.get_balance,
      created_at: qrData.created_at,
      username: username,
      ram: ram
    });

  } catch (err) {
    console.error(err);
    res.send('Terjadi kesalahan saat membuat pembayaran.');
  }
});


// Fungsi pembuatan akun panel

async function createPanelAccount(baseUsername, memo, disk, cpu) {
  const randomStr = Math.random().toString(36).substring(2, 6); // 4 huruf acak
  const username = `${baseUsername}_${randomStr}`;
  const email = `${username}@apinetwork.my.d`;
  const password = generateRandomText(6) + username;

  // Buat user di Pterodactyl
  const userRes = await fetch(`${config.server_panel.url}/api/application/users`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + config.server_panel.key
    },
    body: JSON.stringify({
      email,
      username,
      first_name: username,
      last_name: username,
      language: "en",
      password
    })
  });

  const userData = await userRes.json();
  console.log("UserData Response:", userData);

  // Jika gagal, tampilkan error dan hentikan proses
  if (!userRes.ok || userData.errors) {
    const errorMsg = userData.errors?.map(e => e.detail).join(', ') || 'Unknown error saat membuat user.';
    throw new Error(`Gagal membuat akun panel: ${errorMsg}`);
  }

  const userId = userData.attributes.id;

  // Ambil data egg
  const eggRes = await fetch(`${config.server_panel.url}/api/application/nests/5/eggs/${config.server_panel.egg}`, {
    headers: {
      "Accept": "application/json",
      "Authorization": "Bearer " + config.server_panel.key
    }
  });

  const eggData = await eggRes.json();
  const startupCmd = eggData.attributes?.startup || "npm start";

  // Buat server
  const serverRes = await fetch(`${config.server_panel.url}/api/application/servers`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": "Bearer " + config.server_panel.key
    },
    body: JSON.stringify({
      name: username,
      user: userId,
      egg: parseInt(config.server_panel.egg),
      docker_image: "ghcr.io/parkervcp/yolks:nodejs_21",
      startup: startupCmd,
      environment: {
        INST: "npm",
        USER_UPLOAD: "0",
        AUTO_UPDATE: "0",
        CMD_RUN: "npm start"
      },
      limits: {
        memory: memo,
        swap: 0,
        disk: disk,
        io: 500,
        cpu: cpu
      },
      feature_limits: {
        databases: 0,
        backups: 0,
        allocations: 0
      },
      deploy: {
        locations: [parseInt(config.server_panel.location)],
        dedicated_ip: false,
        port_range: []
      }
    })
  });

  const serverData = await serverRes.json();
  console.log("Server Response:", serverData);

  if (!serverRes.ok || serverData.errors) {
    const errorMsg = serverData.errors?.map(e => e.detail).join(', ') || 'Gagal membuat server.';
    throw new Error(`Gagal membuat server panel: ${errorMsg}`);
  }

  return {
  email,
  username,
  password,
  ram: memo / 1000 + ' GB',
  disk: disk / 1000 + ' GB',
  cpu: cpu + ' %',
  login_url: config.server_panel.url, // koma ditambahkan di sini
  login_url1: config.server_panel.url1
};
}



// Start


// Middleware requireAdmin untuk akses admin


// Route login admin
app.get('/admin/login', (req, res) => {
  res.render('admin/login'); // Halaman input PIN
});

app.post('/admin/login', (req, res) => {
  const { pin } = req.body;
  const config = JSON.parse(fs.readFileSync('config.json', 'utf-8')); // Ambil konfigurasi dari file config.json

  if (pin === config.admin_pin) {  // Periksa apakah PIN sesuai
    req.session.isAdmin = true;  // Set session isAdmin menjadi true
    return res.redirect('/admin/dashboard');  // Arahkan ke dashboard setelah login sukses
  } else {
    return res.send('PIN salah.');  // Jika PIN salah
  }
});

// Route dashboard admin

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect('/admin/login');
}
// Route logout admin
app.get('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Gagal logout.');
    }
    res.redirect('/admin/login');  // Kembalikan ke halaman login setelah logout
  });
});


// Load config

// Admin Login GET
app.get('/admin/login', (req, res) => {
  res.render('admin/login');
});

app.post('/admin/login', (req, res) => {
  const { pin } = req.body;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (pin === config.admin_pin) {
    req.session.isAdmin = true;
    res.redirect('/admin/dashboard');
  } else {
    res.send('PIN salah');
  }
});

// Admin Dashboard


// Admin Users

// Admin Settings GET

// Admin Settings POST


// Admin History
app.get('/admin/history', requireAdmin, async (req, res) => {
  const history = JSON.parse(fs.readFileSync('./history.json', 'utf-8'));
  res.render('admin/history', { history });
});
// Implement semua route lain sesuai kode kamu ...

// 404 handler untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../views/errors/404.html'));
});


// Karena ini serverless, kita buat handler untuk Vercel:

import { createServer } from 'http';
import { parse } from 'url';

function runExpress(req, res) {
  const parsedUrl = parse(req.url, true);
  return new Promise((resolve) => {
    app(req, res, () => resolve());
  });
}

// Export default handler
export default async function handler(req, res) {
  // reload config setiap request agar dinamis
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // update global vars bila perlu
  // misal PTERO_URL, API_KEY dari config terbaru

  try {
    await runExpress(req, res);
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

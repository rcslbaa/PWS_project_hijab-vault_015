require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); 

const app = express();
app.use(cors());
app.use(express.json());

// --- FUNGSI HELPER ---
// Gue ganti jadi HIJAB- supaya sinkron sama branding lo
const generateKey = () => `HIJAB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

// --- MIDDLEWARE LOG ---
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} request ke ${req.url}`);
  next();
});

// --- ROUTES ---

// 1. AMBIL DATA HIJAB
app.get('/api/hijab', async (req, res) => {
  const { keyword } = req.query;
  try {
    // Nama tabel 'hijab_products' sudah sesuai dengan MySQL Workbench lo
    // Kolom 'kategori' dan 'nama' juga sudah sinkron
    const query = "SELECT * FROM hijab_products WHERE kategori LIKE ? OR nama LIKE ?";
    const searchTerm = `%${keyword || ''}%`;
    const [rows] = await db.execute(query, [searchTerm, searchTerm]);
    
    res.json(rows);
  } catch (err) {
    // Kita cetak error spesifik di terminal biar gampang debug
    console.error("❌ DATABASE ERROR:", err.message);
    res.status(500).json({ pesan: "Gagal mencari data hijab", error: err.message });
  }
});

// 2. REGISTER USER
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) return res.status(400).json({ pesan: "Email dan Password wajib diisi!" });

    const [exist] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (exist.length > 0) return res.status(400).json({ pesan: "Email sudah terdaftar!" });

    const apiKey = generateKey();
    const userRole = role || 'user'; 
    
    // Pastikan tabel 'users' punya kolom: email, password, role, apiKey
    const query = "INSERT INTO users (email, password, role, apiKey) VALUES (?, ?, ?, ?)";
    await db.execute(query, [email, password, userRole, apiKey]);

    console.log(`✅ User Terdaftar: ${email} | Key: ${apiKey}`);
    res.json({ pesan: "Registrasi Berhasil!", user: { email, role: userRole, apiKey } });
  } catch (err) {
    console.error("❌ ERROR REGISTER:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. LOGIN USER
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);

    if (rows.length > 0) {
      console.log(`✅ Login sukses: ${email}`);
      res.json({ pesan: "Login Berhasil", user: rows[0] });
    } else {
      res.status(401).json({ pesan: "Email atau Password salah!" });
    }
  } catch (err) {
    console.error("❌ ERROR LOGIN:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- FITUR KHUSUS ADMIN ---

app.get('/api/admin/users', async (req, res) => {
  try {
    const [users] = await db.execute("SELECT id, email, role, apiKey FROM users ORDER BY role ASC");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) return res.status(404).json({ pesan: "User tidak ditemukan" });
    res.json({ pesan: "User berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Hijab Store Nyala di http://localhost:${PORT}`);
  console.log(`📂 Database: hijab_store_db | Port: 3308`); // Pastikan port 3308 sesuai Workbench lo
});
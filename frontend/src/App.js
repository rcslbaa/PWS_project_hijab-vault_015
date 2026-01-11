import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [products, setProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [authForm, setAuthForm] = useState({ email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);

  // Sesuaikan port dengan server.js lo (biasanya 5000)
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const saved = localStorage.getItem('userData');
    if (saved) {
      setUser(JSON.parse(saved));
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      fetchAdminData();
    }
  }, [isLoggedIn, user]);

  const fetchAdminData = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setAllUsers(res.data);
    } catch (err) {
      console.error("Gagal ambil data admin");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegistering ? 'register' : 'login';
      const res = await axios.post(`${API_URL}/${endpoint}`, authForm);
      if (!isRegistering) {
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setIsLoggedIn(true);
      } else {
        alert("Berhasil Daftar! Silakan Login.");
        setIsRegistering(false);
      }
    } catch (err) { 
      alert(err.response?.data?.pesan || "Error Login/Register"); 
    }
  };

  // --- FUNGSI SEARCH UTAMA ---
  const aksesFiturUtama = async () => {
    // 1. Validasi API Key yang di-input harus sama dengan milik user
    if (inputKey !== user.apiKey) {
      return alert("API Key Salah! Silakan gunakan key Anda yang tertera di dashboard.");
    }
    
    if (!searchKeyword) return alert("Ketik tipe kerudung (contoh: Pashmina)");
    
    setLoading(true);
    setProducts([]); // Reset list produk agar bersih saat loading
    
    try {
      // 2. Request ke backend lokal /api/hijab
      const response = await axios.get(`${API_URL}/hijab?keyword=${searchKeyword}`);
      
      // 3. Mapping data dari database MySQL (nama, harga, imageUrl, kategori)
      const hasil = response.data.map(p => ({
        title: p.nama,
        price: p.harga,
        image: p.imageUrl,
        kategori: p.kategori
      }));

      setProducts(hasil);
      
      // Alert jika keyword tidak ada di database
      if (hasil.length === 0) {
        alert("Tipe kerudung tidak ditemukan di database.");
      }
    } catch (err) {
      // Menangani error koneksi jika server.js mati
      alert("Gagal koneksi ke database lokal. Pastikan server.js sudah dijalankan (node server.js)!");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border-t-4 border-pink-400">
          <h1 className="text-3xl font-black text-pink-600 mb-6 text-center italic tracking-tighter">HIJAB STORE</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-pink-300" onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <input type="password" placeholder="Password" required className="w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-pink-300" onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            
            {isRegistering && (
              <select className="w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-pink-300" onChange={e => setAuthForm({...authForm, role: e.target.value})}>
                <option value="user">Daftar sebagai User</option>
                <option value="admin">Daftar sebagai Admin</option>
              </select>
            )}

            <button className="w-full bg-pink-500 text-white p-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-pink-600 transition shadow-lg">
              {isRegistering ? "DAFTAR SEKARANG" : "MASUK"}
            </button>
          </form>
          <p className="mt-6 text-[10px] text-center font-bold text-gray-400 cursor-pointer hover:text-pink-400 uppercase tracking-widest" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "SUDAH PUNYA AKUN? LOGIN" : "BELUM PUNYA AKUN? DAFTAR"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-black text-pink-600 italic uppercase tracking-tighter">Hijab collection</h1>
          <div className="flex gap-2">
            <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Role: {user.role}</span>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-md hover:bg-red-600">Logout</button>
          </div>
        </div>

        {/* --- API KEY DASHBOARD --- */}
        <div className="bg-white p-8 rounded-[35px] shadow-sm mb-8 text-center border-2 border-pink-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My API Access Key</p>
          <h2 className="text-3xl font-mono font-black text-pink-600 mb-4 select-all">{user.apiKey || "BELUM ADA KEY"}</h2>
          <p className="text-[9px] text-pink-300 font-bold uppercase tracking-widest">Copy key di atas untuk mengakses database di bawah</p>
        </div>

        {/* --- ADMIN PANEL --- */}
        {user.role === 'admin' && (
          <div className="bg-white p-8 rounded-[35px] shadow-md mb-8 border-l-8 border-pink-500">
            <h3 className="text-lg font-black uppercase mb-4 text-pink-600 italic tracking-tight">Admin Management: List User & Keys</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 uppercase text-[10px] border-b">
                    <th className="pb-4">User Email</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Active API Key</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-pink-50 transition">
                      <td className="py-3 font-bold text-gray-700">{u.email}</td>
                      <td className="py-3"><span className="text-[9px] bg-gray-100 px-2 py-1 rounded font-bold uppercase">{u.role}</span></td>
                      <td className="py-3 font-mono text-pink-500 font-bold">{u.apiKey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- FITUR AKSES DATABASE --- */}
        <div className="bg-white p-10 rounded-[40px] shadow-xl border-b-8 border-pink-500">
          <h3 className="text-center font-black uppercase mb-8 tracking-[0.2em] text-gray-400 text-xs">Database Access Interface</h3>
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            <input type="text" placeholder="Paste API Key di Sini" className="p-5 bg-gray-50 border rounded-[25px] font-mono text-xs outline-none focus:ring-2 ring-pink-400 transition" value={inputKey} onChange={e => setInputKey(e.target.value)} />
            <input type="text" placeholder="Cari Hijab (Pashmina, Bergo...)" className="md:col-span-2 p-5 bg-gray-50 border rounded-[25px] font-bold text-sm outline-none focus:ring-2 ring-pink-400 transition" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
            <button onClick={aksesFiturUtama} className="bg-pink-600 text-white rounded-[25px] font-black uppercase shadow-lg hover:bg-pink-700 transition transform hover:scale-105 active:scale-95">
              {loading ? "MENGAMBIL..." : "CARI PRODUK"}
            </button>
          </div>

          {/* HASIL PRODUK */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.length > 0 ? products.map((p, i) => (
              <div key={i} className="bg-white p-3 rounded-[30px] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
                <div className="aspect-square rounded-[25px] overflow-hidden mb-4 bg-gray-200">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <div className="px-2 pb-2">
                  <p className="text-[8px] text-pink-400 font-black uppercase mb-1 tracking-widest">{p.kategori}</p>
                  <h4 className="font-bold text-[11px] h-8 overflow-hidden uppercase leading-tight text-gray-800">{p.title}</h4>
                  <p className="text-pink-600 font-black mt-2 text-md">Rp {Number(p.price).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center opacity-20 font-black italic text-2xl uppercase tracking-tighter">
                {loading ? "Menghubungkan ke Database..." : "Masukkan Key & Cari Kerudung"}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.4em]">Hijab Store Access Management System v1.0</p>
        </div>

      </div>
    </div>
  );
}

export default App;
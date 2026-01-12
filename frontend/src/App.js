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

  const handleDeleteUser = async (id) => {
    if (window.confirm("Yakin ingin menghapus email ini dari sistem?")) {
      try {
        await axios.delete(`${API_URL}/admin/users/${id}`);
        setAllUsers(allUsers.filter(u => u.id !== id));
        alert("User berhasil dihapus.");
      } catch (err) {
        alert("Gagal menghapus user.");
      }
    }
  };

  const handleEditUser = async (u) => {
    const newEmail = prompt("Masukkan Email Baru:", u.email);
    if (newEmail && newEmail !== u.email) {
      try {
        await axios.put(`${API_URL}/admin/users/${u.id}`, { email: newEmail });
        fetchAdminData();
        alert("Email berhasil diperbarui.");
      } catch (err) {
        alert("Gagal update email.");
      }
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

  const handleCopyKey = () => {
    navigator.clipboard.writeText(user.apiKey);
    alert("API Key berhasil disalin!");
  };

  const aksesFiturUtama = async () => {
    if (inputKey !== user.apiKey) return alert("API Key Salah!");
    if (!searchKeyword) return alert("Ketik tipe kerudung!");
    setLoading(true);
    setProducts([]); 
    try {
      const response = await axios.get(`${API_URL}/hijab?keyword=${searchKeyword}`);
      setProducts(response.data.map(p => ({
        title: p.nama, price: p.harga, image: p.imageUrl, kategori: p.kategori
      })));
    } catch (err) {
      alert("Gagal koneksi ke database.");
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
          <h1 className="text-3xl font-black text-pink-600 mb-6 text-center italic tracking-tighter uppercase">Hijab Vault</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-pink-300" onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <input type="password" placeholder="Password" required className="w-full p-4 border rounded-2xl outline-none focus:ring-2 ring-pink-300" onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            {isRegistering && (
              <select className="w-full p-4 border rounded-2xl outline-none" onChange={e => setAuthForm({...authForm, role: e.target.value})}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            )}
            <button className="w-full bg-pink-500 text-white p-4 rounded-2xl font-bold uppercase hover:bg-pink-600 transition">
              {isRegistering ? "DAFTAR" : "MASUK"}
            </button>
          </form>
          <p className="mt-6 text-[10px] text-center font-bold text-gray-400 cursor-pointer hover:text-pink-400 uppercase" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? "LOGIN" : "DAFTAR"}
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
            <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-[10px] font-black uppercase">Role: {user.role}</span>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase hover:bg-red-600 shadow-md">Logout</button>
          </div>
        </div>

        {/* --- API KEY DASHBOARD --- */}
        <div className="bg-white p-8 rounded-[35px] shadow-sm mb-8 text-center border-2 border-pink-100">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">My API Access Key</p>
          <h2 className="text-3xl font-mono font-black text-pink-600 mb-4 select-all">{user.apiKey}</h2>
          <button 
            onClick={handleCopyKey}
            className="bg-pink-500 hover:bg-pink-600 text-white text-[8px] font-bold py-1 px-3 rounded-full uppercase transition transform active:scale-95 shadow-sm"
          >
            Copy API Key
          </button>
          <p className="text-[9px] text-pink-300 font-bold uppercase mt-3">Copy key di atas untuk mengakses database di bawah</p>
        </div>

        {/* --- ADMIN PANEL --- */}
        {user.role === 'admin' && (
          <div className="bg-white p-8 rounded-[35px] shadow-md mb-8 border-l-8 border-pink-500">
            <h3 className="text-lg font-black uppercase mb-4 text-pink-600 italic">Admin Management: List User & Keys</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 uppercase text-[10px] border-b">
                    <th className="pb-4">User Email</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Active API Key</th>
                    <th className="pb-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-pink-50 transition">
                      <td className="py-3 font-bold text-gray-700">{u.email}</td>
                      <td className="py-3">
                        <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${u.role === 'admin' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-pink-500 font-bold">{u.apiKey || "-"}</td>
                      <td className="py-3 text-center flex justify-center gap-2">
                         <button onClick={() => handleEditUser(u)} className="bg-yellow-400 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase hover:bg-yellow-500">Edit</button>
                         <button onClick={() => handleDeleteUser(u.id)} className="bg-red-400 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase hover:bg-red-500">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SEARCH INTERFACE --- */}
        <div className="bg-white p-10 rounded-[40px] shadow-xl border-b-8 border-pink-500">
          <h3 className="text-center font-black uppercase mb-8 tracking-[0.2em] text-gray-400 text-xs">Database Access Interface</h3>
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            <input type="text" placeholder="Paste API Key" className="p-5 bg-gray-50 border rounded-[25px] font-mono text-xs outline-none focus:ring-2 ring-pink-400" value={inputKey} onChange={e => setInputKey(e.target.value)} />
            <input type="text" placeholder="Cari Hijab..." className="md:col-span-2 p-5 bg-gray-50 border rounded-[25px] font-bold text-sm outline-none focus:ring-2 ring-pink-400" value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
            <button onClick={aksesFiturUtama} className="bg-pink-600 text-white rounded-[25px] font-black uppercase hover:bg-pink-700 transition transform hover:scale-105 shadow-lg">
              {loading ? "MENGAMBIL..." : "CARI PRODUK"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.length > 0 ? products.map((p, i) => (
              <div key={i} className="bg-white p-3 rounded-[30px] border border-gray-100 hover:shadow-xl transition-all group overflow-hidden">
                <div className="aspect-square rounded-[25px] overflow-hidden mb-4 bg-gray-200">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <div className="px-2 pb-2">
                  <p className="text-[8px] text-pink-400 font-black uppercase mb-1">{p.kategori}</p>
                  <h4 className="font-bold text-[11px] h-8 overflow-hidden uppercase leading-tight text-gray-800">{p.title}</h4>
                  <p className="text-pink-600 font-black mt-2 text-md">Rp {Number(p.price).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-10 text-center text-gray-300 font-bold uppercase italic tracking-widest">
                {loading ? "Tunggu sebentar..." : "Masukkan Key & Cari Kerudung"}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 text-center pb-6">
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.4em]">Hijab Store Access Management System v1.1</p>
        </div>

      </div>
    </div>
  );
}

export default App;
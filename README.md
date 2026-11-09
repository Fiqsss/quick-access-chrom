# Quick Access — Tab Baru untuk Chrome

Ekstensi Chrome yang mengganti halaman **Tab Baru** menjadi dashboard pribadi yang cantik dan bisa kamu atur sesuka hati: shortcut, jam, cuaca, jadwal sholat & azan, Pomodoro, pemutar musik YouTube, peliharaan virtual, dan banyak lagi.

> Semua data tersimpan di komputermu sendiri. Tidak perlu akun dan tidak perlu API key.

---

## Daftar isi

1. [Fitur](#-fitur)
2. [Yang dibutuhkan](#-yang-dibutuhkan)
3. [Cara pasang (langkah demi langkah)](#-cara-pasang-langkah-demi-langkah)
4. [Buka otomatis saat Chrome dijalankan](#-buka-otomatis-saat-chrome-dijalankan)
5. [Pengaturan awal (2 menit)](#-pengaturan-awal-2-menit)
6. [Cara memperbarui](#-cara-memperbarui)
7. [Kalau ada masalah](#-kalau-ada-masalah)
8. [Izin yang diminta & privasi](#-izin-yang-diminta--privasi)
9. [Cara menghapus](#-cara-menghapus)
10. [Struktur folder & untuk pengembang](#-struktur-folder--untuk-pengembang)

Panduan pemakaian lengkap untuk setiap fitur ada di **[quick-access/CARA-PASANG.md](quick-access/CARA-PASANG.md)**.

---

## ✨ Fitur

| Kategori | Isi |
|---|---|
| **Dasar** | Shortcut, grup, dan folder (seret & lepas), pencarian web dengan saran riwayat/bookmark, mode 🌐 Terjemah, kalkulator & konversi (`10 usd ke idr`) |
| **Tata letak** | Semua blok bisa diseret dan diubah ukurannya, 6 template, simpan susunan sendiri, 🎯 mode fokus |
| **Tampilan** | 11 tema, tema otomatis sesuai waktu, foto harian, wallpaper bergerak/video, gaya kartu, 6 font, jam Digital/Analog/Flip/Neon/Kata, dekorasi musiman, efek cuaca |
| **Ibadah** | Jadwal sholat (Kemenag), notifikasi azan, arah kiblat, ayat harian, kalender Hijriah & libur nasional |
| **Produktivitas** | Pomodoro, pengingat, tugas, catatan (bisa dikunci PIN), sticky notes, kebiasaan harian, statistik fokus, mood, palet perintah `Ctrl+K` |
| **Hiburan** | Pemutar musik YouTube (lirik, antrean, volume, visualizer), suara latar (hujan, ombak, lo-fi…), peliharaan virtual (6 jenis, level, aksesori, main bola) |
| **Info** | Cuaca lengkap & kualitas udara, kurs & harga emas, hitung mundur |

Semua fitur tambahan **mati sampai kamu menyalakannya** di Pengaturan.

---

## 🧰 Yang dibutuhkan

- **Google Chrome** (atau browser berbasis Chromium seperti Edge, Brave, Opera), versi 116 ke atas.
- Komputer **Windows, macOS, atau Linux**.
- Koneksi internet (untuk cuaca, jadwal sholat, terjemah, dan lirik). Shortcut, jam, catatan, dan tugas tetap jalan tanpa internet.

---

## 📥 Cara pasang (langkah demi langkah)

Ekstensi ini belum ada di Chrome Web Store, jadi dipasang secara manual. Caranya mudah dan hanya perlu dilakukan sekali.

### Langkah 1 — Ambil file-nya

Pilih salah satu cara:

**Cara A: Download ZIP (paling mudah)**

1. Buka halaman repositori ini di GitHub.
2. Klik tombol hijau **`<> Code`** → **Download ZIP**.
3. Ekstrak (klik kanan → *Extract All…*) ke folder yang **tidak akan dipindah atau dihapus**, misalnya `D:\Apps\quick-access-chrom`.

**Cara B: Git clone (kalau kamu pakai Git)**

```bash
git clone https://github.com/Fiqsss/quick-access-chrom.git
```

> ⚠️ **Penting:** Chrome membaca ekstensi langsung dari folder ini. Jangan hapus, pindahkan, atau ganti nama foldernya setelah dipasang. Kalau terpaksa dipindah, ulangi Langkah 3.

### Langkah 2 — Buka halaman Ekstensi Chrome

1. Buka Chrome.
2. Ketik `chrome://extensions` di address bar, lalu tekan **Enter**.
3. Nyalakan **Developer mode** (sakelar di pojok **kanan atas**).

### Langkah 3 — Pasang ekstensinya

1. Klik tombol **Load unpacked** (muncul di kiri atas setelah Developer mode menyala).
2. Pilih folder **`quick-access`**, yaitu folder **di dalam** folder yang tadi kamu ekstrak atau clone. Itu folder yang berisi file `manifest.json`.

   ```
   quick-access-chrom/        ← jangan pilih yang ini
   └── quick-access/          ← ✅ pilih yang ini (ada manifest.json di dalamnya)
       ├── manifest.json
       ├── newtab.html
       └── …
   ```

3. Kartu **"Quick Access — Tab Baru"** akan muncul di daftar ekstensi.

> 💡 **Jalan pintas (Windows):** klik dua kali **`PASANG.bat`** di folder proyek. Skrip itu membuka halaman Ekstensi Chrome dan menyalin alamat folder `quick-access` ke clipboard. Di jendela *Load unpacked*, tempel alamatnya (`Ctrl+V`) di kolom alamat folder.

### Langkah 4 — Coba buka tab baru

1. Tekan **`Ctrl+T`**.
2. Kalau Chrome bertanya **"Change back to Google?"** atau **"Ubah kembali ke Google?"**, pilih **Keep it / Pertahankan**.
3. Selesai! 🎉 Kucing kecil bernama Mochi akan jatuh ke layar dan menyapamu.

---

## 🚀 Buka otomatis saat Chrome dijalankan

Supaya Quick Access langsung muncul setiap kali Chrome dibuka:

1. Ketik `chrome://settings/onStartup` di address bar.
2. Pilih **Open the New Tab page** (Buka halaman Tab Baru).
3. Kalau ada alamat lain di bagian *Open a specific page*, hapus dulu (klik **⋮** → **Remove**).

> Kalau pengaturan Chrome-mu tersinkron ke akun Google, cukup ubah sekali dan perubahannya ikut ke perangkat lain.

---

## ⚙️ Pengaturan awal (2 menit)

Klik ikon **⚙** di pojok kanan atas, lalu:

1. **⚙️ Umum → Profil**: isi nama sapaanmu.
2. **🕌 Ibadah → Lokasi**: isi kotamu (untuk cuaca, jadwal sholat, dan kiblat), lalu klik **Simpan**.
3. **🎨 Tampilan → Tema**: pilih tema yang kamu suka, atau nyalakan *Tema otomatis sesuai waktu*.
4. **🧩 Widget**: nyalakan atau matikan widget yang kamu mau.
5. Klik ikon **tata letak** di pojok kanan atas → pilih template, atau **✏️ Atur tata letak** untuk menyeret blok sesukamu.

Bingung mencari suatu pengaturan? Ketik di kotak **"Cari pengaturan…"**, misalnya *font*, *azan*, atau *wallpaper*. Bisa juga tekan **`Ctrl+K`** di mana saja.

---

## 🔄 Cara memperbarui

1. Ambil versi terbaru:
   - **ZIP**: download ulang, lalu timpa isi folder lama. **Jangan pindah ke folder lain.**
   - **Git**: jalankan perintah ini di folder proyek:
     ```bash
     git pull
     ```
2. Buka `chrome://extensions`.
3. Klik ikon **↻ Reload** di kartu Quick Access.
4. Tutup lalu buka lagi tab barunya.

Data kamu (shortcut, catatan, tata letak, peliharaan) **tidak hilang** saat memperbarui.

> 💡 Sebelum memperbarui, kamu bisa membuat cadangan lewat **⚙️ Umum → Sinkron & data → Export**.

---

## 🩺 Kalau ada masalah

| Masalah | Solusi |
|---|---|
| Tab baru masih menampilkan Google / halaman lama | Buka `chrome://extensions`, pastikan Quick Access **menyala**. Saat Chrome bertanya "Change back to Google?", pilih **Keep it**. |
| Chrome membuka halaman lain (mis. `localhost:…`) saat pertama dibuka | Ikuti bagian [Buka otomatis saat Chrome dijalankan](#-buka-otomatis-saat-chrome-dijalankan). |
| Muncul error **"Manifest file is missing or unreadable"** | Kamu memilih folder yang salah. Pilih folder `quick-access` yang berisi `manifest.json`. |
| Fitur baru tidak muncul setelah update | Klik **↻ Reload** di `chrome://extensions`, lalu buka tab baru lagi. |
| Musik YouTube tidak terdeteksi | Klik **↻ Reload** ekstensi, lalu muat ulang tab YouTube-nya sekali. Kalau widget menampilkan **🔒 Izinkan akses YouTube**, klik tombol itu. |
| Notifikasi azan, pengingat, atau Pomodoro tidak muncul | Matikan *Focus assist / Do not disturb* di Windows. Lalu buka **Windows Settings → System → Notifications** dan izinkan **Google Chrome**. Chrome harus tetap berjalan (boleh di system tray). |
| Cuaca, jadwal sholat, atau terjemah tidak muncul | Cek koneksi internet, lalu pastikan nama kota di **🕌 Ibadah → Lokasi** benar. |
| Visualizer musik tidak mengikuti irama | Klik sekali di tab YouTube-nya. Browser baru mengizinkan analisis suara setelah ada klik di tab itu. |
| Peliharaan hilang | **⚙ → 🐱 Peliharaan → 📣 Panggil ke sini**. |
| Lupa PIN catatan | Catatan terkunci tidak bisa dipulihkan karena isinya terenkripsi. Pilih **Lupa PIN?** untuk menghapus catatan dan PIN-nya. |

---

## 🔐 Izin yang diminta & privasi

Saat dipasang, Chrome menampilkan daftar izin. Ini kegunaannya:

| Izin | Untuk apa |
|---|---|
| Ganti halaman Tab Baru | Menampilkan Quick Access di setiap tab baru |
| Penyimpanan | Menyimpan shortcut, catatan, dan pengaturan **di komputermu** |
| Alarm & notifikasi | Azan, pengingat, dan Pomodoro (tetap jalan walau tab ditutup) |
| Riwayat & bookmark | Saran saat mengetik di kotak pencarian, dan impor bookmark (hanya dibaca, tidak pernah dikirim ke mana pun) |
| Akses ke YouTube | Membaca lagu yang sedang diputar dan menjalankan tombol ⏮ ⏯ ⏭ |
| Akses ke beberapa situs data | Cuaca (Open-Meteo), jadwal sholat (Aladhan), ayat (AlQuran Cloud), terjemah (Google Translate), lirik (lrclib), foto harian (Bing), kurs & emas, kualitas udara |

- Tidak ada akun, tidak ada pelacakan, dan tidak ada iklan.
- Data pribadimu tidak dikirim ke server mana pun. Yang dikirim hanya permintaan data publik di atas, misalnya nama kotamu untuk cuaca.
- **Sinkron antar perangkat** (opsional) memakai penyimpanan sinkron bawaan Chrome di akun Google-mu sendiri.

---

## 🗑️ Cara menghapus

1. Buka `chrome://extensions`.
2. Klik **Remove** di kartu Quick Access.
3. Tab baru akan kembali ke halaman bawaan Chrome. Setelah itu folder proyeknya boleh dihapus.

> Ingin menyimpan datamu dulu? Buka **⚙️ Umum → Sinkron & data → Export** sebelum menghapus.

---

## 🗂 Struktur folder & untuk pengembang

```
quick-access-chrom/
├── README.md              ← panduan ini
├── PASANG.bat             ← jalan pintas pemasangan (Windows)
├── tools/
│   └── serve.ps1          ← server lokal kecil untuk pratinjau saat mengembangkan
└── quick-access/          ← folder ekstensi (yang dipilih di "Load unpacked")
    ├── manifest.json      ← identitas & izin ekstensi
    ├── newtab.html        ← halaman tab baru
    ├── style.css          ← semua tampilan
    ├── app.js             ← logika utama (shortcut, tata letak, widget, pengaturan)
    ├── extras.js          ← fitur opsional (Ctrl+K, sticky notes, widget tambahan, sinkron…)
    ├── pet.js             ← peliharaan virtual
    ├── background.js      ← notifikasi azan/pengingat/Pomodoro di latar belakang
    ├── yt-content.js      ← pembaca pemutar YouTube
    ├── offscreen.html/js  ← pemutar suara notifikasi
    ├── sound.js           ← nada notifikasi
    ├── icons/             ← ikon ekstensi
    └── CARA-PASANG.md     ← panduan pemakaian lengkap per fitur
```

**Pratinjau tanpa memasang ulang** (Windows PowerShell), jalankan dari folder proyek:

```powershell
powershell -ExecutionPolicy Bypass -File tools\serve.ps1 -Root quick-access -Port 8765
```

Lalu buka `http://localhost:8765/newtab.html`. Di mode pratinjau, data disimpan di `localStorage`. Fitur yang butuh izin ekstensi (notifikasi, riwayat/bookmark, YouTube, sinkron) tidak aktif.

Setelah mengubah kode, klik **↻ Reload** di `chrome://extensions` supaya perubahannya terpasang di Chrome.

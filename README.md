# SIAJAR

Aplikasi penyusunan **soal**, **kisi-kisi**, dan **kartu soal** untuk madrasah, dengan
pengesahan dan tanda tangan kepala madrasah serta pengelolaan akun oleh administrator.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Basis data SQLite dibuat otomatis pada `data/siajar.db`
saat aplikasi pertama kali dijalankan, beserta tiga akun contoh:

| Peran | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `admin123` |
| Kepala Madrasah | `kepala1` | `kepala123` |
| Guru | `guru1` | `guru123` |

Ganti password akun contoh melalui menu **Akun Saya** setelah masuk.

Untuk versi produksi:

```bash
npm run build
npm start
```

## Alur kerja

1. **Administrator** mengatur kop surat dan identitas madrasah di menu **Kop Surat**,
   serta membuat akun guru dan kepala madrasah di menu **Pengguna & Reset**.
   Permintaan lupa password dari halaman masuk ditangani di halaman yang sama.
2. **Guru** membuat paket soal: memilih mata pelajaran (umum, madrasah/bahasa Arab,
   atau tulis sendiri), kelas, semester, dan kurikulum (Merdeka atau Berbasis Cinta),
   lalu menambah beberapa butir kosong sekaligus (misalnya 10 soal) dan mengisi
   materi, capaian/nilai cinta, indikator, serta level tiap butir. Guru mengajukan
   paket untuk ditandatangani.
3. **Kepala madrasah** meninjau paket, mengunggah tanda tangan di **Akun Saya**, lalu
   mengesahkan. Paket terkunci dan siap dicetak.
4. Dokumen yang dihasilkan otomatis: **naskah soal** (termasuk kunci jawaban opsional),
   **kisi-kisi** (A4 lanskap), dan **kartu soal** (satu kartu per halaman). Gunakan
   tombol **Cetak / Simpan PDF** pada dokumen.

## Bantuan AI (opsional)

Tombol **Bantu AI** pada tiap butir mengisi level kognitif, indikator soal, butir soal,
pilihan jawaban, dan kunci. Guru cukup mengisi bentuk soal, skor, materi, serta nilai
cinta atau capaian pembelajaran; mata pelajaran, kelas, dan kurikulum menjadi konteks.
Setelah dibuat, semua kolom tetap dapat disunting manual. Hasil AI adalah draf yang perlu
diperiksa guru. Prompt diarahkan agar bahasa Indonesia yang dihasilkan wajar dan tidak
tterdengar seperti chatbot.

Integrasi memakai API yang kompatibel dengan OpenAI (disarankan Z.ai). Kunci dapat
diisi administrator melalui **Pengaturan → Integrasi** (disimpan di basis data lokal),
atau lewat `.env.local` sebagai cadangan. Untuk cara kedua, salin `.env.example` menjadi
`.env.local`, isi kunci API, lalu jalankan ulang `npm run dev`:

```
ZAI_API_KEY=...
ZAI_API_BASE=https://api.z.ai/api/paas/v4
ZAI_MODEL=glm-5.3-flash
```

Kunci hanya dipakai di server dan tidak pernah dikirim ke browser. Tanpa kunci, tombol
menampilkan pesan bahwa fitur belum dikonfigurasi. Setiap pembuatan memakai kuota akun
Anda; permintaan dibatasi jeda beberapa detik agar tidak berulang tanpa sengaja.

## Ekspor ke Google Drive

Administrator membuka **Pengaturan → Integrasi** lalu:

1. Mengisi Client ID dan Client Secret OAuth dari Google Cloud Console, menekan
   **Simpan Integrasi**, kemudian **Hubungkan Akun Google**.
2. Di Google Cloud Console: aktifkan **Google Drive API**, buat **OAuth Client ID**
   jenis *Web Application*, dan daftarkan Redirect URI yang ditampilkan halaman
   pengaturan, yaitu `http://localhost:3000/api/google/callback` (sesuaikan bila
   memakai domain lain). Selama aplikasi berstatus *Testing*, tambahkan akun Google
   yang dipakai sebagai *test user*.

Izin yang diminta hanya `drive.file` (file yang dibuat aplikasi) dan alamat surel.
Setelah terhubung, guru membuka paket soal dan memakai bagian **Ekspor ke Google Drive**:

| Dokumen | Format di Drive |
| --- | --- |
| Naskah Soal | Google Docs |
| Kisi-kisi | Google Sheets |
| Kartu Soal | Google Docs |

File dibuat di akun Google yang terhubung. Kredensial dan token disimpan di basis data
SQLite lokal, tidak dikirim ke browser, dan dapat diputuskan kapan saja dari halaman
pengaturan. Mengganti Client ID atau Client Secret otomatis memutus koneksi lama sehingga
akun perlu dihubungkan ulang.

## Catatan teknis

- Next.js 15 (App Router) + Tailwind CSS 4, tanpa dependensi native.
- Basis data memakai modul bawaan Node `node:sqlite` (butuh Node 22.5+).
- Sesi login disimpan pada cookie `httpOnly`; password di-hash dengan `scrypt`.
- Logo dan tanda tangan diunggah ke `public/uploads` dan tidak masuk ke Git.
- Data lokal tersimpan di folder `data/` dan `public/uploads/`.
- Ekspor Drive membuat DOCX dengan `docx` dan XLSX dengan `exceljs`, lalu mengunggahnya
  ke Google Drive dengan konversi ke Google Docs/Sheets.

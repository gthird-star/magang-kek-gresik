# Buku Belajar Peraturan KEK Gresik

Website belajar untuk peserta magang lintas divisi. Mulai dari gambaran umum seluruh pasal, lalu gunakan jalur Waspal (draf) atau susun jalur pendalaman sendiri.

## Peraturan sumber

- **PP No. 40 Tahun 2021** — Penyelenggaraan Kawasan Ekonomi Khusus.
- **PP No. 71 Tahun 2021** — Kawasan Ekonomi Khusus Gresik.
- **PP No. 48 Tahun 2025** — Penertiban Kawasan dan Tanah Telantar.

PDF asli di folder ini menjadi rujukan utama. Teks website diekstrak dari PDF dan mungkin mengandung kesalahan ekstraksi; setiap pasal menyediakan tautan ke halaman PDF sumber.

## Menjalankan website

Jalankan perintah berikut dari folder proyek:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Buka `http://127.0.0.1:8000` di browser. Jika port 8000 sedang digunakan, pilih port lain dan sesuaikan alamatnya. Website ini statis, tanpa akun atau backend, dan dapat di-host dari root repository menggunakan GitHub Pages.

Font Public Sans di-host secara lokal; lisensi SIL Open Font License disertakan di `assets\fonts\OFL-Public-Sans.txt`.

Progres dan jalur divisi buatan sendiri disimpan di browser/perangkat masing-masing, tidak dibagikan atau disinkronkan dengan pengguna lain.

## Memperbarui indeks pasal

`data/regulations.json` dibuat dari PDF di folder proyek. Untuk membuat ulang indeks setelah PDF berubah, siapkan Python dan `pdfplumber`, lalu jalankan:

```powershell
python -m pip install pdfplumber
python scripts\extract_regulations.py
```

Website menggunakan `data\regulations.json` sebagai indeks teks pasal.

## Catatan belajar

Jalur Waspal yang disediakan adalah draf awal berdasarkan fokus tugas di catatan magang. Cocokkan pilihan pasalnya dengan pembimbing sebelum menjadikannya daftar belajar resmi. Jalur khusus divisi lain dapat dibuat sendiri dari website.

# Rencana Upgrade — Buku Belajar KEK Gresik

## Tujuan

Membuat materi tiga PP lebih mudah dipahami dan ditelusuri tanpa harus membaca semua pasal secara berurutan. Pengguna dapat menangkap inti pasal, menguji ingatan, menemukan topik, dan mengikuti rujukan ke sumber resmi.

## Lingkup

Upgrade ini mencakup:

1. Ringkasan belajar per pasal.
2. Latihan ingatan dan kuis.
3. Hubungan antar-pasal dan antar-PP.
4. Tag topik dan penyaringan.

**Tidak termasuk:** pembuatan jalur belajar baru per divisi atau perubahan jalur Waspal. Jalur yang sudah ada tetap berstatus draf.

## Prinsip dan batasan

- Bunyi pasal dan penjelasan resmi tetap menjadi rujukan utama.
- Materi belajar buatan harus diberi label yang membedakannya dari teks resmi.
- Setiap ringkasan, jawaban kuis, atau hubungan harus dapat ditelusuri ke pasal dan PDF sumber.
- Materi yang belum diperiksa ditandai belum tersedia atau belum diverifikasi; jangan tampilkan sebagai informasi pasti.
- Data tambahan disimpan terpisah dari `data/regulations.json`, karena file tersebut dibuat ulang dari PDF.
- Aplikasi tetap statis tanpa akun/backend. Progres tersimpan di browser pengguna.
- Jangan menyimpulkan hubungan hukum, perubahan, atau pertentangan antar-PP hanya dari kemiripan topik.

## Tahap 0 — Menyiapkan data dan pemeriksaan

### Pekerjaan

- Tambahkan berkas data terpisah, misalnya `data/learning-content.json`.
- Hubungkan materi tambahan ke pasal dengan kunci stabil, misalnya ID regulasi dan nomor pasal.
- Siapkan validasi untuk memastikan:
  - pasal yang dirujuk memang ada;
  - sumber PDF dan halaman yang dicatat valid;
  - tidak ada ID duplikat atau hubungan yang menunjuk ke pasal yang tidak ditemukan;
  - status materi dapat membedakan draf dan materi yang sudah diperiksa.
- Tambahkan pengujian untuk validasi data tersebut.

### Kriteria selesai

- Membuat ulang indeks dari PDF tidak menghapus atau mengubah materi tambahan.
- Aplikasi tetap berjalan jika sebagian atau seluruh materi tambahan belum tersedia.
- Data yang tidak valid menghasilkan pesan atau kegagalan validasi yang jelas, bukan ditampilkan seolah-olah benar.

## Tahap 1 — Ringkasan belajar per pasal

### Pengalaman pengguna

Di halaman pasal, tampilkan bagian terpisah berlabel **“Ringkasan belajar — bukan teks resmi”**. Ringkasan dapat memuat:

- **Inti pasal:** penjelasan singkat dengan bahasa yang lebih mudah dipahami.
- **Hal yang perlu dipahami:** poin penting atau dampak praktis yang memang didukung sumber.
- **Istilah penting:** istilah yang perlu diketahui sebelum membaca pasal.

Sediakan tautan untuk membuka teks resmi dan halaman PDF sumber. Jika ringkasan belum tersedia, tampilkan keterangan **“Ringkasan belum tersedia”** tanpa menggantinya dengan ringkasan otomatis.

### Data

Setiap entri ringkasan sebaiknya memuat:

- ID regulasi dan nomor pasal;
- isi ringkasan;
- rujukan halaman atau pasal sumber;
- status pemeriksaan, misalnya `draft` atau `reviewed`.

### Pelaksanaan awal

- Uji format pada 14 pasal yang sudah masuk jalur Waspal.
- Pastikan ringkasan bisa dipahami tanpa mengubah, menggantikan, atau menyembunyikan teks resmi.
- Setelah proses penulisan dan pemeriksaan terasa konsisten, perluas cakupan secara bertahap.

### Kriteria selesai

- Label materi belajar terlihat jelas dan berbeda dari judul **“Teks pasal”**.
- Ringkasan yang sudah ditinjau memiliki rujukan sumber.
- Ringkasan yang belum ditinjau tidak disajikan sebagai materi terverifikasi.
- Pengguna tetap dapat membuka teks resmi dan PDF dari halaman yang sama.

## Tahap 2 — Latihan ingatan dan kuis

### Pengalaman pengguna

Pertahankan latihan ingatan bebas yang sudah ada. Tambahkan kuis singkat pada pasal yang materinya sudah siap:

- satu sampai tiga pertanyaan per pasal;
- pilihan ganda untuk menguji pemahaman dasar;
- pertanyaan pemahaman singkat dengan poin jawaban sebagai pembanding;
- penjelasan jawaban yang merujuk ke bunyi resmi.

Kuis tidak wajib tersedia untuk semua pasal agar kekosongan materi tidak menghalangi pengguna membaca.

### Penyimpanan dan privasi

- Simpan status bahwa latihan sudah dicek menggunakan pola penyimpanan lokal yang sudah ada.
- Jangan menyimpan jawaban bebas pengguna pada versi awal.
- Jangan menampilkan nilai sebagai ukuran resmi pemahaman atau kompetensi hukum.

### Kriteria selesai

- Jawaban benar dan penjelasannya didukung sumber pasal.
- Status latihan konsisten dengan indikator progres.
- Pengguna dapat membuka kembali teks resmi untuk memeriksa jawabannya.
- Data progres lama tetap terbaca setelah fitur ditambahkan.

## Tahap 3 — Hubungan antar-pasal dan antar-PP

### Pengalaman pengguna

Tambahkan bagian **“Rujukan terkait”** di halaman pasal. Mulai dari rujukan eksplisit yang dapat dibuktikan melalui teks sumber. Setiap hubungan menampilkan:

- pasal atau peraturan tujuan yang dapat dibuka;
- jenis hubungan, seperti rujukan eksplisit atau keterkaitan topik;
- alasan singkat hubungan tersebut;
- sumber dan halaman yang mendukung hubungan.

Gunakan daftar atau kartu yang dapat diklik untuk versi pertama; visualisasi graf bukan kebutuhan awal.

### Aturan kurasi

- Bedakan rujukan eksplisit dari hubungan topik hasil kurasi.
- Jangan menyatakan bahwa satu aturan mengubah, menggantikan, atau bertentangan dengan aturan lain kecuali sudah diverifikasi secara memadai dan memiliki sumber.
- Jika hubungan belum diperiksa, jangan tampilkan sebagai kesimpulan hukum.

### Kriteria selesai

- Setiap tautan menuju pasal yang benar.
- Rujukan dapat ditelusuri kembali ke PDF sumber.
- Jenis hubungan ditampilkan dengan jelas agar pengguna tidak salah menafsirkannya.
- Pengguna dapat kembali ke pasal semula setelah membuka hubungan.

## Tahap 4 — Tag topik dan penyaringan

### Pengalaman pengguna

Tambahkan daftar topik terkurasi, misalnya perizinan, kelembagaan, ketenagakerjaan, fasilitas, dan kepabeanan. Pengguna dapat:

- memilih topik untuk menyaring pasal;
- menggabungkan filter topik dengan pilihan peraturan dan pencarian teks;
- melihat jumlah hasil;
- mendapat pesan yang jelas jika tidak ada hasil.

### Aturan data

- Gunakan daftar istilah yang konsisten, bukan tag bebas yang mudah berbeda penulisannya.
- Tag dipasang atau ditinjau secara kurasi.
- Pencocokan kata otomatis boleh membantu proses kurasi, tetapi tidak menjadi dasar penetapan tag tanpa pemeriksaan.

### Kriteria selesai

- Filter topik bekerja bersama pencarian teks dan filter regulasi.
- Setiap hasil dapat dibuka sebagai pasal dan memiliki tautan sumber.
- Topik kosong atau hasil pencarian kosong memiliki pesan yang membantu.

## Urutan pelaksanaan

1. **Tahap 0:** siapkan struktur data terpisah dan validasinya.
2. **Tahap 1:** bangun format ringkasan dan uji pada 14 pasal Waspal.
3. **Tahap 2:** tambahkan kuis pada pasal yang sudah memiliki materi terverifikasi.
4. **Tahap 3:** tampilkan rujukan eksplisit, lalu hubungan topik yang sudah dikurasi.
5. **Tahap 4:** tambahkan tag topik dan filter pencarian.
6. Perluas materi secara bertahap setelah format dan pemeriksaan sumber berjalan baik.

## Pengujian sebelum rilis

- Pastikan indeks pasal tetap memuat semua regulasi dan pasal yang tersedia.
- Pastikan materi tambahan yang hilang atau kosong tidak merusak halaman pembaca.
- Periksa setiap contoh ringkasan, jawaban kuis, tag, dan hubungan terhadap PDF sumber.
- Uji bahwa tautan PDF membuka halaman yang dicatat.
- Uji pencarian dan filter topik bersama filter regulasi.
- Uji bahwa progres yang tersimpan sebelumnya tetap terbaca.
- Pastikan label teks resmi, penjelasan resmi, dan materi belajar tidak tertukar.

## Ukuran keberhasilan

Upgrade berhasil bila pengguna dapat:

1. menemukan pasal melalui pencarian atau topik;
2. memahami inti pasal melalui ringkasan yang jelas status dan sumbernya;
3. menguji ingatan dan memeriksa jawaban pada teks resmi;
4. mengikuti rujukan terkait tanpa kehilangan jejak sumber;
5. membedakan bunyi resmi dari materi bantu belajar.

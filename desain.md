# Desain: Portfolio Ahmad Ashraf

Panduan desain situs ini. Pakai file ini sebagai acuan tiap kali menambah bagian baru atau mengubah tampilan, supaya semuanya tetap satu gaya.

## 1. Prinsip

1. **Gelap yang kalem.** Latar hitam kehijauan, aksen lembut. Enak dilihat lama, tidak silau.
2. **Santai, bukan formal.** Bahasa seperti ngobrol, tampilan playful: tulisan tangan, stiker, garis bergelombang, highlighter, foto miring ala polaroid. Ahmad bilang versi formal terasa kaku, jangan kembali ke gaya itu.
3. **Scroll adalah timeline.** Tiap bagian punya efek scroll yang berbeda, tidak ada dua bagian berurutan yang bergerak sama.
4. **3D secukupnya.** Satu jaring titik-garis di layer tetap, ringan. Tidak ada video atau model berat.
5. **Satu puncak.** Momen paling berkesan ada di bagian Proyek (jaring terbelah jadi tiga). Bagian lain sengaja lebih tenang.
5. **Beda dari yang lain.** Jangan meniru web lama Ahmad: tanpa bingkai arch, tanpa titik aksen di nama, tanpa strip marquee, tanpa kartu skill berbentuk chip.

## 2. Warna

Semua warna ada sebagai variabel di `:root` pada `style.css`. Jangan tulis hex langsung di komponen.

| Token | Forest (default) | Dusk | Mocha |
|---|---|---|---|
| `--bg` | `#0c1211` | `#0b1019` | `#110e0d` |
| `--bg-2` (permukaan) | `#121a18` | `#111826` | `#191412` |
| `--text` | `#eef1ec` | `#eceff5` | `#f2ece6` |
| `--muted` | `#98a39e` | `#98a2b5` | `#a59a92` |
| `--accent` | `#86d3b0` | `#82b4f5` | `#eab07c` |
| `--accent2` | `#e9c88f` | `#f2b9a3` | `#d99aa8` |

- Ganti tema lewat URL: `?theme=dusk` atau `?theme=mocha`. Tanpa parameter = Forest.
- `--accent` untuk aksi dan sorotan utama. `--accent2` untuk pelengkap (cincin 3D, kursor, nilai di terminal).
- Garis pemisah: `--line` (putih 8%). Jangan pakai garis lebih terang.
- Warna di dalam 3D dan SVG logo ikut tema, dibaca dari variabel CSS.

## 3. Tipografi

| Peran | Font | Pemakaian |
|---|---|---|
| Display | Bricolage Grotesque 700 / 800 | Judul, nama, kata besar. Letter-spacing rapat (`-.03em` sampai `-.055em`) |
| Teks | Inter 400 / 500 / 600 | Paragraf, tombol |
| Mono | JetBrains Mono 400 / 500 | Label kecil, terminal, tag. Huruf besar, spasi lebar |

- Nama di hero: `clamp(54px, 12.6vw, 190px)`, satu baris di desktop. Kata kedua memakai outline (`-webkit-text-stroke`), bukan isi.
- Judul bagian (`h2`): `clamp(32px, 4.6vw, 58px)`, line-height 1.04.
- Paragraf: abu `--muted`, lebar maksimal sekitar 46 sampai 50 karakter.

## 4. Layout

- Gutter samping: `clamp(20px, 5vw, 72px)`.
- Lebar konten maksimal 1320px, rata tengah.
- Jarak antar bagian: `clamp(80px, 12vw, 150px)` vertikal.
- Radius: kartu 20px, foto 28px, tombol dan chip pil penuh.
- Breakpoint utama: 860px. Di bawahnya layout jadi satu kolom, tag proyek disembunyikan, foto mengecil.

## 5. Komponen

- **Logo**: bentuk arch bergradasi `--accent` ke `--accent2` berisi huruf A (garis tebal, warna `--bg`), plus tulisan "ahmad" putih dan "ashraf" abu. Hover: naik 2px dan miring 4 derajat.
- **Tombol**: pil. `primary` berisi `--accent` dengan teks `--on-accent`; `ghost` hanya bergaris. Hover naik 2px.
- **Chip status**: pil bergaris, titik hijau menyala, teks mono kecil.
- **Terminal "now"**: kartu `--bg-2` dengan tiga titik jendela, isi mono. Baris perintah berwarna `--accent`, nilai berwarna `--accent2`.
- **Foto**: persegi panjang 4:5, radius 28px, bingkai garis `--accent` bergeser 18px, tag kecil di kiri bawah, gradasi gelap di 30% bawah.
- **Baris proyek**: judul besar + satu kalimat + tag mono + panah. Baris aktif: terang, bergeser 16px, garis `--accent` di kiri.

## 6. Tata scroll

| Bagian | Perangkat | Yang terjadi | Rasa |
|---|---|---|---|
| Hero | parallax belah | Nama terbelah kiri dan kanan, teks memudar | Penasaran |
| Tentang | pin + reveal | Bagian berhenti, foto terbuka dari bawah, kalimat menyala per kata | Hangat, dikenali |
| Lagi sibuk apa | reveal biasa | Terminal muncul | Santai |
| Skill | pin + pan | Halaman bergeser ke samping, satu panel per kategori | Ritme |
| Proyek (puncak) | sorotan baris | Jaring terbelah jadi tiga gugus, gugus proyek aktif menyala | Puas |
| Kontak | reveal | Jaring utuh lagi dan samar, judul bertahan sebagai penutup | Lega |

Aturan:
- Dua bagian berurutan tidak boleh memakai perangkat yang sama.
- Animasi hanya `transform` dan `opacity`; wipe memakai `clip-path`. Jangan animasikan `width`, `height`, `top`, `left`.
- Tinggi bagian pin dihitung dari isi (skill: tinggi layar + lebar track), bukan angka tetap.
- Pengguna dengan `prefers-reduced-motion`: semua pin dimatikan, foto dan kata langsung tampil, jaring tidak bergerak.

## 7. Objek 3D

- Satu `canvas` tetap di belakang konten (`position: fixed`, `pointer-events: none`), Three.js.
- Bentuknya **jaring** (jaring-jaring): sekitar 84 titik bercahaya yang tersebar rata, dihubungkan garis tipis antar titik yang berdekatan. Bukan bola atau globe; jangan kembalikan ke bentuk bulat.
- Titik melayang pelan, dan menjauh dari kursor. Garis dihitung ulang tiap frame dari jarak antar titik.
- Posisi, skala, opasitas, dan tingkat "pecah" per bagian ada di tabel `WP` (`main.js`), dihaluskan saat scroll. Desktop dan mobile punya tabel sendiri; jumlah baris harus sama dengan jumlah bagian di `secs`.
- Di bagian Proyek jaring terbelah jadi tiga gugus (satu per proyek). Gugus proyek yang sedang dibaca berwarna `--accent2` dan sedikit lebih besar.
- Anggaran performa: pixel ratio maksimal 1.5, maksimal 1400 garis, tanpa bayangan dan tanpa lampu. Satu-satunya tekstur adalah sprite titik kecil yang dibuat lewat canvas. Render berhenti saat tab tersembunyi.
- Di bagian dengan banyak teks (tentang, skill, kontak) opasitas jaring diturunkan supaya teks terbaca.
- Jaring tidak boleh membuat teks sulit dibaca. Kalau perlu, turunkan opasitas atau pindahkan ke area kosong.
- Kalau WebGL gagal, canvas dibuang dan halaman tetap utuh.

## 8. Larangan

- Tidak ada em dash di teks yang terlihat.
- Label kecil tidak huruf kapital semua.
- Tidak ada penghitung bagian (`01 / 04`), isyarat "scroll to explore", atau label kecil di atas setiap judul.
- Tidak ada teks gradien, glow neon, atau overlay gelap penuh untuk menolong kontras. Pakai scrim hanya di bawah teks.
- Tidak ada angka karangan (statistik palsu). Kalau belum ada data, kosongkan.
- Tidak menaruh wajah orang lain di foto publik. Orang di latar belakang harus dikaburkan atau dipotong.

## 9. Cara mengisi dan mengubah

- Placeholder ditandai komentar `TODO` di `index.html`: proyek, skill, isi terminal, dan link kontak.
- Foto: `assets/photo.jpg`, rasio 4:5. Semakin besar resolusinya semakin tajam.
- Tema baru: salin blok `[data-theme="..."]` di `style.css`, ganti nilai token, lalu panggil lewat `?theme=nama`.
- Bagian baru: pilih perangkat scroll yang belum dipakai bagian di sebelahnya, tentukan satu baris di tabel `WP` untuk jaring, dan tulis rasa yang ingin ditimbulkan sebelum membuat tampilannya.

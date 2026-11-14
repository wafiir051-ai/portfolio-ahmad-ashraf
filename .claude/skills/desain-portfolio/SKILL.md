---
name: desain-portfolio
description: Panduan desain portfolio Ahmad Ashraf (tema gelap kalem, kristal 3D yang mengikuti scroll, efek scroll per bagian). Pakai setiap kali menambah bagian, mengubah tampilan, mengganti warna, atau mengisi konten di situs portfolio ini, supaya semuanya tetap satu gaya.
---

# Desain portfolio Ahmad Ashraf

Situs satu halaman statis: `index.html`, `style.css`, `main.js`, `favicon.svg`, `assets/photo.jpg`. Three.js dimuat dari CDN. Tidak ada build step.

Sebelum mengubah apa pun, baca bagian yang relevan di bawah dan ikuti. Kalau permintaan bertentangan dengan aturan di sini, sebutkan konfliknya dulu ke pengguna.

## Prinsip

1. **Gelap yang kalem.** Latar hitam kehijauan, aksen lembut, tidak silau.
2. **Scroll adalah timeline.** Dua bagian berurutan tidak boleh memakai efek scroll yang sama.
3. **3D secukupnya.** Satu kristal di layer tetap. Tidak ada video, model berat, atau tekstur.
4. **Satu puncak.** Momen paling berkesan ada di bagian Proyek. Bagian lain sengaja lebih tenang.
5. **Beda dari web lama Ahmad.** Jangan pakai bingkai arch untuk foto, titik aksen di belakang nama, strip marquee, atau kartu skill berbentuk chip.

## Warna

Semua warna adalah variabel di `:root` pada `style.css`. Jangan tulis hex langsung di komponen.

| Token | Forest (default) | Dusk | Mocha |
|---|---|---|---|
| `--bg` | `#0c1211` | `#0b1019` | `#110e0d` |
| `--bg-2` | `#121a18` | `#111826` | `#191412` |
| `--text` | `#eef1ec` | `#eceff5` | `#f2ece6` |
| `--muted` | `#98a39e` | `#98a2b5` | `#a59a92` |
| `--accent` | `#86d3b0` | `#82b4f5` | `#eab07c` |
| `--accent2` | `#e9c88f` | `#f2b9a3` | `#d99aa8` |

- Ganti tema lewat URL: `?theme=dusk` atau `?theme=mocha`. Tanpa parameter berarti Forest.
- `--accent` untuk aksi dan sorotan utama; `--accent2` untuk pelengkap (cincin 3D, nilai di terminal).
- Tema baru: salin blok `[data-theme="..."]`, ganti token, panggil lewat `?theme=nama`. Warna 3D dan logo SVG membaca variabel ini otomatis.
- Teks di atas `--accent` memakai `--on-accent`.

## Tipografi

| Peran | Font | Pemakaian |
|---|---|---|
| Display | Bricolage Grotesque 700/800 | Judul dan nama. Letter-spacing rapat (`-.03em` sampai `-.055em`) |
| Teks | Inter 400/500/600 | Paragraf, tombol |
| Mono | JetBrains Mono 400/500 | Label kecil, terminal, tag |

- Nama di hero: `clamp(54px, 12.6vw, 190px)`, satu baris di desktop; kata kedua berupa outline (`-webkit-text-stroke`).
- Judul bagian: `clamp(32px, 4.6vw, 58px)`, line-height 1.04.
- Paragraf berwarna `--muted`, lebar maksimal sekitar 46 sampai 50 karakter.

## Layout

- Gutter samping `clamp(20px, 5vw, 72px)`; lebar konten maksimal 1320px.
- Jarak vertikal antar bagian `clamp(80px, 12vw, 150px)`.
- Radius: kartu 20px, foto 28px, tombol dan chip pil penuh.
- Breakpoint utama 860px: satu kolom, tag proyek disembunyikan, foto mengecil.

## Komponen

- **Logo**: arch bergradasi `--accent` ke `--accent2` berisi huruf A, plus tulisan "ahmad" putih dan "ashraf" abu.
- **Tombol**: pil. `primary` berisi `--accent`; `ghost` hanya bergaris. Hover naik 2px.
- **Terminal "now"**: kartu `--bg-2` opak (bukan transparan), tiga titik jendela, isi mono. Perintah berwarna `--accent`, nilai berwarna `--accent2`.
- **Foto**: 4:5, radius 28px, bingkai garis `--accent` bergeser 18px, tag kecil kiri bawah, gradasi gelap di 30% bawah.
- **Baris proyek**: judul besar + satu kalimat + tag mono + panah. Baris aktif terang, bergeser, bergaris `--accent` di kiri.

## Tata scroll

| Bagian | Perangkat | Yang terjadi |
|---|---|---|
| Hero | parallax belah | Nama terbelah kiri dan kanan, teks memudar |
| Tentang | pin + reveal | Bagian berhenti, foto terbuka dari bawah, kalimat menyala per kata |
| Lagi sibuk apa | reveal | Terminal muncul |
| Skill | pin + pan | Halaman bergeser ke samping, satu panel per kategori |
| Proyek (puncak) | sorotan baris | Kristal pecah jadi tiga, serpihan proyek aktif membesar dan menyala |
| Kontak | reveal | Kristal utuh dan tenang, judul besar sebagai penutup |

Aturan:
- Animasikan hanya `transform` dan `opacity`; wipe memakai `clip-path`. Jangan animasikan `width`, `height`, `top`, `left`.
- Tinggi bagian pin dihitung dari isi (skill: tinggi layar + lebar track), bukan angka tetap.
- `prefers-reduced-motion`: semua pin dimatikan, foto dan kata langsung tampil, kristal tidak berputar.
- Bagian baru: pilih perangkat yang berbeda dari bagian di sebelahnya, tentukan satu baris di tabel `WP` pada `main.js`, dan tulis dulu rasa yang ingin ditimbulkan.

## Objek 3D

- Satu `canvas` tetap di belakang konten (`position: fixed`, `pointer-events: none`).
- Isi: inti ikosahedron bersudut datar, cangkang wireframe tipis, satu cincin, tiga serpihan (satu per proyek).
- Posisi, skala, opasitas, dan tingkat "pecah" per bagian ada di tabel `WP` (`main.js`), dihaluskan saat scroll. Desktop dan mobile punya tabel sendiri; jumlah baris harus sama dengan jumlah bagian di `secs`.
- Anggaran performa: pixel ratio maksimal 1.5, empat lampu, tanpa tekstur, tanpa bayangan, render berhenti saat tab tersembunyi.
- Di bagian dengan banyak teks (skill, kontak) turunkan opasitas kristal supaya teks terbaca.
- Kristal tidak boleh menimpa teks atau kartu. Kalau perlu, pindahkan ke area kosong.
- Kalau WebGL gagal, canvas dibuang dan halaman tetap utuh.

## Larangan

- Tidak ada em dash di teks yang terlihat.
- Tidak ada penghitung bagian (`01 / 04`), isyarat "scroll to explore", atau label kecil di atas setiap judul.
- Tidak ada teks gradien, glow neon, atau overlay gelap penuh untuk menolong kontras; pakai scrim hanya di bawah teks.
- Tidak ada angka karangan atau klaim yang tidak terbukti. Kalau belum ada data, kosongkan atau beri komentar `TODO`.
- Tidak menaruh wajah orang lain di foto publik; kaburkan atau potong.

## Konten

- Bahasa Indonesia santai, kalimat pendek.
- Jurusan ditulis **RPL (Rekayasa Perangkat Lunak)**, bukan "Software Development".
- Proyek dan skill harus sesuai isi repo GitHub Ahmad (`github.com/ahmadasraf2153`): KicksStore (Flutter), Diah Bakery (Laravel), Sanbercode Laravel Web Dev.
- Foto: `assets/photo.jpg`, rasio 4:5.
- Masih kosong: email dan Instagram di bagian Kontak.

## Setelah mengubah

1. Cek di desktop (sekitar 1280px) dan mobile (375px), termasuk tiap posisi scroll yang berubah. Tunggu beberapa detik sebelum menilai, karena kristal dihaluskan.
2. Pastikan tidak ada scroll horizontal.
3. Commit, push, lalu `vercel deploy --prod --yes`. Situs live: `https://portfolio-ahmad-ashraf.vercel.app`.

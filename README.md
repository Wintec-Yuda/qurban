# Aplikasi Pembagian Daging Kurban

Web app untuk mengelola distribusi daging kurban: input total kg daging,
kelola panitia & peserta per group, dan hitung pembagian otomatis berbasis
persentase (default 100%, bisa diedit per individu atau massal).

## Role

- **Ketua** — daftar sendiri lewat `/register` (siapapun bisa jadi Ketua).
  Bisa lihat semua data, daftarkan akun Sekretaris & Ketua Group, aktif/nonaktifkan
  group, dan menandai acara "Selesai" (reset).
- **Sekretaris** — dibuat oleh Ketua. Kelola daftar Panitia, atur total kg,
  dan atur persentase (Panitia & Peserta, individu atau massal per group/panitia).
- **Ketua Group** — dibuat oleh Ketua (1 akun = 1 group baru). Kelola nama
  peserta di groupnya, dan checklist "sudah menerima". Tidak bisa melihat hasil kg.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Salin `.env.example` ke `.env` dan isi dengan koneksi Supabase Postgres kamu
   (Project Settings -> Database -> Connection string):
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` - pakai connection pooler (port 6543, `?pgbouncer=true`)
   - `DIRECT_URL` - koneksi langsung (port 5432), dipakai Prisma saat migrate
   - `AUTH_SECRET` - generate dengan `openssl rand -base64 32`

3. Push schema ke database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Jalankan dev server:
   ```bash
   npm run dev
   ```

5. Buka `http://localhost:3000`, akan diarahkan ke `/login`. Klik "Daftar"
   untuk membuat akun Ketua pertama.

## Alur pemakaian

1. Ketua daftar & login -> daftarkan akun Sekretaris + akun Ketua Group (tiap
   akun Ketua Group otomatis membuat 1 Group baru).
2. Sekretaris login -> tambah nama Panitia, set total kg daging.
3. Setiap Ketua Group login -> input nama-nama peserta di groupnya.
4. Sekretaris bisa menyesuaikan persentase (default semua 100%) per individu
   atau massal per group/panitia bila perlu.
5. Ketua & Sekretaris bisa memantau hasil kg per orang secara real-time.
6. Ketua Group mencentang "sudah menerima" saat daging dibagikan.
7. Setelah acara selesai, Ketua klik "Tandai Selesai & Reset" - ringkasan
   1 kalimat disimpan ke riwayat, total kg & semua persentase & status
   "sudah menerima" direset. Nama-nama, akun, dan status aktif/nonaktif
   group tetap tersimpan untuk acara berikutnya.

## Catatan teknis

- Login pakai NextAuth (Credentials provider), session dibuat "unlimited"
  (maxAge 100 tahun) - cookie akan terus berlaku selama browser tidak
  menghapusnya.
- Supabase di sini hanya dipakai sebagai host Postgres lewat Prisma - fitur
  Supabase Auth/Storage tidak dipakai sama sekali.
- Next.js 16 sudah mengganti `middleware.ts` menjadi `proxy.ts` - file ini
  yang menangani proteksi route per role (lihat `src/proxy.ts`).
- Kalkulasi pembagian ada di `src/lib/calc.ts`:
  `kg_per_orang = (total_kg / total_bobot_persentase) * persentase_orang`.

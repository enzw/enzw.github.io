# WangWang

WangWang adalah aplikasi budgeting dan pencatatan keuangan pribadi berbasis PERN. Pemasukan, pengeluaran, tabungan, budget, wallet, langganan, dan hutang saling terhubung sehingga dashboard selalu dihitung dari transaksi aktual.

## Fitur MVP

- Authentication dengan JWT di HttpOnly cookie
- Wallet virtual (tunai, bank, dan e-wallet)
- Pemasukan utama dan tambahan
- Pengeluaran tetap, variabel, langganan, hutang, dan keinginan
- Riwayat transaksi bulanan
- Budget keseluruhan dan per kategori
- Saving goals dengan planned vs actual saving
- Manajemen langganan dan hutang
- Dashboard responsif dengan donut chart dan bar chart
- Ownership check untuk seluruh data pengguna

## Menjalankan secara lokal

Prasyarat: Node.js 22+, npm, Docker (opsional), dan PostgreSQL.

1. Jalankan PostgreSQL:

   ```bash
   docker compose up -d
   ```

2. Siapkan backend:

   ```bash
   cd server
   copy .env.example .env
   npm install
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   npm run dev
   ```

3. Di terminal lain, jalankan frontend:

   ```bash
   cd client
   copy .env.example .env
   npm install
   npm run dev
   ```

Frontend tersedia di `http://localhost:5173` dan API di `http://localhost:4000`.

## Perhitungan utama

```text
Available Balance       = Income - Expenses - Actual Saving
Planned Remaining Money = Income - Expenses - Planned Saving
Safe Spending Per Day   = Planned Remaining Money / Remaining Days
```

Nilai ringkasan tidak diduplikasi di database; semuanya diturunkan dari transaksi pada bulan terpilih.

## Validasi

```bash
cd client && npm run build && npm run lint
cd server && npm run prisma:generate && npm run build
```

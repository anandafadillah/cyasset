# Deploy CyAsset ke VM Ubuntu Server (Proxmox) + Cloudflare Tunnel

Panduan step-by-step deploy CyAsset ke VM Ubuntu Server polos di Proxmox sekolah, diakses publik lewat Cloudflare Tunnel di domain `cyasset.cybermedia.sch.id`. Semua langkah sudah diverifikasi lewat build & run Docker sungguhan (bukan cuma dari `next dev`) — dua bug produksi (NextAuth `UntrustedHost`, dan `npm ci` gagal karena versi npm) sudah ditemukan & diperbaiki di source code sebelum panduan ini ditulis, jadi seharusnya tidak ada perbaikan tambahan yang perlu dilakukan di server.

**Arsitektur:** Docker Compose (app Next.js + PostgreSQL) di VM, tidak ada port yang dibuka ke internet sama sekali — `cloudflared` (native, systemd) bikin koneksi keluar (outbound) ke Cloudflare, lalu Cloudflare meneruskan trafik `https://cyasset.cybermedia.sch.id` ke `cloudflared`, yang meneruskannya ke `localhost:3000` di VM.

```
Internet → Cloudflare Edge (TLS) → cloudflared (outbound tunnel) → localhost:3000 (Docker) → app ↔ db
```

---

## 0. Prasyarat

- VM Ubuntu Server (22.04/24.04) sudah jalan di Proxmox, bisa diakses SSH, punya akses internet keluar (outbound).
- Akses SSH ke VM dengan user yang punya hak `sudo`.
- Akses ke dashboard Cloudflare untuk zona `cybermedia.sch.id` (sudah pakai Cloudflare sebagai nameserver).
- Repo `https://github.com/anandafadillah/cyasset` (publik, tidak perlu kredensial untuk clone).

---

## 1. Update sistem & install dependency dasar

SSH ke VM, lalu:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw
```

---

## 2. Install Docker Engine + Compose plugin

Ikuti cara resmi Docker (bukan `docker.io` bawaan apt Ubuntu, yang sering versinya ketinggalan):

```bash
# Tambah GPG key & repo resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Izinkan user saat ini menjalankan Docker tanpa `sudo` (perlu logout/login ulang atau `newgrp docker` supaya berlaku):

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Verifikasi:

```bash
docker --version
docker compose version
```

---

## 3. Clone repo

```bash
sudo mkdir -p /opt/cyasset
sudo chown $USER:$USER /opt/cyasset
git clone https://github.com/anandafadillah/cyasset.git /opt/cyasset
cd /opt/cyasset
```

Semua perintah selanjutnya dijalankan dari `/opt/cyasset` kecuali disebutkan lain.

---

## 4. Buat & isi file `.env` produksi

```bash
cp .env.production.example .env
nano .env   # atau editor lain
```

Isi tiap nilai `<GANTI-...>`:

| Variabel | Cara isi |
|---|---|
| `POSTGRES_PASSWORD` | Generate baru: `openssl rand -base64 24` — **jangan** pakai password dev `cyasset`. |
| `DATABASE_URL` | Samakan password-nya dengan `POSTGRES_PASSWORD` di atas (format sudah benar di template, host `db`, tinggal ganti password). |
| `AUTH_SECRET` | Generate baru khusus produksi: `npx auth secret` (atau `openssl rand -base64 32`) — **jangan** pakai secret dari `.env` dev. |
| `APP_URL` | `https://cyasset.cybermedia.sch.id` (sudah benar di template). |
| `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_EMAIL` | Data Admin Sarpras yang akan login pertama kali. |
| `ADMIN_PASSWORD` | Password kuat, **beda dari password contoh `sarpras123` di source code**. Modul Akun Staf belum punya fitur ubah password sendiri, jadi pastikan password ini yang benar-benar dipakai sejak awal. |

> **Penting:** `.env` ini berisi secret asli, sudah otomatis diabaikan git (`.gitignore`) — jangan pernah di-commit.

---

## 5. Build & jalankan stack

Siapkan dulu folder upload di host dengan ownership yang cocok dengan user `nextjs` (uid 1001) di dalam container — folder ini di-*bind mount* lewat `docker-compose.prod.yml`, jadi ownership host-lah yang berlaku saat runtime, bukan `chown` di Dockerfile:

```bash
mkdir -p uploads
sudo chown -R 1001:1001 uploads
```

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Ini akan:
1. Build image `app` (Next.js, `next start` — bukan mode standalone, supaya foto yang di-upload user setelah build tetap tersaji dengan benar).
2. Jalankan container `db` (Postgres 16), tunggu sampai *healthy*.
3. Jalankan container `app`, bind ke `127.0.0.1:3000` (tidak ke-expose ke LAN/internet).

Cek status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

Tunggu sampai log menunjukkan `✓ Ready` lalu `Ctrl+C` untuk keluar dari `logs -f` (container tetap jalan di background).

---

## 6. Jalankan migrasi database

```bash
docker compose -f docker-compose.prod.yml run --rm tools db:migrate
```

Harus berakhir dengan `[✓] migrations applied successfully!`.

---

## 7. Buat akun Admin Sarpras pertama

```bash
docker compose -f docker-compose.prod.yml run --rm tools db:seed
```

Perintah ini otomatis membaca `ADMIN_USERNAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` dari `.env` (langkah 4) — bukan password contoh dari source code. Kalau berhasil akan muncul:

```
Akun Admin Sarpras awal berhasil dibuat:
  Username : <ADMIN_USERNAME Anda>
  Email    : <ADMIN_EMAIL Anda>
```

(Password tidak ditampilkan di log karena sudah di-set lewat env var — bukan nilai default.)

---

## 8. Verifikasi aplikasi jalan lokal di VM

```bash
curl -I http://localhost:3000/login
```

Harus menampilkan `HTTP/1.1 200 OK`. Kalau tidak, cek `docker compose -f docker-compose.prod.yml logs app`.

---

## 9. Setup firewall (UFW)

Karena Cloudflare Tunnel cuma bikin koneksi keluar (outbound), VM **tidak perlu buka port inbound apapun** ke internet — port `3000` cuma di-bind ke `127.0.0.1` (langkah 5). UFW di sini murni lapisan pengaman tambahan:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH   # atau: sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status verbose
```

> Pastikan aturan `OpenSSH`/port 22 sudah masuk **sebelum** `ufw enable`, supaya sesi SSH Anda saat ini tidak terputus.

---

## 10. Install `cloudflared`

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
cloudflared --version
```

---

## 11. Login ke Cloudflare & buat Tunnel

```bash
cloudflared tunnel login
```

Perintah ini menampilkan URL — buka di browser manapun (boleh dari komputer lain, tidak harus di VM), login ke akun Cloudflare yang punya akses ke zona `cybermedia.sch.id`, lalu pilih domain tersebut untuk otorisasi. Setelah berhasil, file kredensial tersimpan di `~/.cloudflared/cert.pem` di VM.

Buat tunnel baru:

```bash
cloudflared tunnel create cyasset
```

Catat **Tunnel ID** yang muncul (juga tersimpan sebagai file JSON di `~/.cloudflared/<TUNNEL_ID>.json`) — dipakai di langkah berikutnya.

---

## 12. Buat file konfigurasi tunnel

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Isi (ganti `<TUNNEL_ID>` dengan ID dari langkah 11, dan `<USER>` dengan username VM Anda):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/<USER>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: cyasset.cybermedia.sch.id
    service: http://localhost:3000
  - service: http_status:404
```

---

## 13. Arahkan DNS domain ke Tunnel

```bash
cloudflared tunnel route dns cyasset cyasset.cybermedia.sch.id
```

Ini otomatis membuat record CNAME `cyasset.cybermedia.sch.id` → `<TUNNEL_ID>.cfargotunnel.com` di dashboard Cloudflare zona `cybermedia.sch.id`.

---

## 14. Tes tunnel secara manual dulu

```bash
cloudflared tunnel run cyasset
```

Biarkan jalan di foreground, lalu dari **komputer/HP lain** (bukan VM) buka `https://cyasset.cybermedia.sch.id/login` di browser — harus muncul halaman login CyAsset. Kalau sudah berhasil, tekan `Ctrl+C` untuk hentikan proses manual ini.

---

## 15. Jalankan `cloudflared` sebagai systemd service (auto-start)

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

`cloudflared service install` otomatis memakai `~/.cloudflared/config.yml` yang sudah dibuat di langkah 12. Cek log kalau perlu:

```bash
journalctl -u cloudflared -f
```

---

## 16. Pastikan Docker Compose auto-start saat VM reboot

```bash
sudo systemctl enable docker
```

Semua service di `docker-compose.prod.yml` sudah punya `restart: unless-stopped`, jadi begitu Docker daemon jalan (otomatis saat boot berkat perintah di atas), container `db` dan `app` otomatis ikut jalan lagi tanpa perlu `docker compose up` manual.

---

## 17. Setup backup database otomatis

```bash
chmod +x scripts/backup-db.sh
crontab -e
```

Tambahkan baris ini (jalan tiap hari jam 02:00):

```cron
0 2 * * * CYASSET_DIR=/opt/cyasset /opt/cyasset/scripts/backup-db.sh >> /opt/cyasset/backups/backup.log 2>&1
```

Dump tersimpan di `/opt/cyasset/backups/cyasset-<timestamp>.sql.gz`, retensi otomatis 7 hari. Tes manual sekali:

```bash
mkdir -p /opt/cyasset/backups
./scripts/backup-db.sh
```

---

## 18. Verifikasi akhir

- [ ] `https://cyasset.cybermedia.sch.id/login` bisa dibuka dari luar jaringan sekolah (mis. dari HP pakai data seluler), tampil halaman login CyAsset.
- [ ] Login dengan akun Admin Sarpras yang dibuat di langkah 7 berhasil masuk ke Dashboard.
- [ ] Buat 1 data Gedung/Lantai/Ruang lewat menu Lokasi, lalu tambah 1 Barang dengan foto — pastikan foto tampil di halaman Detail Barang (membuktikan upload & static file serving bekerja).
- [ ] Cetak QR barang tersebut, scan dari HP (jaringan seluler, bukan wifi sekolah) — harus terbuka halaman card publik `https://cyasset.cybermedia.sch.id/s/barang/...` **tanpa** diminta login.
- [ ] `sudo reboot` VM, tunggu VM menyala kembali, cek `docker compose -f /opt/cyasset/docker-compose.prod.yml ps` dan `systemctl status cloudflared` — semua harus otomatis jalan lagi tanpa perintah manual.

---

## Update aplikasi ke versi terbaru (redeploy)

Setiap ada perubahan baru di repo GitHub:

```bash
cd /opt/cyasset
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build app
docker compose -f docker-compose.prod.yml run --rm tools db:migrate
```

`db` tidak perlu di-restart (datanya persisten di volume `cyasset_pgdata`). Kalau ada migrasi skema baru, langkah `db:migrate` di atas akan menerapkannya (aman dijalankan berkali-kali — migrasi yang sudah diterapkan otomatis dilewati).

---

## Troubleshooting

**App tidak bisa diakses dari `https://cyasset.cybermedia.sch.id` tapi `curl localhost:3000` di VM berhasil:**
Cek `journalctl -u cloudflared -f` — biasanya `config.yml` salah path/Tunnel ID, atau DNS belum ke-propagate (tunggu beberapa menit setelah langkah 13).

**Login gagal terus / redirect balik ke `/login`:**
Cek `docker compose -f docker-compose.prod.yml logs app | grep -i auth` — kalau ada `UntrustedHost`, berarti kode di server belum versi terbaru (`git pull` lagi, `src/lib/auth.ts` harus punya `trustHost: true`).

**Foto barang/prasarana tidak muncul (404) padahal baru di-upload:**
Cek image di server dibuat dari Dockerfile yang **tidak** memakai `output: "standalone"` (lihat `next.config.ts` — komentarnya menjelaskan kenapa). Kalau `next.config.ts` versi lama (standalone) ke-pull entah bagaimana, foto lama akan tetap 404 walau sudah rebuild — perlu `git pull` dari `main` yang sudah berisi perbaikan ini.

**`docker compose run --rm tools db:migrate` gagal "connection refused":**
Container `db` belum *healthy*. Jalankan `docker compose -f docker-compose.prod.yml ps` — tunggu status `db` jadi `healthy`, baru ulangi.

**Upload foto gagal / error `EACCES: permission denied, mkdir '/app/public/uploads/...'` atau `.next/cache/images`:**
Folder `uploads` di host tidak dimiliki uid yang sama dengan user `nextjs` (1001) di dalam container — bind mount membawa ownership host apa adanya, jadi `chown` di image (Dockerfile) tidak berlaku untuk folder ini. Perbaiki:
```bash
sudo chown -R 1001:1001 /opt/cyasset/uploads
docker compose -f docker-compose.prod.yml restart app
```
Kalau errornya ada di `.next/cache/images` (bukan `uploads`), berarti image lama (`COPY` tanpa `--chown`) masih dipakai — `git pull` lalu `docker compose -f docker-compose.prod.yml up -d --build app` untuk rebuild dengan Dockerfile terbaru.

**Perlu masuk ke database langsung (debug manual):**
```bash
docker compose -f docker-compose.prod.yml exec db psql -U cyasset -d cyasset
```

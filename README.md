# Realtime Chat (WhatsApp-style) — Nomor HP + OTP Fonnte, siap Vercel

Daftar/masuk memakai **nomor HP + OTP WhatsApp (Fonnte)**. Realtime memakai **polling** (pesan 3 dtk, daftar chat 5 dtk)
karena Vercel tidak mendukung WebSocket/Socket.io.

## Deploy ke Vercel (2 project dari 1 repo)
1. **Backend**: import repo, Root Directory = `server`. Environment Variables:
   `URL` (MongoDB Atlas), `SECRET`, `FONNTE_TOKEN`, `BASE_URL` (URL frontend, tanpa `/` di akhir).
2. **Frontend**: import repo, Root Directory = `clients`. Environment Variable:
   `REACT_APP_SERVER_URL` = URL backend Vercel (tanpa `/` di akhir).
3. Di MongoDB Atlas > Network Access, izinkan `0.0.0.0/0` (Vercel memakai IP dinamis).
4. Di Fonnte pastikan device WhatsApp berstatus *connected*.

## Lokal
```
cd server && cp .env.example .env && npm i && npm start
cd clients && cp .env.example .env && npm i && npm start
```

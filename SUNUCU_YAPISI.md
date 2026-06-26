# 🖥 AOF Notlar — Sunucu Yapısı ve Çalışma Rehberi

> Kapsamlı sistem dokümantasyonu — 24 Mayıs 2026

---

## 📦 1. GENEL MİMARİ

```
Kullanıcı (Browser)
    │
    ▼
Caddy (Web Server / Reverse Proxy) — Docker Container
    │  port 80 (HTTP) → 443 (HTTPS) otomatik SSL
    │
    ├── /api/* → Node.js (Express) → PostgreSQL
    │               port 3001
    │
    └── /* → Statik dosyalar (/var/www/aofnotlar/frontend/build/)
                ├── index.html (ana site)
                ├── admin.html (admin paneli)
                └── diğer statik assetler
```

### Bileşenler:
| Bileşen | Teknoloji | Port |
|---------|-----------|------|
| Web Server | **Caddy** (Docker) | 80/443 |
| Backend API | **Node.js + Express** (pm2) | 3001 |
| Veritabanı | **PostgreSQL** | 5432 |
| Frontend | **React** (build) | Statik dosya |
| Tunnel | **Cloudflare Tunnel** (Docker) | - |

---

## 🐳 2. DOCKER YAPISI

### Çalışan Container'lar:
```bash
docker ps
```

| Container | İmaj | Görevi |
|-----------|------|--------|
| n8n-caddy-1 | caddy:latest | Web server, SSL, reverse proxy |
| cloudflared-tunnel | cloudflare/cloudflared | Cloudflare tünel |
| n8n-n8n-1 | n8nio/n8n:latest | n8n otomasyon (şu an kullanılmıyor) |

### Caddy Config (Caddyfile):
```caddyfile
aofnotlar.com, www.aofnotlar.com {
    handle /api/* {
        reverse_proxy 172.17.0.1:3001
    }
    handle {
        root * /var/www/aofnotlar/frontend/build
        file_server
        try_files {path} /index.html
    }
}
```

**Önemli:** Caddy Docker container içinde çalıştığı için `reverse_proxy` hedefi `172.17.0.1:3001` (host makinenin Docker bridge IP'si). Localhost değil!

---

## 📁 3. KLASÖR YAPISI

```
/var/www/aofnotlar/
│
├── server.js              # Express backend (ana uygulama)
├── App.js                 # React frontend kaynak kodu
├── aofnotlar-admin.html   # Admin paneli HTML (kaynak)
├── deploy.sh              # Deploy scripti
├── package.json           # Backend bağımlılıkları
├── .env                   # Ortam değişkenleri (GİZLİ!)
├── .gitignore             # Git'ten hariç tutulanlar
│
├── node_modules/          # Backend bağımlılıkları
│
├── frontend/
│   ├── src/
│   │   └── App.js         # React kaynak (deploy.sh kopyalar)
│   ├── package.json
│   ├── node_modules/
│   └── build/             # React build çıktısı (Caddy'nin root'u)
│       ├── index.html     # Ana site
│       ├── admin.html     # Admin paneli (deploy.sh kopyalar)
│       └── static/        # Derlenmiş JS/CSS
│
└── teknikdosyalar/        # (Mac'teki yerel repo)
```

---

## 🔐 4. ORTAM DEĞİŞKENLERİ (.env)

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aofnotlar
DB_USER=aofuser
DB_PASSWORD=Crawl1nq.223
JWT_SECRET=aofnotlarserdar123
ADMIN_PASSWORD=aof2024admin
```

**⚠️ ÖNEMLİ:** `.env` dosyası `.gitignore`'da olduğu için `git pull` yapınca **silinmez**. Ama `deploy.sh` çalıştırılırken `npm install --production` dotenv'i güncellerse sorun çıkabilir. Eğer server `port undefined` hatası verirse, `.env` dosyasının hala var olduğunu kontrol edin.

---

## 🚀 5. DEPLOY SÜRECİ

### deploy.sh (sunucuda):
```bash
#!/bin/bash
set -e

echo "🚀 Deploy başlıyor..."
cd /var/www/aofnotlar

echo "📥 Git pull..."
git pull origin main

echo "📦 Backend bağımlılıkları..."
npm install --production

echo "📋 App.js frontend'e kopyalanıyor..."
cp /var/www/aofnotlar/App.js /var/www/aofnotlar/frontend/src/App.js

echo "🔨 Frontend build..."
cd frontend
npm install
npm run build
cd ..

echo "♻️ PM2 restart..."
pm2 restart aofnotlar

echo "✅ Deploy tamamlandı!"
cp /var/www/aofnotlar/aofnotlar-admin.html /var/www/aofnotlar/frontend/build/admin.html
```

### Günlük deploy:
```bash
# Mac'te:
cd /Users/serdarkilinc/Desktop/Website/teknikdosyalar
git add .
git commit -m "yaptığın değişiklik"
git push origin main

# Sunucuda (SSH):
ssh root@65.109.231.71
cd /var/www/aofnotlar && bash deploy.sh
```

---

## 🔄 6. PM2 (PROCESS MANAGER)

### Temel komutlar:
```bash
pm2 list                    # Çalışan process'leri göster
pm2 status                  # Detaylı durum
pm2 logs aofnotlar          # Logları göster
pm2 logs aofnotlar --lines 50  # Son 50 satır log
pm2 restart aofnotlar       # Yeniden başlat
pm2 delete aofnotlar        # Sil
pm2 start server.js --name aofnotlar  # Başlat
pm2 save                    # Config'i kaydet (reboot sonrası için)
```

### Log dosyaları:
```bash
/root/.pm2/logs/aofnotlar-out.log    # Standart çıktı
/root/.pm2/logs/aofnotlar-error.log  # Hata logları
```

---

## 🌐 7. CADDY (WEB SERVER)

Caddy, Docker container içinde çalışır. Nginx **kullanılmıyor** (eski config var ama çalışmıyor).

### Caddy'yi yeniden başlatma:
```bash
docker restart n8n-caddy-1
```

### Caddy config'i görüntüleme:
```bash
docker exec n8n-caddy-1 cat /etc/caddy/Caddyfile
```

### Caddy logları:
```bash
docker logs n8n-caddy-1
```

---

## 🗄 8. POSTGRESQL VERİTABANI

### Bağlantı:
```bash
psql -h localhost -U aofuser -d aofnotlar
# Şifre: Crawl1nq.223
```

### Önemli tablolar:
```sql
\dt                     # Tüm tabloları listele
\d questions            # Tablo yapısını gör
SELECT * FROM categories;
SELECT * FROM questions LIMIT 10;
```

### Migration çalıştırma:
```bash
psql -h localhost -U aofuser -d aofnotlar -f migrate5.sql
```

---

## 🔧 9. SIK KARŞILAŞILAN SORUNLAR

### ❌ Admin paneli giriş yapmıyor ("tık yok")
**Sebep:** JavaScript syntax hatası (genelde escape karakter sorunu)
**Çözüm:** Tarayıcıda F12 → Console sekmesinde hatayı bul, düzelt, deploy et.

### ❌ 502 Bad Gateway
**Sebep:** Node.js server çalışmıyor veya `.env` okunamıyor
**Çözüm:**
```bash
pm2 logs aofnotlar --lines 20
# "port undefined" görürsen → .env dosyasını kontrol et
# "Cannot find module" görürsen → server.js var mı kontrol et
pm2 delete aofnotlar && pm2 start server.js --name aofnotlar
```

### ❌ "column ds.score does not exist"
**Sebep:** Veritabanında eksik kolon (eski migration)
**Çözüm:** Gerekli migration'ı çalıştır veya sorguyu düzelt.

### ❌ Nginx başlatılamıyor (port 80 dolu)
**Sebep:** Port 80/443 zaten Caddy (Docker) tarafından kullanılıyor
**Durum:** NORMAL — Caddy kullanılıyor, nginx'e gerek yok.

---

## 📝 10. ÖNEMLİ NOTLAR

1. **Admin paneli URL'si:** `https://aofnotlar.com/admin.html` (deploy.sh `admin.html` olarak kopyalar)
2. **Admin şifresi:** `.env` dosyasındaki `ADMIN_PASSWORD`
3. **Frontend build:** React build alınır, Caddy statik dosya olarak servis eder
4. **API istekleri:** `/api/*` Caddy tarafından `localhost:3001`'e yönlendirilir
5. **Docker ağı:** Caddy container'ı host'a `172.17.0.1` üzerinden bağlanır
6. **Git repo:** `https://github.com/serdark32/aofnotlar.git`
7. **Sunucu IP:** `65.109.231.71` (Hetzner)
8. **SSH:** `ssh root@65.109.231.71` (Şifre: `LxPncfRgdT9g`)

---

## 🧪 11. HIZLI TEST KOMUTLARI

```bash
# Server çalışıyor mu?
curl -s http://localhost:3001/api/categories | head -50

# Admin login test
curl -s http://localhost:3001/api/admin/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"password":"aof2024admin"}'

# Caddy çalışıyor mu?
docker ps | grep caddy

# Disk kullanımı
df -h

# PM2 durumu
pm2 status
```

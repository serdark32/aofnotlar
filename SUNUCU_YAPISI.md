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
8. **SSH:** `ssh root@65.109.231.71` (Şifre: `.env` veya SSH key kullanın)

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

---

# 🧾 SHOPIER OTOMATİK TESLİMAT SİSTEMİ

> Eklendi: 15 Ağustos 2026

Shopier'den satış olduğunda, sipariş mailini yakalayıp PDF'e alıcıya özel filigran
basar ve müşteriye **otomatik** mail atar. Telegram'a bilgi amaçlı bildirim düşer.

> 16 Ağustos 2026'da onay adımı (human-in-the-loop) kaldırıldı; gerekçe ve
> değişiklikler bölüm 3.1'de.

## 1. AKIŞ

```
Shopier satışı
    │
    ▼  "Yeni bir siparişiniz var!" maili → serdar.n8n@gmail.com
    │
n8n workflow (novantera.com)
    │
    ├── Maili ayrıştır (ad soyad, e-posta, telefon, ürün, sipariş no)
    │      └── ayrıştırılamazsa → Telegram uyarısı, DUR
    │
    ├── Filigran servisi (172.19.0.1:3002)
    │      └── ürün eşleşmezse veya servis düşükse → Telegram uyarısı, DUR
    │
    ├── Mükerrer mi? (aynı sipariş+ürün daha önce gittiyse DUR)
    │
    ├── SMTP ile müşteriye mail (aofseslinotlar@gmail.com'dan)
    │      └── gönderilemezse → Telegram uyarısı
    │
    └── Telegram'a "✅ Teslim Edildi" bildirimi (butonsuz, sadece bilgi)
```

**Önemli:** İnsan onayı yok, teslimat otomatik. Buna karşılık her hata noktasında
iş **durur** ve Telegram'a uyarı düşer — hatalı veriyle asla mail gitmez.
Gece gelen sipariş anında teslim edilir.

## 2. FİLİGRAN SERVİSİ

| | |
|---|---|
| Konum | `/var/www/watermark/` |
| Adres | `http://172.19.0.1:3002` (Docker bridge — **internete kapalı**) |
| Process | pm2 → `watermark-api` (`pm2 save` yapıldı, reboot'ta gelir) |
| Python | `/var/www/watermark/venv` (pymupdf, flask, waitress) |
| Font | `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` |
| PDF'ler | `/var/www/watermark/shopier-pdfler-a4/` (8 dosya, ~16 MB) |

**Neden 127.0.0.1 değil:** n8n Docker container içinde çalışıyor, onun için
`127.0.0.1` kendisi demek. Host'a `n8n_n8n-network` ağının gateway'i olan
`172.19.0.1` üzerinden ulaşıyor. (Caddy'nin `172.17.0.1` kullanmasıyla aynı mantık.)

### Dosyalar
```
/var/www/watermark/
├── app.py                 # Flask servisi
├── watermark.py           # PyMuPDF ile filigran basan asıl kod
├── ecosystem.config.js    # pm2 yapılandırması (env değişkenleri burada)
├── a4-uret.py             # HTML → A4 PDF üretici (sunucuda ÇALIŞMAZ, Chrome yok)
├── venv/
├── shopier-pdfler-a4/     # TESLİMATTA KULLANILAN dosyalar (A4 sayfalanmış)
└── shopier-pdfler/        # eski tek-dev-sayfa sürümler, artık kullanılmıyor
```

Kaynak kopyalar Mac'te: `~/Desktop/AOF/SKVT/`

### API

```bash
# Sağlık kontrolü
curl -s http://172.19.0.1:3002/health

# Filigran bas
curl -s -o cikti.pdf -X POST http://172.19.0.1:3002/watermark \
  -H "Content-Type: application/json" \
  -d '{"product_title":"Sayısal Karar Verme Teknikleri (21 Sayfa)",
       "name":"Ahmet Yılmaz","email":"a@b.com",
       "phone":"+90 555 111 22 33","order":"339819966"}'
```

`product_title` (mailden gelen ham başlık) veya `product` (ürün kodu) verilebilir.
Eşleşme bulunamazsa **422** döner ve iş durur — sessizce yanlış PDF gönderilmez.

### Ürün eşleştirme

Mailden gelen başlıkta ayırt edici ifade aranır (`app.py` → `TITLE_RULES`):

| Başlıkta geçen | Ürün kodu | PDF | Tam ders adı |
|---|---|---|---|
| sayısal karar | `skvt` | SKVT-Sinav-Sozlugu | Sayısal Karar Verme Teknikleri |
| insan kaynak | `iky` | IKY-Kavram-Sozlugu | İnsan Kaynakları Yönetimi |
| sosyal güvenlik | `issgh` | Is-ve-Sosyal-Guvenlik-Hukuku | İş ve Sosyal Güvenlik Hukuku |
| küresel pazarlama | `kuresel-pazarlama` | Kuresel-Pazarlama | Küresel Pazarlama |
| pazarlama yönetimi | `pazarlama-yonetimi` | Pazarlama-Yonetimi | Pazarlama Yönetimi |
| örgütsel davranış | `orgutsel-davranis` | Orgutsel-Davranis | Örgütsel Davranış |
| türkiye ekonomisi | `turkiye-ekonomisi` | Turkiye-Ekonomisi | Türkiye Ekonomisi |
| finansal yönetim | `finansal-yonetim` | Finansal-Yonetim-1 | Finansal Yönetim 1 |

Yeni ürün eklerken **üç yeri** güncelle: `watermark.py` → `PRODUCTS`,
`watermark.py` → `PRODUCT_TITLES` ve `app.py` → `TITLE_RULES`.
Sonra `pm2 restart watermark-api`.

### Dosya adı

Müşteriye giden ek `Sayısal Karar Verme Teknikleri - Ders Notu.pdf` şeklinde
adlandırılır (eskiden `skvt-ahmet-yilmaz.pdf` gibi kod adları gidiyordu). İki
yerden garantiye alınıyor:

1. Servis `Content-Disposition`'da `filename*=UTF-8''...` ile tam adı döner
2. `Mükerrer mi?` node'u ek adını mailden gelen ürün başlığından tekrar yazar
   (`(21 Sayfa)` gibi parantezli kısım atılır) — n8n ASCII yedeğine düşerse
   Türkçe harfler kaybolmasın diye

### Filigran içeriği

Her sayfaya çapraz tekrarlayan mini damga + üstte bir kez belirgin başlık:
```
Ad Soyad · e-posta · telefon · sipariş no
BU KOPYA <AD SOYAD> ADINA SATILMIŞTIR — DAĞITILAMAZ
```

**Font notu:** Helvetica (base14) Latin-1 ile sınırlı olduğu için Türkçe
`Ş ş Ğ ğ İ ı` harflerini düşürüyordu ("Şeyma" → "·eyma"). Bu yüzden DejaVuSans
TTF gömülüyor. Font bulunamazsa servis `/health`'te `ok: false` döner.

## 2.1 A4 SAYFALAMA (17 Ağustos 2026)

**Sorun:** ilk sürümde PDF'ler **tek dev sayfaydı** — genişlik A4 (21 cm) ama boy
1,8 m ile 5,7 m arası. Yazıcı tek sayfayı tek kağıda sığdırmaya çalıştığı için
öğrenciler yazdıramıyordu, şikayet geldi.

**Çözüm:** kaynak HTML'lerden A4 sayfalanmış sürümler üretildi. Tek-sayfa sürüm
teslimattan çıkarıldı (karar: tek dosya gitsin, kimse tek-sayfa beklemiyor ama
yazdırma beklentisi var).

### Üretim

`~/Desktop/AOF/SKVT/a4-uret.py` — **Mac'te çalışır**, headless Chrome kullanır.
Sunucuda Chrome yok, orada üretim yapılmaz; PDF'ler Mac'te üretilip `scp` ile atılır.

```bash
cd ~/Desktop/AOF/SKVT
python3 a4-uret.py yeni-html/IKY_Kavram_Sozlugu.html shopier-pdfler-a4/IKY-A4.pdf
scp shopier-pdfler-a4/*.pdf aofsrv:/var/www/watermark/shopier-pdfler-a4/
```

**Kaynak HTML'lere dokunulmaz.** Betik `</head>` öncesine bir baskı katmanı
enjekte edip geçici dosyayı bastırır. Katmanın yaptıkları:

| Kural | Neden |
|---|---|
| `@page { size: A4; margin: 12mm 11mm }` | HTML'de `size: 210mm 5710mm` yazıyor — dev sayfanın sebebi bu |
| `.page { min-height: 0; padding: 0 }` | 297mm min-height boş sayfa üretiyor; padding sadece belgenin başına/sonuna uygulanıp aradaki sayfaları kenarsız bırakıyor |
| `.doc-footer { position: static }` | `yeni-html/` altındaki **6 dosyanın hepsinde** footer `fixed` — baskıda sabit kalıp metnin üstüne biniyor, ayrıca `counter(page)` çalışmayıp "Sayfa 0" yazıyor |
| `.card { break-inside: auto }` | Kart bölünmesini yasaklayınca SKVT 23→28, İKY 10→12 sayfaya çıkıyor. Bölünmeye izin verilip kırılma `.block` arasına zorlanıyor |
| `.card { overflow: visible }` | `overflow: hidden` + sayfa kırılması içeriği kırpıyor |
| `print-color-adjust: exact` | Renkli başlıklar ve zeminler baskıda kaybolmasın |

Chrome'un kendi başlık/altlığını (tarih, dosya yolu) kapatmak için
`--no-pdf-header-footer` şart, yoksa her sayfaya damgalıyor.

### Sayfa sayıları

| Ders | Sayfa | Boyut |
|---|---|---|
| Finansal Yönetim 1 | 33 | 3,5 MB |
| SKVT | 23 | 3,4 MB |
| Örgütsel Davranış | 14 | 1,9 MB |
| Pazarlama Yönetimi | 13 | 1,8 MB |
| İKY | 10 | 1,5 MB |
| Türkiye Ekonomisi | 10 | 1,5 MB |
| İş ve Sosyal Güvenlik | 8 | 1,3 MB |
| Küresel Pazarlama | 7 | 1,1 MB |

### Filigranın konumu

A4'e geçince filigranın kırmızı başlığı (`BU KOPYA ... ADINA SATILMIŞTIR`) her
sayfanın içeriğinin üstüne biniyordu — tek dev sayfada orası boş bir tepeydi.
`watermark.py` artık sayfa boyuna bakıyor:

- **h > 1500pt** (eski tek dev sayfa) → damga sayfanın en üstüne, eski davranış
- **h ≤ 1500pt** (A4) → damga alt kenar boşluğuna (12mm), içerik oraya hiç girmiyor

Çapraz tekrarlayan mini damgalar her iki durumda da aynı, sayfa sayısı kadar tekrarlanır.

## 3. N8N WORKFLOW

| | |
|---|---|
| Ad | `Shopier → Filigran → Otomatik Teslimat` |
| ID | `F5BZFJqOxpeCC3Uu` |
| Adres | https://novantera.com |
| Node sayısı | 10 |

### Credential'lar

| Ne için | Credential | Hesap |
|---|---|---|
| Mail okuma | `serdar.n8n` (Gmail OAuth2) | serdar.n8n@gmail.com |
| Mail gönderme | `SMTP account 2` | aofseslinotlar@gmail.com |
| Bildirim | `stratejist` (Telegram) | @str_asistan_001_bot |

Telegram chat ID: `1229312854`

### Gmail trigger filtresi

`Shopier Maili` node'unda **sadece `Search` filtresi** olmalı:

```
from:hello@shopier.com OR (subject:"TEST SIPARIS" (from:serdark32@gmail.com OR from:serdar.n8n@gmail.com))
```

⚠️ **`Sender` filtresi EKLEME.** n8n `Sender` ve `Search`'ü VE ile birleştirir;
ikisi birden doluysa ya gerçek siparişler ya da testler kaçar.

### 3.1 Onay adımı neden kaldırıldı (16 Ağustos 2026)

Kurulumda Telegram'dan `[✅ Gönder] [❌ İptal]` onayı isteniyordu. Kaldırıldı, çünkü:

- **Onay gerçek bir kontrol değildi.** Gelen her sipariş incelenmeden onaylanıyordu.
- **Riskler zaten önce yakalanıyor.** Mail ayrıştırılamazsa, e-posta geçersizse veya
  ürün eşleşmezse akış onay adımına gelmeden duruyor ve uyarı gönderiyor.
- **Gecikme müşteriye yansıyordu.** Gece/uygunsuz saatte gelen sipariş sabaha kalıyordu.

**Çift mail sorununun sebebi de buydu.** Execution kayıtları, her sipariş için Gmail
tetiğinin **tek** ama onay webhook'unun **iki-üç kez** çalıştığını gösterdi — yani
butona birden fazla dokunuluyordu (buton basıldıktan sonra ekranda kalıyor):

| Sipariş | Gmail tetiği | Onay webhook'u |
|---|---|---|
| 977232157 | 1 | 2 (aynı ürün, 12 sn arayla) |
| 212377786 | 1 | 2 |
| 340253067 | 1 | 2 |

Kaldırılan node'lar: `Onay İste`, `Onay Butonu`, `Onayı Ayrıştır`, `Gönder mi?`,
`Filigranı Yeniden Üret`, `Telegram: İptal`, `Uyarı: Yeniden Üretilemedi`.

Eklenen node'lar:

| Node | İşi |
|---|---|
| `Mükerrer mi?` (Code) | Aynı `sipariş no + ürün` ikinci kez gelirse akışı keser |
| `Telegram: Teslim Edildi` | Butonsuz bilgi mesajı (kim, ne, hangi mail) |

⚠️ `Telegram: Teslim Edildi` node'unda alanlar `$json` ile **okunamaz** — o noktada
`$json` SMTP'nin cevabıdır (accepted, messageId), sipariş bilgisi değil. Mesaj
boş/sadece emoji görünüyorsa sebebi budur. Doğrusu:
`{{ $('Mükerrer mi?').item.json.name }}` şeklinde kaynak node'u açıkça belirtmek.
| `Uyarı: Mail Gönderilemedi` | SMTP hata çıkışı — elle müdahale için |

**Mükerrer kilidi nasıl çalışır:** gönderilen her `sipariş no|ürün adı` anahtarı
workflow static data'ya (`$getWorkflowStaticData('global').teslimEdilenler`)
yazılır. Aynı anahtar ikinci kez gelirse akış o item için kesilir.

⚠️ Bunun yan etkisi: **aynı siparişi bilerek tekrar göndermek istersen** workflow
otomatik yapmaz, maili elle atman gerekir.

### ⚠️ Bilinen kısıt: static data kalıcı değil

16 Ağustos 2026 testlerinde ölçüldü, akılda tutulmalı:

- **`n8n import:workflow` static data'yı SIFIRLAR.** Hem mükerrer anahtarları hem
  de Gmail trigger'ın `lastTimeChecked` işareti silinir. Trigger geriye dönük
  mailleri yeniden görür ve kilit de boş olduğu için **eski siparişler tekrar
  teslim edilir**. Bu bir kez yaşandı (20:01'deki test siparişi 20:10'da tekrar gitti).
- **Anahtar geçmişi birikmiyor.** Ölçümde static data'da yalnızca son execution'ın
  anahtarı kaldı, öncekiler silinmişti. Yani kilit, **aynı n8n süreci içindeki**
  eşzamanlı çift tetiği durduruyor (asıl işlevi bu, çalışıyor) ama uzun vadeli
  geçmiş tutmuyor.

**Pratik sonuç:** günlük işleyişte koruma çalışır. Risk sadece **import veya
container restart** anında doğar. Bu yüzden:

1. Workflow'u mümkünse **arayüzden düzenle**, CLI import'tan kaçın (arayüzde
   kaydetmek static data'yı silmez).
2. Import/restart yapıldıysa, sonraki 5-10 dakikada Telegram'ı izle — tekrar
   teslim varsa müşteriye "kusura bakmayın, sistem iki kez gönderdi" demek yeter,
   yanlış kişiye gitme riski yok.

**Kalıcı çözüm (henüz yapılmadı):** mükerrer kaydını filigran servisine taşımak —
`/var/www/watermark/` altında bir dosyada tutulursa n8n'in import/restart
döngüsünden tamamen bağımsız olur. Şimdilik n8n'de bırakıldı.

## 4. TEST ETME

`serdar.n8n@gmail.com`'a, `serdark32@gmail.com` adresinden şu maili at:

**Konu:** `TEST SIPARIS`

**Gövde:**
```
Sipariş bilgileri
No
999000111
Tarih
15.08.2026
Tutar
99,00 TL
Ürün detay
1 x Örgütsel Davranış (24 Sayfa)
Alıcı bilgileri
Ad Soyad
Gülşah Işık
Adres
Dijital ürün Türkiye
Telefon
+90 532 111 22 33
E-mail
serdark32@gmail.com
```

⚠️ **Artık onay adımı yok — mail anında gider.** Gövdedeki `E-mail` satırı
dosyanın gideceği adres; oraya kendi adresini yazdığın sürece güvenle test
edebilirsin. Ayrıca her testte `No` satırındaki sipariş numarasını **değiştir**,
yoksa mükerrer kilidi ikinci testi sessizce atlar.

## 5. SIK KARŞILAŞILAN SORUNLAR

### ❌ Sipariş geldi ama ne mail ne Telegram bildirimi var
1. Workflow aktif mi? — n8n'de sağ üstte Publish yeşil mi
2. Filtre bozulmuş olabilir (`Sender` eklenmiş mi) — bkz. bölüm 3
3. Filigran servisi ayakta mı: `curl -s http://172.19.0.1:3002/health`

### ❌ Workflow düzenledim ama değişiklik canlıya geçmedi
n8n 2.x'te aktif workflow'u düzenleyip kaydetmek yetmiyor, **tekrar Publish**
gerekiyor. Kaydetmek değişikliği taslak yapar, workflow pasife düşer.

### ❌ "Your most recent changes may be lost"
Workflow başka bir yerden (CLI veya başka sekme) güncellenmiş. Sekmeyi
**kapat**, yeni sekmede aç. Yenilemek yetmeyebilir.

### ❌ Telegram bildirimi gelmiyor (ama mail gitti)
- Telegram node'unda credential seçili mi
- n8n'de tek credential varsa arayüz onu seçili **gösterir** ama node'a
  yazılmaz — credential'ı elle seçip **Save** etmek gerekir

### ❌ Filigranda Türkçe harfler eksik
DejaVu fontu silinmiş olabilir: `apt-get install -y fonts-dejavu-core`
sonra `pm2 restart watermark-api`

### ❌ Gmail credential kopuyor / sürekli çıkış yapıyor
Google Cloud'da uygulama **Testing** modundaysa refresh token 7 günde ölür.
**Publish** (In production) yapılmalı. Şu an production'da.

### ❌ SMTP hatası: "553-5.1.3 ... is not a valid RFC 5321 address"
Müşteri e-postası bozuk çıkmış demektir. En sık sebebi: **test maili yazarken
Shopier mailinden kopyala-yapıştır yapmak.** Gmail, HTML mailleri düz metne
çevirirken görünmez çapa etiketleri (`<#m_-7917840926562326161_...>`) ekliyor;
bunlar değerlerin içine karışıyor ve bazen `@` işaretini yutuyor:

```
E-mail
serdark32gmail.com <#m_-7917840926562326161_m_-6861318157731008642_>
        ↑ @ kayıp

Telefon
+90 552 950 70 <#m_...>00
        ↑ çapa numaranın ortasına girmiş
```

Ayrıştırıcı bu çapaları temizliyor (telefon örneği doğru onarılıyor), ama
tamamen yutulmuş bir `@` geri getirilemez. Bu durumda akış **durur** ve
Telegram'a "Eksik alan: geçerli e-posta" uyarısı düşer — yanlış adrese
gönderim yapılmaz, olması gereken davranış budur.

**Gerçek Shopier maillerinde bu sorun yok**, düz metin gövdeleri temiz geliyor.
Sorun sadece elle hazırlanan test maillerinde çıkıyor. Test maili yazarken
`Cmd+Shift+V` (biçimlendirmeden yapıştır) kullan.

### ❌ Müşteriye giden mailin altında "sent automatically with n8n" yazıyor
`Müşteriye Mail At` node'unda **Options → Append n8n Attribution** kapatılmalı
(16 Ağustos 2026'da kapatıldı). Telegram node'larında da aynı ayar var.

### ❌ Test maili attım ama hiçbir şey olmadı
Aynı sipariş numarasını daha önce kullanmış olabilirsin — `Mükerrer mi?` node'u
sessizce atlar. `No` satırına yeni bir numara yaz. Kontrol için o node'un
çıktısına bak: 0 item dönmüşse mükerrer sayılmış demektir.

### ❌ Aynı sipariş için 2-3 kez bildirim geliyor
n8n'in **bellekteki** yoklama zamanlayıcıları çoğalmış demektir. Workflow'u
arka arkaya birkaç kez publish/import edersen her seferinde yeni bir zamanlayıcı
kaydedilip eskisi bellekte kalabiliyor. Çözüm container'ı yeniden başlatmak —
bellek sıfırlanır, workflow'lar veritabanından birer kez yeniden kaydedilir:

```bash
docker restart n8n-n8n-1
```

n8n ~12 saniyede geri gelir, Caddy ve tünel etkilenmez. Yoklama sıklığını
düşürmek (1 dk → 5 dk) bu sorunu **çözmez**; sorun sıklık değil, zamanlayıcı
sayısıdır. Mükerrer kilidi sayesinde bu durumda bile müşteriye ikinci mail gitmez.

### ❌ Yeni ürün ekledim, "Ürün eşleştirilemedi" diyor
Yeni ders eklemenin tam listesi:

1. `a4-uret.py` ile HTML'den A4 PDF üret, `shopier-pdfler-a4/`'a koy
2. `watermark.py` → `PRODUCTS`'a PDF yolunu ekle
3. `watermark.py` → `PRODUCT_TITLES`'a tam ders adını ekle
4. `app.py` → `TITLE_RULES`'a ayırt edici ifadeyi ekle (Shopier başlığında geçen,
   Türkçe harfsiz, küçük harf — örn. `("finansal yonetim", "finansal-yonetim")`)
5. `scp` ile PDF'i ve iki .py dosyasını sunucuya at, `pm2 restart watermark-api`
6. `/health` çıktısında yeni kod görünüyor mu, `missing_pdfs` boş mu diye bak

Shopier başlığının sonuna `(33 Sayfa)` gibi ek gelmesi sorun değil — eşleştirme
başlığın **içinde** arıyor.

## 6. FAYDALI KOMUTLAR

```bash
# Servis durumu
pm2 list
pm2 logs watermark-api --lines 30
curl -s http://172.19.0.1:3002/health

# n8n container içinden erişim testi
docker exec n8n-n8n-1 sh -c "wget -qO- http://172.19.0.1:3002/health"

# Workflow'u dışa aktar / durumunu gör
docker exec n8n-n8n-1 n8n export:workflow --id=F5BZFJqOxpeCC3Uu --output=/tmp/w.json
docker exec n8n-n8n-1 n8n list:workflow

# Servisi yeniden başlat
pm2 restart watermark-api

# PDF'leri Mac'ten güncelle
scp ~/Desktop/AOF/SKVT/shopier-pdfler/*.pdf aofsrv:/var/www/watermark/shopier-pdfler/
scp ~/Desktop/AOF/SKVT/{watermark.py,app.py} aofsrv:/var/www/watermark/
```

## 7. SSH ERİŞİMİ

Anahtar tabanlı erişim kuruldu, `~/.ssh/config`'de kısayol var:

```bash
ssh aofsrv
```

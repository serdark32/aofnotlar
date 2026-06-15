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
cp /var/www/aofnotlar/shopier_promo_modules.html /var/www/aofnotlar/frontend/build/shopier_promo_modules.html
cp /var/www/aofnotlar/shopier_promo_modules.html /var/www/aofnotlar/frontend/build/shopier.html
cp "/var/www/aofnotlar/Untitled design.png" /var/www/aofnotlar/frontend/build/ozet-pdf-gorsel.png


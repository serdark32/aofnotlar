const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('⚠️⚠️⚠️ VERİTABANI SIFIRLAMA İŞLEMİ BAŞLIYOR... ⚠️⚠️⚠️');
    await client.query('BEGIN');

    // Tabloları temizle ve ID sayaçlarını sıfırla (CASCADE ile bağımlı tabloları da temizler)
    console.log('🧹 Tablolar siliniyor (user_answers, questions, categories)...');
    
    // Varsa diğer ilişkili tabloları da güvenle temizlemek için CASCADE kullanıyoruz
    await client.query('TRUNCATE TABLE user_answers, questions, categories RESTART IDENTITY CASCADE;');

    // Eşlik eden diğer tabloları da temizleyelim (liderlik tabloları vb.)
    const tablesToTruncate = ['daily_scores', 'leaderboard', 'feedback'];
    for (const table of tablesToTruncate) {
      try {
        const { rows } = await client.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = $1
           );`,
          [table]
        );
        if (rows[0].exists) {
          console.log(`🧹 ${table} tablosu temizleniyor...`);
          await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
        }
      } catch (e) {
        console.log(`   (Not: ${table} tablosu temizlenirken atlandı veya mevcut değil)`);
      }
    }

    await client.query('COMMIT');
    console.log('\n=========================================');
    console.log('✅ TÜM SORULAR VE KATEGORİLER BAŞARIYLA SİLİNDİ!');
    console.log('👉 Artık admin panelinden Excel dosyalarını sıfırdan yükleyebilirsin.');
    console.log('=========================================');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Hata oluştu, sıfırlama işlemi geri alındı:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    console.log("Veritabanına bağlanılıyor...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pdf_courses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        drive_link TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✅ Başarılı: 'pdf_courses' tablosu veritabanında oluşturuldu.");
  } catch (error) {
    console.error("❌ Hata:", error.message);
  } finally {
    pool.end();
  }
}

run();

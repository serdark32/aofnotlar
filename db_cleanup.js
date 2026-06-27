const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

function normalizeName(name) {
  if (!name) return '';
  return name.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔄 Veritabanı temizleme ve birleştirme işlemi başlıyor...');
    await client.query('BEGIN');

    // 1. Tüm kategorileri çek
    const { rows: cats } = await client.query('SELECT id, name FROM categories');
    console.log(`📊 Toplam kategori sayısı: ${cats.length}`);

    // Kategorileri normalize edilmiş isimlerine göre grupla
    const groups = {};
    for (const cat of cats) {
      const norm = normalizeName(cat.name);
      if (!groups[norm]) {
        groups[norm] = [];
      }
      groups[norm].push(cat);
    }

    let mergedCatsCount = 0;
    let deletedQuestionsCount = 0;

    for (const [normName, list] of Object.entries(groups)) {
      if (list.length > 1) {
        console.log(`\n🔍 Mükerrer Kategori Grubu: "${normName}"`);
        
        // En düşük ID'ye sahip veya en çok sorusu olan kategoriyi ana kategori seçelim
        // Her birinin soru sayısını alalım
        const listWithCounts = [];
        for (const cat of list) {
          const { rows } = await client.query('SELECT COUNT(*)::int as count FROM questions WHERE category_id = $1', [cat.id]);
          listWithCounts.push({ ...cat, qCount: rows[0].count });
        }

        // Soru sayısına göre azalan, ID'ye göre artan sırala
        listWithCounts.sort((a, b) => b.qCount - a.qCount || a.id - b.id);
        const primary = listWithCounts[0];
        const duplicates = listWithCounts.slice(1);

        console.log(`   🏆 Ana Kategori: "${primary.name}" (ID: ${primary.id}, Soru Sayısı: ${primary.qCount})`);

        for (const dup of duplicates) {
          console.log(`   ⚠️ Birleştirilecek Kategori: "${dup.name}" (ID: ${dup.id}, Soru Sayısı: ${dup.qCount})`);
          
          // Soruları ana kategoriye taşı
          const { rowCount: updatedQs } = await client.query(
            'UPDATE questions SET category_id = $1 WHERE category_id = $2',
            [primary.id, dup.id]
          );
          console.log(`      ✓ ${updatedQs} soru ana kategoriye taşındı.`);

          // Eğer varsa liderlik tablosu kayıtlarını taşı/güncelle
          if (await tableExists(client, 'leaderboard')) {
            await client.query('UPDATE leaderboard SET category_id = $1 WHERE category_id = $2', [primary.id, dup.id]);
          }
          if (await tableExists(client, 'daily_scores')) {
            await client.query('UPDATE daily_scores SET category_id = $1 WHERE category_id = $2', [primary.id, dup.id]);
          }

          // Eski kategoriyi sil
          await client.query('DELETE FROM categories WHERE id = $1', [dup.id]);
          console.log(`      ✓ Kategori ID ${dup.id} silindi.`);
          mergedCatsCount++;
        }
      }
    }

    // 2. Soruları Kendi İçinde Tekilleştir (Deduplicate)
    console.log('\n🔄 Sorulardaki mükerrer kayıtlar temizleniyor...');
    // Her kategorideki soruları al, soru_text (normalized), a, b, c, d, e şıklarına göre grupla
    const { rows: allCats } = await client.query('SELECT id, name FROM categories');
    
    for (const cat of allCats) {
      const { rows: qs } = await client.query(
        'SELECT id, question_text, year, correct_option FROM questions WHERE category_id = $1',
        [cat.id]
      );

      const seen = {};
      const toDelete = [];

      for (const q of qs) {
        // Soruyu normalize et (karşılaştırma için)
        const normText = normalizeName(q.question_text).substring(0, 150); // İlk 150 karakter karşılaştırma için genelde yeterlidir
        const key = `${normText}_${q.year || 'none'}`;

        if (seen[key]) {
          // Zaten var, bu soruyu sileceğiz
          toDelete.push(q.id);
        } else {
          seen[key] = q.id;
        }
      }

      if (toDelete.length > 0) {
        console.log(`   Ders: "${cat.name}" -> ${toDelete.length} mükerrer soru siliniyor...`);
        await client.query('DELETE FROM questions WHERE id = ANY($1)', [toDelete]);
        deletedQuestionsCount += toDelete.length;
      }
    }

    await client.query('COMMIT');
    console.log('\n=========================================');
    console.log('✅ BİRLEŞTİRME VE TEMİZLİK TAMAMLANDI!');
    console.log(`👉 Birleştirilen / Silinen Kategori: ${mergedCatsCount}`);
    console.log(`👉 Silinen Mükerrer Soru Sayısı: ${deletedQuestionsCount}`);
    console.log('=========================================');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Hata oluştu, değişiklikler geri alındı:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = $1
     );`,
    [tableName]
  );
  return rows[0].exists;
}

run();

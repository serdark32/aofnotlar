const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ============================================================
// MIDDLEWARE
// ============================================================
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token geçersiz' });
  }
}

function adminAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin değil' });
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token geçersiz' });
  }
}

// ============================================================
// GECE YARISI SIFIRLAMA
// ============================================================
function scheduleReset() {
  const now = new Date();
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  const ms = next - now;
  setTimeout(async () => {
    try {
      await pool.query('UPDATE users SET daily_questions_used = 0, last_reset_date = CURRENT_DATE');
      await pool.query("DELETE FROM daily_scores WHERE score_date < CURRENT_DATE");
      console.log('Gece yarısı sıfırlama yapıldı');
    } catch (e) {
      console.error('Reset hatası:', e.message);
    }
    scheduleReset();
  }, ms);
}
scheduleReset();

// ============================================================
// AUTH — ANONİM
// ============================================================
app.post('/api/auth/anonymous', async (req, res) => {
  const { username } = req.body;
  if (!username || !username.trim()) return res.status(400).json({ error: 'Kullanıcı adı zorunlu' });
  if (username.trim().length > 15) return res.status(400).json({ error: 'Kullanıcı adı en fazla 15 karakter olabilir' });
  try {
    const today = new Date().toISOString().split('T')[0];
    // Aynı kullanıcı adı varsa o kişiyi döndür (cihaz bazlı değil isim bazlı)
    let result = await pool.query('SELECT * FROM users WHERE username = $1 AND email IS NULL', [username.trim()]);
    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
      if (user.is_banned) return res.status(403).json({ error: 'Bu kullanıcı adı engellenmiş' });
      // Günlük reset
      if (user.last_reset_date !== today) {
        await pool.query('UPDATE users SET daily_questions_used = 0, last_reset_date = $1 WHERE id = $2', [today, user.id]);
        user.daily_questions_used = 0;
      }
    } else {
      result = await pool.query(
        `INSERT INTO users (username, is_premium, daily_questions_used, last_reset_date, created_at)
         VALUES ($1, false, 0, $2, NOW()) RETURNING *`,
        [username.trim(), today]
      );
      user = result.rows[0];
    }
    const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, is_premium: user.is_premium, daily_questions_used: user.daily_questions_used, is_anonymous: true } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// AUTH — KAYIT / GİRİŞ
// ============================================================
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) return res.status(400).json({ error: 'Email, şifre ve kullanıcı adı zorunlu' });
  if (username.trim().length > 15) return res.status(400).json({ error: 'Kullanıcı adı en fazla 15 karakter olabilir' });
  if (password.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Bu email zaten kayıtlı' });
    const today = new Date().toISOString().split('T')[0];
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, is_premium, daily_questions_used, last_reset_date, created_at)
       VALUES ($1, $2, $3, false, 0, $4, NOW()) RETURNING id, email, username, is_premium, daily_questions_used`,
      [email.toLowerCase(), password_hash, username, today]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { ...user, is_anonymous: false } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email ve şifre zorunlu' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Email veya şifre hatalı' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email veya şifre hatalı' });
    const today = new Date().toISOString().split('T')[0];
    if (user.last_reset_date !== today) {
      await pool.query('UPDATE users SET daily_questions_used = 0, last_reset_date = $1 WHERE id = $2', [today, user.id]);
      user.daily_questions_used = 0;
    }
    const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, is_premium: user.is_premium, daily_questions_used: user.daily_questions_used, is_anonymous: false } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `UPDATE users SET daily_questions_used = 0, last_reset_date = $1 WHERE id = $2 AND last_reset_date != $1`,
      [today, req.user.id]
    );
    const result = await pool.query(
      'SELECT id, email, username, is_premium, premium_until, is_banned, daily_questions_used FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    const user = result.rows[0];
    // Engellenen kullanıcı: 401 → frontend token'ı silip çıkış yapar
    if (user.is_banned) return res.status(401).json({ error: 'Hesabınız engellenmiştir' });
    res.json({ ...user, is_anonymous: !user.email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// KATEGORİLER
// ============================================================
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(q.id)::int as question_count
       FROM categories c LEFT JOIN questions q ON q.category_id = c.id
       GROUP BY c.id ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// SORULAR
// ============================================================
// Ücretsiz - rastgele
// Kategorideki yılları getir
app.get('/api/questions/years/:category_id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT year FROM questions 
       WHERE category_id = $1 AND year IS NOT NULL 
       ORDER BY year DESC`,
      [req.params.category_id]
    );
    res.json(result.rows.map(r => r.year));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Yıla göre sıralı sorular (frekans desc), 20 adet
app.get('/api/questions/:category_id', authMiddleware, async (req, res) => {
  try {
    const { year } = req.query;
    let query, params;
    if (year) {
      query = `SELECT * FROM questions WHERE category_id = $1 AND year = $2 
               ORDER BY frequency DESC NULLS LAST LIMIT 20`;
      params = [req.params.category_id, year];
    } else {
      // Yıl seçilmemişse en son yılı otomatik seç
      query = `SELECT * FROM questions WHERE category_id = $1 
               AND year = (SELECT MAX(year) FROM questions WHERE category_id = $1)
               ORDER BY frequency DESC NULLS LAST LIMIT 20`;
      params = [req.params.category_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ============================================================
// CEVAP KAYDET
// ============================================================
app.post('/api/answer', authMiddleware, async (req, res) => {
  const { question_id, is_correct, category_id } = req.body;
  try {
    const today = new Date().toISOString().split('T')[0];
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    if (user.is_banned) return res.status(401).json({ error: 'Hesabınız engellenmiştir' });
    let dailyUsed = user.daily_questions_used || 0;

    if (user.last_reset_date !== today) {
      dailyUsed = 0;
      await pool.query('UPDATE users SET daily_questions_used = 0, last_reset_date = $1 WHERE id = $2', [today, req.user.id]);
    }

    await pool.query(
      'INSERT INTO user_answers (user_id, question_id, is_correct, answered_at) VALUES ($1, $2, $3, NOW())',
      [req.user.id, question_id, is_correct]
    );

    await pool.query('UPDATE users SET daily_questions_used = daily_questions_used + 1 WHERE id = $1', [req.user.id]);

    if (is_correct) {
      await pool.query(
        `INSERT INTO daily_scores (user_id, category_id, total_score, score_date)
         VALUES ($1, $2, 10, $3)
         ON CONFLICT (user_id, category_id, score_date)
         DO UPDATE SET total_score = daily_scores.total_score + 10`,
        [req.user.id, category_id, today]
      );
    }

    res.json({ ok: true, daily_used: dailyUsed + 1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// LİDERLİK TABLOSU
// ============================================================
app.get('/api/leaderboard/general/top3', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const top3 = await pool.query(
      `SELECT u.username, SUM(ds.total_score)::int as total_score
       FROM daily_scores ds JOIN users u ON u.id = ds.user_id
       WHERE ds.score_date = $1 AND u.is_banned IS NOT TRUE
       GROUP BY u.id, u.username
       ORDER BY total_score DESC LIMIT 3`,
      [today]
    );

    // Token varsa kullanıcıya özel verileri de döndür
    let myRank = null;
    let myScore = 0;

    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        const userId = decoded.id;

        const rankResult = await pool.query(
          `SELECT rank FROM (
             SELECT user_id, RANK() OVER (ORDER BY SUM(total_score) DESC) as rank
             FROM daily_scores WHERE score_date = $1
             GROUP BY user_id
           ) ranked WHERE user_id = $2`,
          [today, userId]
        );
        myRank = rankResult.rows[0]?.rank || null;

        const scoreResult = await pool.query(
          `SELECT COALESCE(SUM(total_score), 0)::int as score
           FROM daily_scores
           WHERE user_id = $1 AND score_date = $2`,
          [userId, today]
        );
        myScore = scoreResult.rows[0]?.score || 0;
      } catch (e) {
        // Token geçersizse sessizce devam et
      }
    }

    res.json({
      top3: top3.rows,
      myRank,
      myScore
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/leaderboard/:category_id', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT u.username, ds.total_score
       FROM daily_scores ds JOIN users u ON u.id = ds.user_id
       WHERE ds.category_id = $1 AND ds.score_date = $2 AND u.is_banned IS NOT TRUE
       ORDER BY ds.total_score DESC LIMIT 10`,
      [req.params.category_id, today]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// TIKLAMA TAKİBİ
// ============================================================
// Sadece bu olaylar kaydedilir; bilinmeyen isimler sessizce yok sayılır.
// dedupeMs: aynı IP'den bu süre içindeki tekrarlar sayılmaz (mobilde çift dokunma).
// Sayfa açılışında 0 — operatör NAT'ı yüzünden aynı IP'den gelen farklı
// kullanıcıları eksik saymamak için; tekrarı istemci tarafı zaten engelliyor.
const TRACK_EVENTS = {
  'shopier-click': { type: 'shopier_click', dedupeMs: 5000 },
  'sales-page-view': { type: 'sales_page_view', dedupeMs: 0 },
};

const recentEvents = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, expires] of recentEvents) if (expires < now) recentEvents.delete(key);
}, 60000);

app.post('/api/track/:event', async (req, res) => {
  // Takip hiçbir koşulda kullanıcının akışını engellememeli:
  // hata olsa bile daima 204 döner.
  try {
    const cfg = TRACK_EVENTS[req.params.event];
    if (cfg) {
      const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
      const key = req.params.event + '|' + ip;
      const now = Date.now();
      if (!cfg.dedupeMs || !(recentEvents.get(key) > now)) {
        if (cfg.dedupeMs) recentEvents.set(key, now + cfg.dedupeMs);
        await pool.query('INSERT INTO click_events (event_type) VALUES ($1)', [cfg.type]);
      }
    }
  } catch (e) {
    console.error('Takip kaydı hatası:', e.message);
  }
  res.status(204).end();
});

// ============================================================
// ADMIN API
// ============================================================
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Geçersiz şifre' });
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const [users, questions, categories, answers] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM questions'),
      pool.query('SELECT COUNT(*) FROM categories'),
      pool.query('SELECT COUNT(*) FROM user_answers'),
    ]);
    const catStats = await pool.query(`SELECT c.name, COUNT(ua.id)::int as count FROM categories c LEFT JOIN questions q ON q.category_id = c.id LEFT JOIN user_answers ua ON ua.question_id = q.id GROUP BY c.id, c.name ORDER BY count DESC`);
    
    // Her gün hangi dersten kaç soru çözüldü
    const dailyCatStats = await pool.query(`
      SELECT 
        DATE(ua.answered_at) as date, 
        c.name, 
        COUNT(*)::int as count 
      FROM user_answers ua 
      JOIN questions q ON ua.question_id = q.id 
      JOIN categories c ON q.category_id = c.id 
      WHERE ua.answered_at >= NOW() - INTERVAL '30 days' 
      GROUP BY DATE(ua.answered_at), c.name 
      ORDER BY date DESC, count DESC
    `);

    // Satış sayfası hunisi — tablo henüz oluşturulmadıysa dashboard'u bozmasın
    let salesFunnel = { viewsTotal: 0, viewsToday: 0, clicksTotal: 0, clicksToday: 0, daily: [] };
    try {
      const [totals, daily] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE event_type = 'sales_page_view')::int AS views_total,
            COUNT(*) FILTER (WHERE event_type = 'sales_page_view' AND created_at >= CURRENT_DATE)::int AS views_today,
            COUNT(*) FILTER (WHERE event_type = 'shopier_click')::int AS clicks_total,
            COUNT(*) FILTER (WHERE event_type = 'shopier_click' AND created_at >= CURRENT_DATE)::int AS clicks_today
          FROM click_events
        `),
        pool.query(`
          SELECT
            DATE(created_at) AS date,
            COUNT(*) FILTER (WHERE event_type = 'sales_page_view')::int AS views,
            COUNT(*) FILTER (WHERE event_type = 'shopier_click')::int AS clicks
          FROM click_events
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `),
      ]);
      const t = totals.rows[0];
      salesFunnel = {
        viewsTotal: t.views_total,
        viewsToday: t.views_today,
        clicksTotal: t.clicks_total,
        clicksToday: t.clicks_today,
        daily: daily.rows.map(r => ({
          date: new Date(r.date).toLocaleDateString('tr'),
          views: r.views,
          clicks: r.clicks,
          rate: r.views ? Math.round((r.clicks / r.views) * 1000) / 10 : null
        }))
      };
    } catch (e) {
      console.error('Satış sayfası istatistiği okunamadı:', e.message);
    }

    res.json({
      users: parseInt(users.rows[0].count),
      questions: parseInt(questions.rows[0].count),
      categories: parseInt(categories.rows[0].count),
      answers: parseInt(answers.rows[0].count),
      salesFunnel,
      catStats: catStats.rows,
      dailyCatStats: dailyCatStats.rows.map(r => ({
        date: new Date(r.date).toLocaleDateString('tr'),
        name: r.name,
        count: r.count
      }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/categories', adminAuth, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Ad zorunlu' });
  try {
    const r = await pool.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *', [name, description || null]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/categories/:id', adminAuth, async (req, res) => {
  const { name, description } = req.body;
  try {
    const r = await pool.query('UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *', [name, description || null, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_answers WHERE question_id IN (SELECT id FROM questions WHERE category_id=$1)', [req.params.id]);
    await pool.query('DELETE FROM daily_scores WHERE category_id=$1', [req.params.id]);
    await pool.query('DELETE FROM questions WHERE category_id=$1', [req.params.id]);
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/questions', adminAuth, async (req, res) => {
  const { category_id } = req.query;
  try {
    let query = 'SELECT * FROM questions';
    let params = [];
    if (category_id) { query += ' WHERE category_id=$1'; params = [category_id]; }
    query += ' ORDER BY id DESC LIMIT 500';
    const r = await pool.query(query, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/questions/:id', adminAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Soru bulunamadı' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/questions', adminAuth, async (req, res) => {
  const { category_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_option, hint, year, frequency } = req.body;
  if (!category_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
  try {
    const r = await pool.query(
      `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_option, hint, year, frequency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [category_id, question_text, option_a, option_b, option_c, option_d, option_e || null, correct_option, hint || null, year || null, frequency || 1]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/questions/:id', adminAuth, async (req, res) => {
  const { question_text, option_a, option_b, option_c, option_d, option_e, correct_option, hint, year, frequency } = req.body;
  try {
    const r = await pool.query(
      `UPDATE questions SET question_text=$1, option_a=$2, option_b=$3, option_c=$4, option_d=$5, option_e=$6, correct_option=$7, hint=$8, year=$9, frequency=$10 WHERE id=$11 RETURNING *`,
      [question_text, option_a, option_b, option_c, option_d, option_e || null, correct_option, hint || null, year || null, frequency || 1, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/questions/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_answers WHERE question_id=$1', [req.params.id]);
    await pool.query('DELETE FROM questions WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/questions/bulk', adminAuth, async (req, res) => {
  const { questions } = req.body;
  if (!questions || !questions.length) return res.status(400).json({ error: 'Soru listesi boş' });
  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;
  try {
    await client.query('BEGIN');
    for (const q of questions) {
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_option) continue;
      
      // Aynı kategori, soru metni ve yıldaki soruyu ara (case-insensitive ve trim ederek)
      const qText = String(q.question_text).trim();
      const qYear = q.year || null;

      const { rows } = await client.query(
        `SELECT id FROM questions 
         WHERE category_id = $1 
           AND LOWER(TRIM(question_text)) = LOWER($2) 
           AND (year = $3 OR (year IS NULL AND $3 IS NULL))`,
        [q.category_id, qText, qYear]
      );

      if (rows.length > 0) {
        // Zaten varsa: Şıkları, doğru cevabı ve frekansı güncelle
        await client.query(
          `UPDATE questions SET 
             option_a = $1, option_b = $2, option_c = $3, option_d = $4, option_e = $5,
             correct_option = $6, frequency = $7
           WHERE id = $8`,
          [
            q.option_a, q.option_b, q.option_c, q.option_d, q.option_e || null,
            q.correct_option, q.frequency || 1, rows[0].id
          ]
        );
        updated++;
      } else {
        // Yoksa: Yeni soru olarak ekle
        await client.query(
          `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_option, hint, year, frequency) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [q.category_id, qText, q.option_a, q.option_b, q.option_c, q.option_d, q.option_e || null, q.correct_option, q.hint || null, qYear, q.frequency || 1]
        );
        inserted++;
      }
    }
    await client.query('COMMIT');
    res.json({ inserted, updated });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, email, username, is_premium, premium_until, is_banned, daily_questions_used, last_reset_date, created_at FROM users ORDER BY id DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/users/:id/premium', adminAuth, async (req, res) => {
  const { is_premium, premium_until } = req.body;
  try {
    const r = await pool.query(
      'UPDATE users SET is_premium=$1, premium_until=$2 WHERE id=$3 RETURNING id, email, username, is_premium, premium_until',
      [is_premium, premium_until || null, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/users/:id/ban', adminAuth, async (req, res) => {
  const { is_banned } = req.body;
  try {
    const r = await pool.query(
      'UPDATE users SET is_banned=$1 WHERE id=$2 RETURNING id, username, is_banned',
      [is_banned, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/feedback', adminAuth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/feedback/:id', adminAuth, async (req, res) => {
  const { admin_reply, is_read } = req.body;
  try {
    const r = await pool.query(
      `UPDATE feedback SET is_read = $1, admin_reply = $2 WHERE id = $3 RETURNING *`,
      [is_read !== false, admin_reply || null, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/feedback/mine', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, message, admin_reply, is_read, created_at FROM feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/feedback', authMiddleware, async (req, res) => {
  const { message, username } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mesaj boş' });
  try {
    await pool.query(
      `INSERT INTO feedback (user_id, username, message, created_at) VALUES ($1, $2, $3, NOW())`,
      [req.user.id, username || 'anonim', message.trim()]
    );
    res.json({ ok: true });
  } catch (e) {
    // Tablo yoksa bile hata verme
    console.log('Feedback (tablo yok olabilir):', message);
    res.json({ ok: true });
  }
});

// ============================================================
// ÜCRETSİZ ÖZET DERS NOTLARI
// ============================================================
// Herkese açık: özet notu listesini döner
app.get('/api/pdf-notes', async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name, drive_link, created_at FROM pdf_notes ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: yeni özet notu ekle
app.post('/api/admin/pdf-notes', adminAuth, async (req, res) => {
  const { name, drive_link } = req.body;
  if (!name || !drive_link) return res.status(400).json({ error: 'Ders adı ve link zorunlu' });
  try {
    const r = await pool.query(
      'INSERT INTO pdf_notes (name, drive_link) VALUES ($1, $2) RETURNING *',
      [name.trim(), drive_link.trim()]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: özet notu sil
app.delete('/api/admin/pdf-notes/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM pdf_notes WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// DERS İSTEKLERİ
// ============================================================
app.post('/api/course-request', async (req, res) => {
  // İki format destekleniyor:
  //  1) { course_name: "..." }                          (eski serbest metin)
  //  2) { courses: [{ name: "...", department: "..." }] } (yeni çoklu seçim)
  let items = [];
  if (Array.isArray(req.body.courses)) {
    items = req.body.courses
      .map(c => ({
        name: String(c && c.name || '').trim(),
        department: String(c && c.department || '').trim() || null
      }))
      .filter(c => c.name)
      .slice(0, 100);
  } else if (req.body.course_name && String(req.body.course_name).trim()) {
    items = [{ name: String(req.body.course_name).trim(), department: null }];
  }

  if (!items.length) return res.status(400).json({ error: 'Ders adı zorunlu' });

  try {
    for (const it of items) {
      // Aynı ders adı varsa count'u artır, yoksa yeni kayıt oluştur
      await pool.query(
        `INSERT INTO course_requests (course_name, department, request_count, updated_at)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT (LOWER(course_name))
         DO UPDATE SET request_count = course_requests.request_count + 1,
                       department = COALESCE(course_requests.department, EXCLUDED.department),
                       updated_at = NOW()`,
        [it.name, it.department]
      );
    }
    res.json({ ok: true, count: items.length });
  } catch (e) {
    // Tablo/kolon yoksa sessizce başarısız ol
    console.log('Course request error (tablo yok olabilir):', e.message);
    res.json({ ok: true });
  }
});

// Admin: tüm ders isteklerini getir (sayıya göre sıralı)
app.get('/api/admin/course-requests', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM course_requests ORDER BY department NULLS LAST, request_count DESC, updated_at DESC LIMIT 500'
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: ders isteği sil
app.delete('/api/admin/course-requests/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM course_requests WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rate limit: aynı e-posta günde 1 kez (özet notlar için ayrı, kitap indirmesini etkilemez)
const notesRateLimit = new Map(); // email -> timestamp

app.post('/api/send-notes', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'E-posta gerekli' });

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 saat

    // Eski kayıtları temizle
    for (const [key, time] of notesRateLimit) {
      if (now - time > ONE_DAY) notesRateLimit.delete(key);
    }

    // Bu e-posta daha önce istekte bulundu mu?
    if (notesRateLimit.has(email)) {
      const kalan = Math.ceil((ONE_DAY - (now - notesRateLimit.get(email))) / (60 * 60 * 1000));
      return res.status(429).json({ error: `Bu e-posta ile günde 1 kez talep yapabilirsiniz. ~${kalan} saat sonra tekrar deneyin.` });
    }

    notesRateLimit.set(email, now);

    const https = require('https');
    const data = JSON.stringify(req.body);

    const options = {
      hostname: 'novantera.com',
      port: 443,
      path: '/webhook/aof-ozet-pdf-iste',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const request = https.request(options, (response) => {
      res.json({ success: true });
    });

    request.on('error', (error) => {
      res.status(500).json({ error: error.message });
    });

    request.write(data);
    request.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log('Server running on port ' + process.env.PORT);
});

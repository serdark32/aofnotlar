-- Ücretsiz özet ders notları tablosu (pdf_courses ile aynı şema)
CREATE TABLE IF NOT EXISTS pdf_notes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  drive_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

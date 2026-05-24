-- Ders istekleri tablosu
CREATE TABLE IF NOT EXISTS course_requests (
  id SERIAL PRIMARY KEY,
  course_name VARCHAR(255) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Aynı ders adı tek kayıt olacak şekilde unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_requests_name ON course_requests (LOWER(course_name));

-- Soru metni ve şık kolonlarını VARCHAR(255)'ten TEXT'e çevir
ALTER TABLE questions ALTER COLUMN question_text TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_a TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_b TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_c TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_d TYPE TEXT;
ALTER TABLE questions ALTER COLUMN option_e TYPE TEXT;
ALTER TABLE questions ALTER COLUMN hint TYPE TEXT;

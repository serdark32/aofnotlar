-- Satış sayfası tıklama takibi (Shopier'e giden kullanıcı sayısı)
CREATE TABLE IF NOT EXISTS click_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_click_events_type_date ON click_events (event_type, created_at DESC);

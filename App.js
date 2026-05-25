import { useState, useEffect, useRef } from 'react';

// Varsa kendi API sunucunu buraya yaz, şu an boş bırakıldığı için bağlantı hatası veriyordu:
const API = 'https://aofnotlar.com';

// ── ESPRİ LİSTESİ
const aofJokes = [
  "Harika bir performans! Günün şampiyonu.",
  "Kusursuz bir başarı, böyle devam et!",
  "Günün en iyisi sensin, tebrik ederiz!",
  "Liderlik tablosunun zirvesindesin, mükemmel!",
  "Azminin zaferi, liderliği sonuna kadar hak ettin!",
  "Muazzam bir odaklanma ve harika bir skor!",
  "Zirvedeki yerini aldın, tebrikler!",
  "Günün en yüksek skoruna ulaştın, harika iş çıkardın!",
  "Rakiplerini geride bıraktın, günün yıldızı sensin!",
  "Kimse seni bu tahttan indiremedi!",
  "Bugün tablonun en parlak ismi sensin.",
  "Kusursuz bir birincilik, tebrikler!"
];

const getDailyJoke = (name) => {
  if (!name) return "";
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const jokeIndex = dayOfYear % aofJokes.length;
  return `🏆 1. ${name} - ${aofJokes[jokeIndex]}`;
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(() => {
    const savedDate = localStorage.getItem('my_xp_date');
    const today = new Date().toISOString().split('T')[0];
    if (savedDate !== today) {
      localStorage.removeItem('my_xp');
      localStorage.setItem('my_xp_date', today);
      return 0;
    }
    return parseInt(localStorage.getItem('my_xp')) || 0;
  });
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [top3, setTop3] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [myLeaderboardScore, setMyLeaderboardScore] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [authError, setAuthError] = useState('');
  const [anonName, setAnonName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // Favoriler (Şimdilik LocalStorage'da tutuyoruz)
  const [favorites, setFavorites] = useState([]);

  // Yıl seçici
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  // Vize / Final seçimi
  const [examType, setExamType] = useState('final');

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);

  // Hatalı soru bildirme
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Geçtim mi? modalı
  const [showPassCheck, setShowPassCheck] = useState(false);
  const [vizeInput, setVizeInput] = useState('');
  const [passResult, setPassResult] = useState(null);

  // PDF Not İndir
  const [pdfCourses, setPdfCourses] = useState([]);
  const [pdfSelected, setPdfSelected] = useState([]);
  const [pdfEmail, setPdfEmail] = useState('');
  const [pdfKvkk, setPdfKvkk] = useState(false);
  const [pdfSending, setPdfSending] = useState(false);
  const [pdfResult, setPdfResult] = useState(null); // 'success' | 'error' | null
  const N8N_WEBHOOK = 'BURAYA_N8N_PRODUCTION_URL_GELECEK';

  // Ders isteği
  const [courseRequestText, setCourseRequestText] = useState('');
  const [courseRequestSent, setCourseRequestSent] = useState(false);

  const loadMyFeedbacks = async () => {
    try {
      const res = await fetch(API + '/api/feedback/mine', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (res.ok) setMyFeedbacks(await res.json());
    } catch (e) { }
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      await fetch(API + '/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ message: feedbackText, username: user?.username })
      });
    } catch (e) { }
    setFeedbackSent(true);
    setTimeout(() => { setShowFeedback(false); setFeedbackText(''); setFeedbackSent(false); }, 1500);
  };

  const sendReport = async (reason) => {
    const q = questions[currentQ];
    try {
      await fetch(API + '/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          message: `[HATA BİLDİRİMİ] Soru ID: ${q?.id} | Ders: ${activeCategory?.name} | Sorun: ${reason}`,
          username: user?.username
        })
      });
    } catch (e) { }
    setReportSent(true);
    setTimeout(() => { setShowReportModal(false); setReportSent(false); }, 1500);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedFavs = localStorage.getItem('favs');

    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      fetchLeaderboard(savedToken);
      refreshUser(savedToken);
    }
    // Kategoriler public endpoint (auth gerekmez), her zaman yüklenir
    fetchCategories();
    setScreen('home');
  }, []);

  // Ana sayfaya her dönüşte liderlik tablosunu yenile
  useEffect(() => {
    if (screen === 'home' && token) {
      fetchLeaderboard(token);
    }
  }, [screen]);

  const refreshUser = async (t) => {
    try {
      const res = await fetch(API + '/api/auth/me', { headers: { Authorization: 'Bearer ' + t } });
      if (res.status === 401 || res.status === 404) {
        localStorage.removeItem('token'); localStorage.removeItem('user');
        setToken(null); setUser(null); return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch (e) { }
  };

  const fetchCategories = async (t) => {
    try {
      const headers = t ? { Authorization: 'Bearer ' + t } : {};
      const res = await fetch(API + '/api/categories', { headers });
      if (res.ok) setCategories(await res.json());
    } catch (e) { }
  };

  const fetchLeaderboard = async (t) => {
    try {
      const res = await fetch(API + '/api/leaderboard/general/top3', { headers: { Authorization: 'Bearer ' + t } });
      if (res.ok) {
        const data = await res.json();
        setTop3(data.top3 || []);
        setMyRank(data.myRank || null);

        // Sadece günlük skoru göster (myScore veya daily_score), total_score kullanma
        const dailyScore = data.myScore ?? data.daily_score ?? data.score ?? 0;
        setMyLeaderboardScore(dailyScore);
      }
    } catch (e) { }
  };

  // ── ANONİM GİRİŞ
  const handleAnonymous = async () => {
    setAuthError('');
    if (!anonName.trim()) { setAuthError('Kullanıcı adı zorunlu'); return; }
    try {
      const res = await fetch(API + '/api/auth/anonymous', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: anonName.trim() })
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error); return; }
      setToken(data.token); setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      fetchCategories(data.token); fetchLeaderboard(data.token);
      setShowNicknameModal(false);
      // Eğer bekleyen kategori varsa direkt aç
      if (pendingCategory) {
        const cat = pendingCategory;
        setPendingCategory(null);
        openCategory(cat);
      } else {
        setScreen('home');
      }
    } catch (e) { setAuthError('Bağlantı hatası'); }
  };

  // ── KAYIT / GİRİŞ
  const handleAuth = async () => {
    setAuthError('');
    if (!email.trim() || !password.trim()) { setAuthError('Email ve şifre zorunlu'); return; }
    if (authMode === 'register' && !username.trim()) { setAuthError('Kullanıcı adı zorunlu'); return; }
    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = authMode === 'register' ? { email, password, username } : { email, password };
      const res = await fetch(API + endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error); return; }
      setToken(data.token); setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      fetchCategories(data.token); fetchLeaderboard(data.token);
      setScreen('home');
    } catch (e) { setAuthError('Bağlantı hatası'); }
  };

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setToken(null); setUser(null);
    setEmail(''); setPassword(''); setUsername(''); setAnonName('');
    setScreen('home');
  };

  // ── KATEGORİ AÇ (token yoksa nickname modalı göster)
  const handleCategoryClick = (cat) => {
    if (!token) {
      setPendingCategory(cat);
      setAnonName('');
      setAuthError('');
      setShowNicknameModal(true);
    } else {
      openCategory(cat);
    }
  };

  const openCategory = async (cat, year = null) => {
    setActiveCategory(cat);
    setCorrect(0); setWrong(0);
    setCurrentQ(0); setSelected(null);

    const yearsRes = await fetch(API + `/api/questions/years/${cat.id}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const years = await yearsRes.json();
    setAvailableYears(years);

    const targetYear = year || (years.length > 0 ? years[0] : null);
    setSelectedYear(targetYear);

    const url = targetYear
      ? `/api/questions/${cat.id}?year=${encodeURIComponent(targetYear)}&examType=${examType}`
      : `/api/questions/${cat.id}?examType=${examType}`;
    const res = await fetch(API + url, { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    setQuestions(data);
    setScreen('quiz');
  };

  const changeYear = async (year) => {
    setSelectedYear(year);
    setCorrect(0); setWrong(0);
    setCurrentQ(0); setSelected(null);
    const url = `/api/questions/${activeCategory.id}?year=${encodeURIComponent(year)}&examType=${examType}`;
    const res = await fetch(API + url, { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    setQuestions(data);
  };

  // ── CEVAP
  const handleAnswer = async (option) => {
    if (selected) return;
    setSelected(option);
    const q = questions[currentQ];
    const isCorrect = option.toLowerCase() === q.correct_option.toLowerCase();
    if (isCorrect) { 
      setScore(sc => { 
        const n = sc + 10; 
        localStorage.setItem('my_xp', n); 
        localStorage.setItem('my_xp_date', new Date().toISOString().split('T')[0]); 
        return n; 
      }); 
      setCorrect(c => c + 1); 
    }
    else setWrong(w => w + 1);

    await fetch(API + '/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ question_id: q.id, is_correct: isCorrect, category_id: activeCategory.id })
    });

    await refreshUser(token);
    await fetchLeaderboard(token);
  };

  const handleNext = () => {
    setSelected(null);
    setShowReportModal(false);
    setReportSent(false);
    if (currentQ + 1 < questions.length) setCurrentQ(q => q + 1);
    else setScreen('result');
  };

  // ── NOT HESAPLA
  const calcResult = () => {
    const total = questions.length || 20;
    const puan = Math.round((correct / total) * 100);
    if (examType === 'vize') {
      const vizeKatki = puan * 0.30;
      const finalMin = Math.max(0, Math.ceil((35 - vizeKatki) / 0.70));
      return { type: 'vize', puan, katki: vizeKatki.toFixed(1), finalMin };
    } else {
      const finalKatki = puan * 0.70;
      return { type: 'final', puan, katki: finalKatki.toFixed(1) };
    }
  };

  const formatVal = (v) => {
    if (!v) return v;
    if (/^\d+$/.test(String(v).trim())) return parseInt(v).toLocaleString('tr-TR');
    return v;
  };

  const formatQuestion = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i, arr) => {
      const isMadde = /^(I{1,3}V?|IV|VI{0,3}|IX|[IVX]{1,4})[\s\-\–\.]/i.test(line.trim()) || /^[-–•]\s/.test(line.trim());
      const isLast = i === arr.length - 1;
      const isOnly = arr.length === 1;
      return (
        <div key={i} style={{
          fontWeight: (isLast || isOnly) ? 700 : 400,
          paddingLeft: isMadde ? 4 : 0,
          marginBottom: isMadde ? 2 : (isLast ? 0 : 6),
          fontSize: 15,
        }}>{line}</div>
      );
    });
  };

  // ── FAVORİ EKLE/ÇIKAR FONKSİYONU
  const toggleFavorite = (e, catId) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(catId)) {
      newFavs = favorites.filter(id => id !== catId);
    } else {
      newFavs = [...favorites, catId];
    }
    setFavorites(newFavs);
    localStorage.setItem('favs', JSON.stringify(newFavs));
  };

  // Kategorileri favorilere göre sırala (Favoriler en üstte)
  const sortedCategories = [...categories].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  // ════════════════════════════════════════════════════════════
  // EKRANLAR
  // ════════════════════════════════════════════════════════════

  if (screen === 'home') return (
    <div style={s.bg}>
      <div style={s.container}>

        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={s.greeting}>Hoşgeldin, bugün hangi derse çalışacaksın? 🎯</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href="https://t.me/+whse8tbDgac0OTU0" target="_blank" rel="noopener noreferrer" style={{ ...s.feedbackIconBtn, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Telegram Grubumuz">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"/>
              </svg>
            </a>
            <button style={s.feedbackIconBtn} onClick={() => { setShowFeedback(true); loadMyFeedbacks(); }}>💬</button>
          </div>
        </div>

        {showNicknameModal && (
          <div style={s.modalOverlay} onClick={() => setShowNicknameModal(false)}>
            <div style={{ ...s.modalBox, maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 50, marginBottom: 8 }}>👤</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1f2937', marginBottom: 6 }}>Kullanıcı Adı Seç</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Liderlik tablosunda bu isimle görüneceksin</div>
              <input style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid #d1d5db', fontSize: 15, marginBottom: 10, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                placeholder="Kullanıcı adın (örn: AhmetAOF)"
                value={anonName} onChange={e => setAnonName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnonymous()} maxLength={20} />
              {authError && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 10, textAlign: 'left' }}>⚠️ {authError}</div>}
              <button style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: GREEN, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }} onClick={handleAnonymous}>Başla 🚀</button>
              <button style={{ width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#f3f4f6', color: '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8 }} onClick={() => setShowNicknameModal(false)}>İptal</button>
            </div>
          </div>
        )}

        {showFeedback && (
          <div style={s.modalOverlay} onClick={() => setShowFeedback(false)}>
            <div style={s.modalBox} onClick={e => e.stopPropagation()}>
              <div style={s.modalTitle}>💬 Geri Bildirim / Ders İsteği</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Görüşlerini yaz, ders isteğinde bulun!</div>
              {feedbackSent ? (
                <div style={{ textAlign: 'center', fontSize: 40, padding: 20 }}>✅</div>
              ) : (
                <>
                  <textarea style={s.feedbackInput} placeholder="Mesajını buraya yaz..."
                    value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3} />
                  <button style={{ ...s.btn, color: '#fff', background: GREEN, marginTop: 8 }} onClick={sendFeedback}>Gönder</button>
                  <button style={{ ...s.btn, background: '#f3f4f6', color: '#374151', marginTop: 8 }} onClick={() => setShowFeedback(false)}>İptal</button>
                </>
              )}

              {myFeedbacks.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>GEÇMİŞ GERİ BİLDİRİMLERİN</div>
                  {myFeedbacks.map((f, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: '#f9fafb', borderRadius: 10, borderLeft: `3px solid ${f.is_read ? '#10b981' : '#f59e0b'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.is_read ? '#10b981' : '#d97706' }}>
                          {f.is_read ? '✓ Dikkate Alındı' : '⏳ İnceleniyor'}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(f.created_at).toLocaleDateString('tr')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>{f.message}</div>
                      {f.admin_reply && (
                        <div style={{ marginTop: 6, padding: '6px 10px', background: '#d1fae5', borderRadius: 8, fontSize: 12, color: '#065f46' }}>
                          📣 {f.admin_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={s.card}>
          <div style={s.cardTitle}>🏆 Bugünün Liderleri</div>

          {/* GÜNÜN ŞAKASI BURAYA EKLENDİ */}
          {top3.length > 0 && (
            <div style={{ fontWeight: '600', color: '#d97706', marginBottom: 12, textAlign: 'center', background: '#fef3c7', padding: '10px', borderRadius: 10, fontSize: 13, lineHeight: 1.4 }}>
              {getDailyJoke(top3[0]?.username)}
            </div>
          )}

          {top3.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>Henüz soru çözülmedi. İlk sen ol!</div>
          ) : top3.map((p, i) => (
            <div key={i} style={s.lbRow}>
              <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.username}</span>
              <span style={s.lbScore}>{p.total_score} XP</span>
            </div>
          ))}
          {myRank
            ? <div style={s.myRankBox}><span>📍 Sen bugün <strong>{myRank}. sıradasın</strong></span><span style={s.lbScore}>{myLeaderboardScore} XP</span></div>
            : <div style={s.myRankBoxGray}>Soru çöz, sıralamada görün! 🎯</div>
          }
        </div>

        {/* PDF Not İndir Butonu */}
        <button
          style={{ width: '100%', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}
          onClick={async () => {
            try {
              const res = await fetch(API + '/api/pdf-courses');
              const data = await res.json();
              setPdfCourses(data);
              setPdfSelected([]);
              setPdfEmail('');
              setPdfKvkk(false);
              setPdfResult(null);
              setScreen('pdf-download');
            } catch (e) { alert('Dersler yüklenemedi'); }
          }}
        >
          <span>📄 Ders Kitabı İndir</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>›</span>
        </button>

        <div style={s.cardTitle2} id="pratik-yap">Pratik Yap</div>

        <div style={s.examTabRow}>
          <button type="button" style={examType === 'vize' ? s.examTabActiveVize : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('vize'); }}>
            📗 Vize
          </button>
          <button type="button" style={examType === 'final' ? s.examTabActiveFinal : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('final'); }}>
            📘 Final
          </button>
          <button type="button" style={examType === 'yazokulu' ? s.examTabActiveYazOkulu : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('yazokulu'); }}>
            ☀️ Yaz Okulu
          </button>
        </div>

        {categories.length === 0 && <div style={s.empty}>Yakında dersler eklenecek...</div>}

        {/* KATEGORİLER (Filtrelenmiş ve Temizlenmiş) */}
        <div style={{ minHeight: '65vh', paddingBottom: 40 }}>
          {sortedCategories
            .filter(cat => {
              const nameLower = cat.name.toLowerCase();
              const hasVize = nameLower.includes('vize');
              const hasFinal = nameLower.includes('final');

              // Eğer "Vize" sekmesindeysek, içinde 'vize' geçenleri veya ikisi de geçmeyenleri göster
              if (examType === 'vize') return nameLower.includes('vize') || (!hasVize && !hasFinal && !nameLower.includes('yaz okulu'));
              // Eğer "Final" sekmesindeysek, içinde 'final' geçenleri göster
              if (examType === 'final') return nameLower.includes('final') || (!hasVize && !hasFinal && !nameLower.includes('yaz okulu'));
              // Eğer "Yaz Okulu" sekmesindeysek, içinde 'yaz okulu' geçenleri göster
              if (examType === 'yazokulu') return nameLower.includes('yaz okulu');
              return true;
            })
            .map(cat => {
              // (Vize), (Final) veya (Yaz okulu) kelimelerini temizle
              const cleanName = cat.name.replace(/\s*\(\s*(Vize|Final|Yaz okulu|[Vv]ize|[Ff]inal|[Yy]az [Oo]kulu)\s*\)\s*/g, '').trim();
              const isFav = favorites.includes(cat.id);

              return (
                <button key={cat.id} style={s.catBtn} onClick={() => handleCategoryClick(cat)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(e, cat.id); }}
                      style={{ fontSize: 20, cursor: 'pointer', color: isFav ? '#fbbf24' : '#d1d5db', transition: '0.2s', paddingRight: 4, transform: isFav ? 'scale(1.1)' : 'scale(1)' }}
                    >
                      {isFav ? '★' : '☆'}
                    </div>
                    <span style={{ fontWeight: '600' }}>{cleanName}</span>
                  </div>
                  <span style={s.catArrow}>→</span>
                </button>
              )
            })}
        </div>

      </div>
    </div>
  );

  if (screen === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const opts = ['A', 'B', 'C', 'D', 'E'];
    const vals = [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e].map(formatVal);

    return (
      <div style={s.quizBg}>
        {availableYears.length > 1 && (
          <div style={s.yearBar}>
            {availableYears.map(y => (
              <button key={y} style={{ ...s.yearBtn, ...(y === selectedYear ? s.yearBtnActive : {}) }}
                onClick={() => changeYear(y)}>
                {y}
              </button>
            ))}
          </div>
        )}

        <div style={s.quizHeader}>
          <button style={s.backBtn} onClick={() => setScreen('home')}>← Geri</button>
          <div style={s.progress}>{currentQ + 1} / {questions.length}</div>
          <div style={s.rankBadge}>🏅 {score} XP{myRank ? ` · #${myRank}` : ''}</div>
        </div>

        <div style={s.quizScroll} onClick={() => { if (selected) handleNext(); }}>
          <div style={s.quizCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
              <div style={{ ...s.catLabel, flex: 1, wordBreak: 'break-word', lineHeight: 1.3 }}>{activeCategory?.name}</div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'nowrap' }}>
                {q.year && <div style={{ ...s.yearBadge, whiteSpace: 'nowrap' }}>{q.year}</div>}
                {q.frequency > 1 && <div style={{ ...s.freqBadge, whiteSpace: 'nowrap' }}>🔥 {q.frequency}x</div>}
              </div>
            </div>
            <div style={s.qText}>{formatQuestion(q.question_text)}</div>
            <div style={s.divider} />
            {opts.map((opt, i) => {
              if (!vals[i]) return null;
              let bg = '#f9fafb', border = '1.5px solid #e5e7eb', color = '#1f2937', letterBg = '#e5e7eb', letterColor = '#374151';
              if (selected) {
                if (opt.toLowerCase() === q.correct_option.toLowerCase()) { bg = '#d1fae5'; border = '1.5px solid #10b981'; color = '#065f46'; letterBg = '#10b981'; letterColor = '#fff'; }
                else if (opt === selected) { bg = '#fee2e2'; border = '1.5px solid #ef4444'; color = '#991b1b'; letterBg = '#ef4444'; letterColor = '#fff'; }
              }
              return (
                <button key={opt} style={{ ...s.optBtn, background: bg, border, color }}
                  onClick={e => { e.stopPropagation(); if (selected) handleNext(); else handleAnswer(opt); }}>
                  <span style={{ ...s.optLetter, background: letterBg, color: letterColor }}>{opt}</span>
                  <span style={s.optText}>{vals[i]}</span>
                </button>
              );
            })}
          </div>
          {selected && (
            <button
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 12,
                padding: '10px 20px',
                color: 'rgba(255,255,255,0.75)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 2,
                marginBottom: 4,
              }}
              onClick={e => { e.stopPropagation(); setShowReportModal(true); }}
            >
              🚩 Hatalı soru bildir
            </button>
          )}
          {!selected && (
            <button
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '9px 20px',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: 6,
                marginBottom: 4,
                letterSpacing: 0.2,
              }}
              onClick={e => { e.stopPropagation(); handleNext(); }}
            >
              Bu soruyu geç →
            </button>
          )}
          {showReportModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
              onClick={() => setShowReportModal(false)}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 }}
                onClick={e => e.stopPropagation()}>
                {reportSent ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 44 }}>✅</div>
                    <div style={{ fontWeight: 700, marginTop: 8, color: '#065f46' }}>Bildirim iletildi, teşekkürler!</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#1f2937', marginBottom: 6 }}>🚩 Hatalı Soru Bildir</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>Sorunun türünü seç, ekibimize iletilsin.</div>
                    {[
                      { icon: '✏️', label: 'Yazım / imla hatası', desc: 'Soruda veya seçeneklerde yazım yanlışı var' },
                      { icon: '❌', label: 'Doğru şık yanlış işaretli', desc: 'Cevap anahtarı yanlış görünüyor' },
                      { icon: '🤔', label: 'Mantık / içerik hatası', desc: 'Soru mantıksal olarak hatalı veya eksik' },
                    ].map(opt => (
                      <button key={opt.label}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', textAlign: 'left', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}
                        onClick={() => sendReport(opt.label)}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{opt.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                    <button style={{ width: '100%', padding: '11px', borderRadius: 12, border: 'none', background: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}
                      onClick={() => setShowReportModal(false)}>İptal</button>
                  </>
                )}
              </div>
            </div>
          )}
          <div style={{ height: 24 }} />
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    const r = calcResult();

    // Yılları büyükten küçüğe sırala (2024, 2023, 2022...) ve bir öncekini bul
    const sortedYears = [...availableYears].sort((a, b) => b.localeCompare(a));
    const currentIndex = sortedYears.indexOf(selectedYear);
    const prevYear = (currentIndex >= 0 && currentIndex < sortedYears.length - 1)
      ? sortedYears[currentIndex + 1]
      : null;

    return (
      <div style={s.bg}>
        <div style={s.container}>
          <div style={s.resultEmoji}>{r.puan >= 50 ? '🎉' : '📚'}</div>
          <div style={s.resultTitle}>{r.puan >= 50 ? 'Harika!' : 'Çalışmaya devam!'}</div>

          <div style={s.resultCard}>
            <div style={s.resultRow}>
              <span>✅ Doğru</span><strong>{correct}</strong>
            </div>
            <div style={s.resultRow}>
              <span>❌ Yanlış</span><strong>{wrong}</strong>
            </div>
            <div style={s.resultRow}>
              <span>📊 Puanın</span><strong>{r.puan} / 100</strong>
            </div>
            <div style={s.divider} />

            {r.type === 'vize' ? (
              <>
                <div style={s.resultRow}>
                  <span>Vize Etkisi (%30)</span><strong>{r.katki} puan</strong>
                </div>
                <div style={s.kaldiBox}>
                  Dersi geçebilmek için ortalaman 35 olması gerekiyor. Finalden <strong>{r.finalMin}</strong> almalısın.
                </div>
              </>
            ) : (
              <>
                <div style={s.resultRow}>
                  <span>Final Etkisi (%70)</span><strong>{r.katki} puan</strong>
                </div>
                <div style={s.gectiBox}>
                  🎓 Puanın ne kadar yüksekse geçme şansın o kadar artar!
                </div>
              </>
            )}
          </div>

          {myRank && <div style={s.rankResult}>📍 Bugün {myRank}. sıradasın!</div>}

          {/* Başarı Notu Hesapla - sadece final sınavında */}
          {r.type === 'final' && (
            <button
              style={{ ...s.btn, background: GREEN, color: '#fff', marginBottom: 6, fontWeight: 800 }}
              onClick={() => { setShowPassCheck(true); setPassResult(null); setVizeInput(''); }}
            >
              💯 Başarı Notu Hesapla
            </button>
          )}

          {/* Dinamik Buton Mantığı */}
          {prevYear ? (
            <button style={s.btn} onClick={() => openCategory(activeCategory, prevYear)}>
              ⬅️ Önceki Yıla Geç ({prevYear})
            </button>
          ) : (
            <button style={s.btn} onClick={() => openCategory(activeCategory, selectedYear)}>
              🔄 Tekrar Çöz
            </button>
          )}

          <button style={{ ...s.btn, background: '#fff', color: GREEN, marginTop: 10 }} onClick={() => setScreen('home')}>🏠 Ana Sayfa</button>

          {/* YouTube Takip Bölümü */}
          <a
            href="https://www.youtube.com/@aofseslinotlar"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.12)', borderRadius: 16,
              padding: '14px 16px', marginTop: 14, textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }}
          >
            <span style={{ fontSize: 28 }}>▶️</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>YouTube'da takip et!</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>@aofseslinotlar — sesli anlatımlar, özetler</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>›</span>
          </a>
        </div>

        {/* Geçtim mi? Modal */}
        {showPassCheck && (
          <div style={s.modalOverlay} onClick={() => setShowPassCheck(false)}>
            <div style={{ ...s.modalBox, maxWidth: 360 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#1f2937', marginBottom: 4 }}>🎓 Başarı Notu Hesapla</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                Vize notunu gir, final puanınla birlikte hesaplayalım.<br/>
                <span style={{ fontSize: 12 }}>Vize %30 + Final %70 ≥ 35 → Geçtin!</span>
              </div>

              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Vize Notun (0–100)</label>
              <input
                type="number" min="0" max="100"
                placeholder="örn: 60"
                value={vizeInput}
                onChange={e => { setVizeInput(e.target.value); setPassResult(null); }}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #d1d5db', fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
              />

              {/* Final puanı bilgi satırı */}
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, background: '#f9fafb', borderRadius: 10, padding: '9px 12px' }}>
                📊 Bu sınavdaki final puanın: <strong style={{ color: GREEN }}>{r.puan} / 100</strong>
              </div>

              <button
                style={{ ...s.btn, background: GREEN, color: '#fff', marginBottom: 8 }}
                onClick={() => {
                  const vize = parseFloat(vizeInput);
                  if (isNaN(vize) || vize < 0 || vize > 100) return;
                  const ortalama = vize * 0.30 + r.puan * 0.70;
                  setPassResult({ ortalama: ortalama.toFixed(1), gecti: ortalama >= 35 });
                }}
              >
                Hesapla
              </button>

              {passResult && (
                <div style={{
                  borderRadius: 14, padding: '14px 16px', textAlign: 'center',
                  background: passResult.gecti ? '#d1fae5' : '#fee2e2',
                  color: passResult.gecti ? '#065f46' : '#991b1b',
                  fontWeight: 800, fontSize: 16, marginBottom: 8,
                }}>
                  {passResult.gecti ? '🎉 Tebrikler, geçtin!' : '📚 Maalesef geçemedin.'}
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 6 }}>
                    Ortalamanız: <strong>{passResult.ortalama}</strong> / 100
                    {!passResult.gecti && <span style={{ display: 'block', marginTop: 4, fontWeight: 500, fontSize: 12 }}>Geçmek için en az 35 gerekiyor.</span>}
                  </div>
                </div>
              )}

              <button style={{ ...s.btn, background: '#f3f4f6', color: '#374151', marginTop: 0 }} onClick={() => setShowPassCheck(false)}>Kapat</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const sendCourseRequest = async () => {
    if (!courseRequestText.trim()) return;
    try {
      await fetch(API + '/api/course-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_name: courseRequestText.trim() })
      });
    } catch (e) {}
    setCourseRequestSent(true);
    setTimeout(() => {
      setCourseRequestText('');
      setCourseRequestSent(false);
    }, 2000);
  };

  if (screen === 'pdf-download') {
    return (
      <div style={s.bg}>
        <div style={s.container}>
          <div style={s.header}>
            <button style={s.backBtn} onClick={() => setScreen('home')}>← Geri</button>
            <div style={s.greeting}>Ders Kitapları</div>
            <div style={{ width: 60 }}></div>
          </div>

          <div style={s.card}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 10 }}>📚</div>
            <div style={s.cardTitle}>Derslerini Seç</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Seçtiğin dersleri size e-posta olarak göndereceğiz. En fazla 3 ders seçebilirsin.
            </div>

            {pdfCourses.length === 0 ? (
              <div style={s.empty}>Henüz ders notu eklenmemiş.</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {pdfCourses.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, marginBottom: 8, cursor: 'pointer', background: pdfSelected.some(p => p.id === c.id) ? '#f0faf4' : '#fff' }}>
                    <input
                      type="checkbox"
                      style={{ width: 18, height: 18, marginRight: 12, accentColor: GREEN }}
                      checked={pdfSelected.some(p => p.id === c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (pdfSelected.length >= 3) return alert('En fazla 3 ders seçebilirsiniz!');
                          setPdfSelected([...pdfSelected, c]);
                        } else {
                          setPdfSelected(pdfSelected.filter(p => p.id !== c.id));
                        }
                        setPdfResult(null);
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{c.name}</span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-posta Adresin</label>
              <input
                type="email"
                placeholder=""
                value={pdfEmail}
                onChange={e => { setPdfEmail(e.target.value); setPdfResult(null); }}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #d1d5db', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={pdfKvkk} onChange={e => { setPdfKvkk(e.target.checked); setPdfResult(null); }} style={{ width: 16, height: 16, marginRight: 10, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                E-posta adresimin kampanya ve duyurular (YouTube vs.) için kaydedilmesini ve bana e-posta gönderilmesini onaylıyorum.
              </span>
            </label>

            {pdfResult === 'success' && (
              <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
                ✅ Notların başarıyla e-postana gönderildi! Lütfen Spam (Gereksiz) kutunu da kontrol et.
              </div>
            )}
            {pdfResult && pdfResult !== 'success' && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
                ❌ {pdfResult}
              </div>
            )}

            <button
              style={{ ...s.btn, background: (pdfSending || pdfSelected.length === 0 || !pdfEmail || !pdfKvkk) ? '#e5e7eb' : GREEN, color: (pdfSending || pdfSelected.length === 0 || !pdfEmail || !pdfKvkk) ? '#9ca3af' : '#fff', cursor: (pdfSending || pdfSelected.length === 0 || !pdfEmail || !pdfKvkk) ? 'not-allowed' : 'pointer', fontSize: 16, padding: '16px' }}
              disabled={pdfSending || pdfSelected.length === 0 || !pdfEmail || !pdfKvkk}
              onClick={async () => {
                setPdfSending(true);
                try {
                  const payload = {
                    email: pdfEmail.trim(),
                    dersler: pdfSelected.map(c => ({ ad: c.name, link: c.drive_link }))
                  };
                  const res = await fetch(API + '/api/send-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  if (res.ok) {
                    setPdfResult('success');
                    setPdfSelected([]);
                    setPdfEmail('');
                    setPdfKvkk(false);
                  } else {
                    const err = await res.json().catch(() => null);
                    setPdfResult(err?.error || 'Bir hata oluştu.');
                  }
                } catch (e) {
                  setPdfResult('Bir hata oluştu. Lütfen tekrar deneyin.');
                }
                setPdfSending(false);
              }}
            >
              {pdfSending ? 'Gönderiliyor ⏳' : 'Notları Mailime Gönder 🚀'}
            </button>
          </div>

          {/* Ders İsteği Diyalog Kutusu */}
          <div style={s.card}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>📝</div>
            <div style={s.cardTitle}>Görmek İstediğiniz Dersi Bize Yazın</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Listede olmayan bir ders mi var? Aşağıya yazın, en çok istenen dersleri ekleyelim!
            </div>

            {courseRequestSent ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 40 }}>✅</div>
                <div style={{ fontWeight: 700, color: '#065f46', marginTop: 8 }}>İsteğiniz alındı, teşekkürler!</div>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Ders adını yazın (örn: İşletme Yönetimi)"
                  value={courseRequestText}
                  onChange={e => setCourseRequestText(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
                  rows={2}
                />
                <button
                  style={{ ...s.btn, background: courseRequestText.trim() ? GREEN : '#e5e7eb', color: courseRequestText.trim() ? '#fff' : '#9ca3af', cursor: courseRequestText.trim() ? 'pointer' : 'not-allowed' }}
                  disabled={!courseRequestText.trim()}
                  onClick={sendCourseRequest}
                >
                  Gönder 🚀
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    );
  }

  return null;
}

// ── PDF Not İndir ekranı ayrı component olarak eklendi (App içinde)
// Yukarıda App fonksiyonu içine zaten eklendi (screen === 'pdf-download' bloğu)

const GREEN = '#1a6b3c';
const GREEN_DARK = '#0f3d22';
const GREEN_LIGHT = '#22c55e';

const s = {
  bg: { minHeight: '100dvh', background: `linear-gradient(160deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px 16px' },
  splashBox: { background: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, textAlign: 'center', marginTop: 60, backdropFilter: 'blur(10px)' },
  logo: { width: 80, height: 80, objectFit: 'contain', marginBottom: 8 },
  logoText: { fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6 },
  logoSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 28 },
  tabRow: { display: 'flex', marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.2)' },
  tab: { flex: 1, padding: '10px 0', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  tabActive: { flex: 1, padding: '10px 0', border: 'none', background: '#fff', color: GREEN, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  input: { width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 15, marginBottom: 10, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#fff', color: GREEN, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 },
  btnOutline: { width: '100%', padding: 14, borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 10 },
  errMsg: { background: 'rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 10, textAlign: 'left' },
  container: { width: '100%', maxWidth: 480, paddingBottom: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 8 },
  greeting: { fontSize: 20, fontWeight: 800, color: '#fff' },
  feedbackIconBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '7px 10px', color: '#fff', fontSize: 14, cursor: 'pointer' },
  logoutBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '7px 12px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  headerLogo: { width: 36, height: 36, objectFit: 'contain', borderRadius: 8 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modalBox: { background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontWeight: 800, fontSize: 18, color: '#1f2937', marginBottom: 6 },
  feedbackInput: { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' },
  card: { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontWeight: 800, fontSize: 16, marginBottom: 12, color: '#1f2937' },
  cardTitle2: { fontWeight: 800, fontSize: 15, marginBottom: 10, color: '#fff' },
  lbRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14, color: '#1f2937' },
  lbScore: { fontWeight: 700, color: GREEN },
  myRankBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, background: `${GREEN}15`, borderRadius: 10, padding: '10px 12px', fontSize: 14, color: GREEN, fontWeight: 600 },
  myRankBoxGray: { marginTop: 12, background: '#f9fafb', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  empty: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: 20, fontSize: 14 },
  catBtn: { width: '100%', background: '#fff', borderRadius: 14, padding: '14px 18px', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 8, color: '#1f2937' },
  catArrow: { color: GREEN, fontWeight: 900, fontSize: 18 },
  yearBar: { background: 'rgba(0,0,0,0.2)', padding: '6px 12px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, WebkitOverflowScrolling: 'touch' },
  yearBtn: { padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  yearBtnActive: { background: '#fff', color: GREEN, border: '1px solid #fff' },
  quizBg: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(160deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  quizHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', flexShrink: 0, maxWidth: 600, margin: '0 auto', width: '100%' },
  backBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  progress: { color: '#fff', fontWeight: 700, fontSize: 14 },
  rankBadge: { background: GREEN_LIGHT, borderRadius: 20, padding: '4px 12px', color: '#fff', fontWeight: 700, fontSize: 12 },
  quizScroll: { flex: 1, overflowY: 'auto', padding: '0 16px', WebkitOverflowScrolling: 'touch', paddingBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  quizCard: { background: '#fff', borderRadius: 20, padding: '18px 16px', marginBottom: 10, width: '100%', maxWidth: 600, boxSizing: 'border-box' },
  catLabel: { fontSize: 11, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: 1 },
  qText: { fontSize: 15, color: '#1f2937', lineHeight: 1.7 },
  divider: { height: 1, background: '#f3f4f6', margin: '12px 0' },
  optBtn: { width: '100%', padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 400, fontSize: 14, textAlign: 'left', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 },
  optLetter: { borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 },
  optText: { flex: 1, lineHeight: 1.4 },
  tapHint: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4, marginBottom: 4 },
  freqBadge: { background: '#fef3c7', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#92400e' },
  yearBadge: { background: '#ede9fe', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#5b21b6' },
  resultEmoji: { textAlign: 'center', fontSize: 50, paddingTop: 10 },
  resultTitle: { textAlign: 'center', fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4, marginBottom: 4 },
  resultCard: { background: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, marginTop: 8 },
  resultRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14, color: '#1f2937' },
  gectiBox: { background: '#d1fae5', borderRadius: 10, padding: '10px 12px', color: '#065f46', fontWeight: 700, fontSize: 13, marginTop: 8 },
  kaldiBox: { background: '#fef3c7', borderRadius: 10, padding: '10px 12px', color: '#92400e', fontWeight: 600, fontSize: 13, marginTop: 8 },
  rankResult: { textAlign: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8, color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 12 },
  examTabRow: { display: 'flex', gap: 8, margin: '16px 0', background: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 16 },
  examTab: { flex: 1, padding: '14px 10px', borderRadius: 12, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.3s' },
  examTabActiveVize: { flex: 1, padding: '14px 10px', borderRadius: 12, border: 'none', background: '#fff', color: GREEN, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s' },
  examTabActiveFinal: { flex: 1, padding: '14px 10px', borderRadius: 12, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s' },
  examTabActiveYazOkulu: { flex: 1, padding: '14px 10px', borderRadius: 12, border: 'none', background: '#eab308', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s' },
  examDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 20, textAlign: 'center', fontStyle: 'italic', lineHeight: 1.4 },
};

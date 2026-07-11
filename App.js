import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Varsa kendi API sunucunu buraya yaz, şu an boş bırakıldığı için bağlantı hatası veriyordu:
const API = 'https://aofnotlar.com';
const SHOPIER_URL = 'https://www.shopier.com/aofseslinotlar';

// Sınav türü adı regex — her seferinde yeni instance (global /g regex stateful, lastIndex sorununu önler)
const getExamTypeRegex = () => /\s*\(\s*(Vize|Final|Yaz okulu|[Vv]ize|[Ff]inal|[Yy]az [Oo]kulu)\s*\)\s*/g;

// ── VEKTÖREL SİMGE BİLEŞENLERİ (UI/UX Pro Max)
const IconChevronRight = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="9 18 15 12 9 6"/></svg>
);

const IconChevronLeft = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="15 18 9 12 15 6"/></svg>
);

const IconHome = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const IconBookOpen = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);

const IconFileText = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
);

const IconTarget = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);

const IconBarChart = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);

const IconZap = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

const IconPhone = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
);

const IconPlay = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

const IconCalculator = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
);

const IconEdit = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

const IconMoon = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);

const IconSun = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);

const IconMessageSquare = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

const IconKey = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
);

const IconUser = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const IconRefresh = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
);

const IconGraduationCap = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
);

const IconAward = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
);

const IconCheckCircle = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const IconXCircle = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

const IconFlag = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
);

const IconHelpCircle = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

const IconBell = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
);

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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('demo_theme') || 'dark';
  });

  const [screen, setScreen] = useState('home');
  const [showHeroBanner, setShowHeroBanner] = useState(true);
  const [showStickyBottom, setShowStickyBottom] = useState(true);
  const [prevScreen, setPrevScreen] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(null);
  // Önbellekten anında yükle — yavaş bağlantıda ders listesi saniyelerce boş kalmasın
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('categories_cache')) || []; } catch { return []; }
  });
  const [catsLoaded, setCatsLoaded] = useState(false);
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
  const [quizLoading, setQuizLoading] = useState(false);
  const [loadingCatId, setLoadingCatId] = useState(null);
  // Hızlı ardışık yıl/kategori tıklamalarında geç gelen eski cevabın yenisini ezmesini önler
  const fetchSeqRef = useRef(0);

  // Vize / Final seçimi
  const [examType, setExamType] = useState('yazokulu');

  // Feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);

  // Hatalı soru bildirme
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // ── NOT HESAPLA MODALI
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

  // Ücretsiz Özet Ders Notu İndir
  const [pdfNotes, setPdfNotes] = useState([]);
  const [notesSelected, setNotesSelected] = useState([]);
  const [notesEmail, setNotesEmail] = useState('');
  const [notesKvkk, setNotesKvkk] = useState(false);
  const [notesSending, setNotesSending] = useState(false);
  const [notesResult, setNotesResult] = useState(null); // 'success' | 'error' | null

  const N8N_WEBHOOK = 'BURAYA_N8N_PRODUCTION_URL_GELECEK';

  // Ders isteği
  const [courseRequestText, setCourseRequestText] = useState('');
  const [courseRequestSent, setCourseRequestSent] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('demo_theme', theme);

    // Google Fonts Dinamik Yükleme
    const fontId = 'google-fonts-design-system';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    // Küresel CSS Sınıflarını Dinamik Enjekte Etme
    const styleId = 'global-styles-design-system';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    
    const isDark = theme === 'dark';
    const primary = isDark ? '#10b981' : '#059669';
    const optHoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(5, 150, 105, 0.08)';
    const optHoverBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(5, 150, 105, 0.25)';
    const scrollThumb = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(5, 150, 105, 0.15)';
    const catHoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff';
    const catHoverBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(5, 150, 105, 0.25)';
    const feedbackHoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)';

    styleTag.innerHTML = `
      :root {
        --primary-color: ${primary};
        --opt-hover-bg: ${optHoverBg};
        --opt-hover-border: ${optHoverBorder};
        --scroll-thumb: ${scrollThumb};
      }
      
      .btn-hover {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .btn-hover:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }
      .btn-hover:active {
        transform: translateY(0);
      }
      
      .cat-btn-hover {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .cat-btn-hover:hover {
        background: ${catHoverBg} !important;
        border-color: ${catHoverBorder} !important;
        transform: translateX(2px);
      }
      
      .opt-btn-hover {
        transition: all 0.15s ease !important;
      }
      .opt-btn-hover:hover {
        background: var(--opt-hover-bg) !important;
        border-color: var(--opt-hover-border) !important;
      }
      
      .feedback-btn-hover {
        transition: all 0.2s ease !important;
      }
      .feedback-btn-hover:hover {
        background: ${feedbackHoverBg} !important;
        transform: scale(1.05);
      }
      
      /* Özel kaydırma çubuğu */
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: var(--scroll-thumb);
        border-radius: 10px;
      }
      
      /* Erişilebilirlik odak çerçevesi */
      button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible {
        outline: 2.5px solid var(--primary-color) !important;
        outline-offset: 2px !important;
      }
    `;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
    } else {
      // Token yoksa da liderlik tablosunu auth'suz çağır
      fetchLeaderboard(null);
    }
    // Kategoriler public endpoint (auth gerekmez), her zaman yüklenir
    fetchCategories();
    setScreen('home');
  }, []);

  // Ana sayfaya her dönüşte liderlik tablosunu yenile (token olsa da olmasa da)
  useEffect(() => {
    if (screen === 'home') {
      fetchLeaderboard(token || null);
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
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        try { localStorage.setItem('categories_cache', JSON.stringify(data)); } catch { }
      }
    } catch (e) { }
    setCatsLoaded(true);
  };

  const fetchLeaderboard = async (t) => {
    try {
      const headers = t ? { Authorization: 'Bearer ' + t } : {};
      const res = await fetch(API + '/api/leaderboard/general/top3', { headers });
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
      // Eğer bekleyen kategori varsa direkt aç (token'ı parametre olarak geç - state henüz güncellenmemiş olabilir)
      if (pendingCategory) {
        const cat = pendingCategory;
        setPendingCategory(null);
        openCategoryWithToken(cat, data.token);
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
  const handleCategoryClick = useCallback((cat) => {
    if (!token) {
      setPendingCategory(cat);
      setAnonName('');
      setAuthError('');
      setShowNicknameModal(true);
    } else {
      openCategory(cat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Yıllar + sorular PARALEL çekilir (yıl verilmezse sunucu zaten en son yılı seçiyor) — açılış süresi yarıya iner
  const openCategoryWithToken = async (cat, t, year = null) => {
    const seq = ++fetchSeqRef.current;
    setLoadingCatId(cat.id);
    try {
      const headers = { Authorization: 'Bearer ' + t };
      const qUrl = year
        ? `/api/questions/${cat.id}?year=${encodeURIComponent(year)}&examType=${examType}`
        : `/api/questions/${cat.id}?examType=${examType}`;

      const [yearsRes, qRes] = await Promise.all([
        fetch(API + `/api/questions/years/${cat.id}`, { headers }),
        fetch(API + qUrl, { headers }),
      ]);
      const [years, data] = await Promise.all([yearsRes.json(), qRes.json()]);

      if (seq !== fetchSeqRef.current) return; // daha yeni bir istek başladı, bunu yok say

      setActiveCategory(cat);
      setAvailableYears(years);
      setSelectedYear(year || (years.length > 0 ? years[0] : null));
      setCorrect(0); setWrong(0);
      setCurrentQ(0); setSelected(null);
      setQuestions(data);
      setScreen('quiz');
    } finally {
      if (seq === fetchSeqRef.current) setLoadingCatId(null);
    }
  };

  const openCategory = (cat, year = null) => openCategoryWithToken(cat, token, year);

  const changeYear = async (year) => {
    const seq = ++fetchSeqRef.current;
    setSelectedYear(year);
    setQuizLoading(true);
    try {
      const url = `/api/questions/${activeCategory.id}?year=${encodeURIComponent(year)}&examType=${examType}`;
      const res = await fetch(API + url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (seq !== fetchSeqRef.current) return;
      // Yeni sorular GELDİKTEN sonra tek seferde güncelle — eski sorunun bir an görünmesini önler
      setCorrect(0); setWrong(0);
      setCurrentQ(0); setSelected(null);
      setQuestions(data);
    } finally {
      if (seq === fetchSeqRef.current) setQuizLoading(false);
    }
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

    // Cevabı kaydet + kullanıcı/liderlik yenilemeyi paralel çalıştır (UI'ı bloklamasın)
    fetch(API + '/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ question_id: q.id, is_correct: isCorrect, category_id: activeCategory.id })
    }).then(() => {
      // Arka planda parallel güncelle
      Promise.all([refreshUser(token), fetchLeaderboard(token)]).catch(() => {});
    }).catch(() => {});
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

    let processedText = text;
    
    // 1. Eğer metin \n içermiyorsa veya yan yana yazılmış roman rakamları varsa önce onları satırlara böl
    if (!text.includes('\n') && /^\s*(I{1,3}|IV|VI{0,3}|VIII|IX|X{0,3})\.\s/.test(text.trim())) {
      // II. III. IV. V. vb. roman rakamlarının önüne \n ekle
      processedText = text.replace(/\s+(II{0,2}|IV|VI{0,3}|VIII|IX|X{1,3})\.\s+/g, '\n$1. ');
    }

    // 2. Öncüllerden sonra gelen soru kökünü ("Yukarıdakilerden...", "Buna göre...", "Verilenlerden..." vb.) yeni satıra böl
    // Bu işlem hem \n ile bölünmüş hem de tek satır gelen tüm sorularda çalışır.
    const questionKeywords = [
      'Yukarıdakilerden', 'Yukarıdaki', 'Yukarıda', 'Verilenlerden', 'Verilen', 'Verilenlerin',
      'Buna göre', 'Buna', 'Aşağıdakilerden', 'Aşağıdaki', 'Bu', 'Hangisi', 'Hangileri', 'Hangi'
    ];
    
    // Regex dinamik olarak bu kelimelerin önüne \n koyar (eğer zaten satır başı değillerse)
    const regexPattern = new RegExp(`\\s+(${questionKeywords.join('|')})\\s+`, 'g');
    processedText = processedText.replace(regexPattern, '\n$1 ');

    return processedText.split('\n').map((line, i, arr) => {
      const isMadde = /^(I{1,3}V?|IV|VI{0,3}|IX|[IVX]{1,4})[\s\-\–\.]/i.test(line.trim()) || /^[-–•]\s/.test(line.trim());
      const isLast = i === arr.length - 1;
      const isOnly = arr.length === 1;
      return (
        <div key={i} style={{
          fontWeight: (isLast || isOnly) ? 500 : 400,
          paddingLeft: isMadde ? 4 : 0,
          marginBottom: isMadde ? 2 : (isLast ? 0 : 6),
          fontSize: 15,
        }}>{line}</div>
      );
    });
  };

  // ── FAVORİ EKLE/ÇIKAR FONKSİYONU
  const toggleFavorite = useCallback((e, catId) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavs = prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId];
      localStorage.setItem('favs', JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  // Kategorileri favorilere göre sırala (Favoriler en üstte) — memoized
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [categories, favorites]);

  // Stylesheet dynamic generator — memoized (sadece theme değişince yeniden üretilir)
  const s = useMemo(() => getStyles(theme), [theme]);


  // Filtrelenmiş + temizlenmiş kategori listesi — memoized
  const filteredCategoryNodes = useMemo(() => {
    return sortedCategories
      .filter(cat => {
        const nameLower = cat.name.toLowerCase();
        const hasVize = nameLower.includes('vize');
        const hasFinal = nameLower.includes('final');
        if (examType === 'vize') return hasVize || (!hasVize && !hasFinal && !nameLower.includes('yaz okulu'));
        if (examType === 'final') return hasFinal || (!hasVize && !hasFinal && !nameLower.includes('yaz okulu'));
        if (examType === 'yazokulu') return nameLower.includes('yaz okulu');
        return true;
      })
      .map(cat => {
        const cleanName = cat.name.replace(getExamTypeRegex(), '').trim();
        const isFav = favorites.includes(cat.id);
        const isLoading = loadingCatId === cat.id;
        return (
          <button key={cat.id} style={{ ...s.catBtn, opacity: isLoading ? 0.55 : 1 }} className="cat-btn-hover" onClick={() => handleCategoryClick(cat)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                onClick={(e) => { e.stopPropagation(); toggleFavorite(e, cat.id); }}
                style={{ fontSize: 18, cursor: 'pointer', color: isFav ? '#fbbf24' : (theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'), transition: '0.2s', paddingRight: 4, transform: isFav ? 'scale(1.1)' : 'scale(1)' }}
              >
                {isFav ? '★' : '☆'}
              </div>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{cleanName}</span>
            </div>
            <span style={s.catArrow}>
              <IconChevronRight size={16} />
            </span>
          </button>
        );
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedCategories, examType, favorites, s, theme, handleCategoryClick, toggleFavorite, loadingCatId]);

  // ════════════════════════════════════════════════════════════
  // EKRANLAR
  // ════════════════════════════════════════════════════════════

  if (screen === 'home') return (
    <div style={s.bg}>
      {/* Background Ambient Glows */}
      {/* position: fixed — sayfa kaydırma yüksekliğine karışmaz, kaydırma sırasında yeniden çizilmez */}
      <div style={{
        position: 'fixed',
        width: 700,
        height: 700,
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0) 70%)'
          : 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, rgba(5,150,105,0) 70%)',
        top: -225,
        left: -225,
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'opacity 0.5s ease'
      }} />
      <div style={{
        position: 'fixed',
        width: 600,
        height: 600,
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0) 70%)'
          : 'radial-gradient(circle, rgba(217,119,6,0.06) 0%, rgba(217,119,6,0) 70%)',
        bottom: -150,
        right: -200,
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'opacity 0.5s ease'
      }} />

      <div style={s.container}>
        {showHeroBanner && (
          <div style={s.heroBanner} onClick={() => { setPrevScreen('home'); setScreen('product-detail'); }}>
            <span style={s.heroText}>💡 Vakti Olmayanlara Özet Çalışma Sayfaları →</span>
            <button style={s.heroClose} onClick={(e) => { e.stopPropagation(); setShowHeroBanner(false); }} aria-label="Kapat">&times;</button>
          </div>
        )}

        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={s.greeting}>{user?.username ? `Hoşgeldin, ${user.username}! 👋` : 'Hoşgeldin!'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={s.feedbackIconBtn} onClick={toggleTheme} title="Temayı Değiştir">
              {theme === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />}
            </button>
            <a href="https://t.me/+whse8tbDgac0OTU0" target="_blank" rel="noopener noreferrer" style={{ ...s.feedbackIconBtn, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Telegram Grubumuz">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"/>
              </svg>
            </a>
            <button style={s.feedbackIconBtn} onClick={() => { setShowFeedback(true); loadMyFeedbacks(); }} title="Geri Bildirim / Ders İste">
              <IconMessageSquare size={18} />
            </button>
            {user && <button style={s.logoutBtn} onClick={logout}>Çıkış</button>}
          </div>
        </div>

        {showNicknameModal && (
          <div style={s.modalOverlay} onClick={() => setShowNicknameModal(false)}>
            <div style={{ ...s.modalBox, maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <IconUser size={48} style={{ color: theme === 'dark' ? '#10b981' : '#059669', marginBottom: 8, display: 'block', margin: '0 auto 8px auto' }} />
              <div style={s.modalTitle}>Kullanıcı Adı Seç</div>
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 20 }}>Liderlik tablosunda bu isimle görüneceksin</div>
              <input style={s.input}
                placeholder="Kullanıcı adın (örn: AhmetAOF)"
                value={anonName} onChange={e => setAnonName(e.target.value.slice(0, 15))}
                onKeyDown={e => e.key === 'Enter' && handleAnonymous()} maxLength={15} />
              {authError && <div style={s.errMsg}>⚠️ {authError}</div>}
              <button style={s.btn} className="btn-hover" onClick={handleAnonymous}>
                <IconPlay size={16} style={{ marginRight: 6 }} />
                <span>Başla</span>
              </button>
              <button style={s.btnOutline} className="btn-hover" onClick={() => setShowNicknameModal(false)}>İptal</button>
            </div>
          </div>
        )}

        {showFeedback && (
          <div style={s.modalOverlay} onClick={() => setShowFeedback(false)}>
            <div style={s.modalBox} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...s.modalTitle }}>
                <IconMessageSquare size={20} style={{ color: theme === 'dark' ? '#10b981' : '#059669' }} />
                <span>Geri Bildirim / Ders İsteği</span>
              </div>
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 12 }}>Görüşlerini yaz, ders isteğinde bulun!</div>
              {feedbackSent ? (
                <IconCheckCircle size={48} style={{ color: '#10b981', display: 'block', margin: '16px auto' }} />
              ) : (
                <>
                  <textarea style={s.feedbackInput} placeholder="Mesajını buraya yaz..."
                    value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3} />
                  <button style={{ ...s.btn, color: '#fff', marginTop: 8 }} className="btn-hover" onClick={sendFeedback}>Gönder</button>
                  <button style={{ ...s.btnOutline, marginTop: 8 }} className="btn-hover" onClick={() => setShowFeedback(false)}>İptal</button>
                </>
              )}

              {myFeedbacks.length > 0 && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb'}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 10 }}>GEÇMİŞ GERİ BİLDİRİMLERİN</div>
                  {myFeedbacks.map((f, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: 10, borderLeft: `3px solid ${f.is_read ? '#10b981' : '#f59e0b'}`, borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#e5e7eb'}`, borderRight: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#e5e7eb'}`, borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#e5e7eb'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.is_read ? '#10b981' : '#d97706', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {f.is_read ? (
                            <>
                              <IconCheckCircle size={12} />
                              <span>Dikkate Alındı</span>
                            </>
                          ) : (
                            <>
                              <IconRefresh size={12} style={{ animation: 'spin 2s linear infinite' }} />
                              <span>İnceleniyor</span>
                            </>
                          )}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(f.created_at).toLocaleDateString('tr')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: s.qText.color, lineHeight: 1.4 }}>{f.message}</div>
                      {f.admin_reply && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '6px 10px', background: '#d1fae5', borderRadius: 8, fontSize: 12, color: '#065f46' }}>
                          <IconBell size={12} />
                          <span>{f.admin_reply}</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...s.cardTitle }}>
            <IconAward size={20} style={{ color: '#f59e0b' }} />
            <span>Bugünün Liderleri</span>
          </div>

          {/* GÜNÜN ŞAKASI BURAYA EKLENDİ */}
          {top3.length > 0 && (
            <div style={{ fontWeight: '600', color: theme === 'dark' ? '#fde68a' : '#d97706', marginBottom: 12, textAlign: 'center', background: theme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#fef3c7', padding: '10px', borderRadius: 10, fontSize: 13, lineHeight: 1.4, border: theme === 'dark' ? '1px dashed rgba(245, 158, 11, 0.3)' : 'none' }}>
              {getDailyJoke(top3[0]?.username)}
            </div>
          )}

          {(!top3 || top3.length === 0) ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>Henüz soru çözülmedi. İlk sen ol!</div>
          ) : top3.map((p, i) => (
            <div key={i} style={s.lbRow}>
              <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {p.username}</span>
              <span style={s.lbScore}>{p.total_score} XP</span>
            </div>
          ))}
          {myRank
            ? <div style={s.myRankBox}><span><IconTarget size={14} style={{ marginRight: 6, color: theme === 'dark' ? '#10b981' : '#059669', display: 'inline', verticalAlign: 'middle' }} />Sen bugün <strong>{myRank}. sıradasın</strong></span><span style={s.lbScore}>{myLeaderboardScore} XP</span></div>
            : <div style={s.myRankBoxGray}>Soru çöz, sıralamada görün! <IconTarget size={14} style={{ marginLeft: 4, display: 'inline', verticalAlign: 'middle' }} /></div>
          }
        </div>

        {/* PDF Not İndir Butonu */}
        <button
          className="btn-hover"
          style={{
            width: '90%',
            maxWidth: '340px',
            margin: '0 auto 10px auto',
            background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(5, 150, 105, 0.05)',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(5, 150, 105, 0.15)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            color: s.greeting.color,
            fontWeight: 500,
            fontSize: 13,
            transition: 'all 0.2s'
          }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconFileText size={16} style={{ color: theme === 'dark' ? '#10b981' : '#059669' }} />
            <span>Ücretsiz Ders Kitabı İndir</span>
          </div>
          <IconChevronRight size={16} style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(5, 150, 105, 0.5)' }} />
        </button>

        {/* Özet Ders Notu İndir Butonu */}
        <button
          className="btn-hover"
          style={{
            width: '90%',
            maxWidth: '340px',
            margin: '0 auto 10px auto',
            background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(5, 150, 105, 0.05)',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(5, 150, 105, 0.15)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            color: s.greeting.color,
            fontWeight: 500,
            fontSize: 13,
            transition: 'all 0.2s'
          }}
          onClick={async () => {
            try {
              const res = await fetch(API + '/api/pdf-notes');
              const data = await res.json();
              setPdfNotes(data);
              setNotesSelected([]);
              setNotesEmail('');
              setNotesKvkk(false);
              setNotesResult(null);
              setScreen('notes-download');
            } catch (e) { alert('Özet notlar yüklenemedi'); }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconFileText size={16} style={{ color: theme === 'dark' ? '#10b981' : '#059669' }} />
            <span>Ücretsiz Özet Ders Notu İndir</span>
          </div>
          <IconChevronRight size={16} style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(5, 150, 105, 0.5)' }} />
        </button>

        {/* PDF Satış Yönlendirme Butonu */}
        <button
          className="btn-hover"
          style={{
            width: '90%',
            maxWidth: '340px',
            margin: '0 auto 16px auto',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            boxShadow: '0 3px 10px rgba(245, 158, 11, 0.15)',
            transition: 'all 0.2s'
          }}
          onClick={() => {
            setPrevScreen('home');
            setScreen('product-detail');
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconBookOpen size={16} />
            <span>AÖF'ü Geçiren Pratik Özetler</span>
          </div>
          <IconChevronRight size={16} style={{ color: 'rgba(255,255,255,0.8)' }} />
        </button>
 
        <div style={s.cardTitle2} id="pratik-yap">Pratik Yap</div>
 
        <div style={s.examTabRow}>
          <button type="button" className="btn-hover" style={examType === 'vize' ? s.examTabActiveVize : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('vize'); }}>
            <IconFileText size={16} />
            <span>Vize</span>
          </button>
          <button type="button" className="btn-hover" style={examType === 'final' ? s.examTabActiveFinal : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('final'); }}>
            <IconGraduationCap size={16} />
            <span>Final</span>
          </button>
          <button type="button" className="btn-hover" style={examType === 'yazokulu' ? s.examTabActiveYazOkulu : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('yazokulu'); }}>
            <IconSun size={16} />
            <span>Yaz Okulu</span>
          </button>
        </div>

        {categories.length === 0 && <div style={s.empty}>{catsLoaded ? 'Yakında dersler eklenecek...' : 'Dersler yükleniyor...'}</div>}

        {/* KATEGORİLER (Filtrelenmiş ve Temizlenmiş) */}
        <div style={{ minHeight: '65vh', paddingBottom: 40 }}>
          {filteredCategoryNodes}
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
          <button style={s.backBtn} className="btn-hover" onClick={() => setScreen('home')}>
            <IconChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Geri
          </button>
          <div style={s.progress}>{currentQ + 1} / {questions.length}</div>
          <div style={s.rankBadge}>
            <IconAward size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
            <span>{score} XP{myRank ? ` · #${myRank}` : ''}</span>
          </div>
        </div>

        <div style={s.quizScroll} onClick={() => { if (selected) handleNext(); }}>
          <div style={{ ...s.quizCard, opacity: quizLoading ? 0.4 : 1, pointerEvents: quizLoading ? 'none' : 'auto', transition: 'opacity 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
              <div style={{ ...s.catLabel, flex: 1, wordBreak: 'break-word', lineHeight: 1.3 }}>{activeCategory?.name}</div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'nowrap' }}>
                {q.year && <div style={s.yearBadge}>{q.year}</div>}
                {q.frequency > 1 && <div style={s.freqBadge}>🔥 {q.frequency}x</div>}
              </div>
            </div>
            <div style={s.qText}>{formatQuestion(q.question_text)}</div>
            <div style={s.divider} />
            {opts.map((opt, i) => {
              if (!vals[i]) return null;

              // Dynamic themed defaults
              let bg = theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(5, 150, 105, 0.03)';
              let border = theme === 'dark' ? '1.5px solid rgba(255, 255, 255, 0.06)' : '1.5px solid rgba(5, 150, 105, 0.12)';
              let color = theme === 'dark' ? '#f9fafb' : '#0c2619';
              let letterBg = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(5, 150, 105, 0.08)';
              let letterColor = theme === 'dark' ? '#aeb5c1' : '#4b5563';
              
              if (selected) {
                if (opt.toLowerCase() === q.correct_option.toLowerCase()) { 
                  bg = theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.08)'; 
                  border = theme === 'dark' ? '1.5px solid #10b981' : '1.5px solid #059669'; 
                  color = theme === 'dark' ? '#a7f3d0' : '#046a4e'; 
                  letterBg = theme === 'dark' ? '#10b981' : '#059669'; 
                  letterColor = '#fff'; 
                }
                else if (opt === selected) { 
                  bg = theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.08)'; 
                  border = theme === 'dark' ? '1.5px solid #ef4444' : '1.5px solid #dc2626'; 
                  color = theme === 'dark' ? '#fca5a5' : '#b91c1c'; 
                  letterBg = theme === 'dark' ? '#ef4444' : '#dc2626'; 
                  letterColor = '#fff'; 
                }
              }
              return (
                <button key={opt} className="opt-btn-hover" style={{ ...s.optBtn, background: bg, border, color }}
                  onClick={e => { e.stopPropagation(); if (selected) handleNext(); else handleAnswer(opt); }}>
                  <span style={{ ...s.optLetter, background: letterBg, color: letterColor }}>{opt}</span>
                  <span style={s.optText}>{vals[i]}</span>
                </button>
              );
            })}
          </div>
          {/* Alt butonlar: her zaman ikisi de görünür */}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 4 }}>
             {/* Hatalı soru bildir — tema'ya duyarlı renkler (gündüz/gece modu desteği) */}
            <button
              className="btn-hover"
              style={{
                flex: 1,
                background: selected
                  ? (theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)')
                  : 'transparent',
                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.14)',
                borderRadius: 12,
                padding: '9px 14px',
                color: theme === 'dark' ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.45)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.25s',
              }}
              onClick={e => { e.stopPropagation(); setShowReportModal(true); }}
            >
              <IconFlag size={13} />
              <span>Hatalı bildir</span>
            </button>

            {/* Bu soruyu geç — sadece cevap verilmemişken aktif, tema'ya duyarlı */}
            {!selected && (
              <button
                className="btn-hover"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.14)',
                  borderRadius: 12,
                  padding: '9px 14px',
                  color: theme === 'dark' ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.45)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: 0.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.25s',
                }}
                onClick={e => { e.stopPropagation(); handleNext(); }}
              >
                <span>Bu soruyu geç</span>
                <IconChevronRight size={13} />
              </button>
            )}
          </div>
          {showReportModal && (
            <div style={s.modalOverlay}
              onClick={() => setShowReportModal(false)}>
              <div style={s.modalBox}
                onClick={e => e.stopPropagation()}>
                {reportSent ? (
                  <IconCheckCircle size={48} style={{ color: '#10b981', display: 'block', margin: '16px auto' }} />
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...s.modalTitle }}>
                      <IconFlag size={20} style={{ color: theme === 'dark' ? '#ef4444' : '#dc2626' }} />
                      <span>Hatalı Soru Bildir</span>
                    </div>
                    <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 18 }}>Sorunun türünü seç, ekibimize iletilsin.</div>
                    {[
                      { icon: <IconEdit size={20} style={{ color: theme === 'dark' ? '#10b981' : '#059669' }} />, label: 'Yazım / imla hatası', desc: 'Soruda veya seçeneklerde yazım yanlışı var' },
                      { icon: <IconXCircle size={20} style={{ color: theme === 'dark' ? '#ef4444' : '#dc2626' }} />, label: 'Doğru şık yanlış işaretli', desc: 'Cevap anahtarı yanlış görünüyor' },
                      { icon: <IconHelpCircle size={20} style={{ color: '#f59e0b' }} />, label: 'Mantık / içerik hatası', desc: 'Soru mantıksal olarak hatalı veya eksik' },
                    ].map(opt => (
                      <button key={opt.label}
                        className="opt-btn-hover"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: theme === 'dark' ? '1.5px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #e5e7eb', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f9fafb', color: s.qText.color, cursor: 'pointer', textAlign: 'left', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}
                        onClick={() => sendReport(opt.label)}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, width: 24 }}>{opt.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: s.qText.color }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                    <button style={s.btnOutline} className="btn-hover"
                      onClick={() => setShowReportModal(false)}>İptal</button>
                  </>
                )}
              </div>
            </div>
          )}
          <div style={{ height: showStickyBottom ? 84 : 24 }} />
        </div>

        {/* Modül 3: Mobil Sticky Bottom Bar */}
        {showStickyBottom && (
          <div style={{ ...s.stickyBottom, cursor: 'pointer' }} onClick={() => { setPrevScreen('quiz'); setScreen('product-detail'); }}>
            <button style={s.stickyClose} onClick={(e) => { e.stopPropagation(); setShowStickyBottom(false); }} aria-label="Kapat">&times;</button>
            <div style={s.stickyContainer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12, fontWeight: 700 }}>
                <IconZap size={16} style={{ color: '#f59e0b' }} />
                <span>Sınav Sabahı Bilmen Gereken 25 Terim</span>
              </div>
              <IconChevronRight size={18} style={{ color: '#f59e0b' }} />
            </div>
          </div>
        )}
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
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 20px 0' }}>
            {r.puan >= 50 ? (
              <IconAward size={72} style={{ color: '#fbbf24', filter: 'drop-shadow(0 8px 16px rgba(251, 191, 36, 0.2))' }} />
            ) : (
              <IconBookOpen size={72} style={{ color: theme === 'dark' ? '#10b981' : '#059669', filter: 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.2))' }} />
            )}
          </div>
          <div style={s.resultTitle}>{r.puan >= 50 ? 'Harika Sonuç!' : 'Çalışmaya Devam Etmelisin!'}</div>

          <div style={s.resultCard}>
            <div style={s.resultRow}>
              <span>
                <IconCheckCircle size={16} style={{ color: '#10b981', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                <span>Doğru</span>
              </span>
              <strong>{correct}</strong>
            </div>
            <div style={s.resultRow}>
              <span>
                <IconXCircle size={16} style={{ color: '#ef4444', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                <span>Yanlış</span>
              </span>
              <strong>{wrong}</strong>
            </div>
            <div style={s.resultRow}>
              <span>
                <IconBarChart size={16} style={{ color: theme === 'dark' ? '#10b981' : '#059669', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                <span>Puanın</span>
              </span>
              <strong>{r.puan} / 100</strong>
            </div>
            <div style={s.divider} />

            {r.type === 'vize' ? (
              <>
                <div style={s.resultRow}>
                  <span>
                    <IconFileText size={16} style={{ color: theme === 'dark' ? '#10b981' : '#059669', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                    <span>Vize Etkisi (%30)</span>
                  </span>
                  <strong>{r.katki} puan</strong>
                </div>
                <div style={s.kaldiBox}>
                  Dersi geçebilmek için ortalaman en az 35 olmalıdır. Final sınavından <strong>{r.finalMin}</strong> almalısın.
                </div>
              </>
            ) : (
              <>
                <div style={s.resultRow}>
                  <span>
                    <IconGraduationCap size={16} style={{ color: '#f59e0b', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                    <span>Final Etkisi (%70)</span>
                  </span>
                  <strong>{r.katki} puan</strong>
                </div>
                <div style={s.gectiBox}>
                  <IconGraduationCap size={16} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                  <span>Puanın ne kadar yüksekse geçme şansın o kadar artar!</span>
                </div>
              </>
            )}
          </div>

          {myRank && (
            <div style={s.rankResult}>
              <IconTarget size={16} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
              <span>Bugün {myRank}. sıradasın!</span>
            </div>
          )}

          {/* Modül 2: Test Arası / Sonuç Ekranı Kutusu */}
          <div style={{ ...s.promoCard, cursor: 'pointer' }} className="btn-hover" onClick={() => { setPrevScreen('result'); setScreen('product-detail'); }}>
            <div style={s.promoCardAccent}></div>
            <div style={s.promoCardBody}>
              <div style={s.promoCardIconBox}>
                <IconBookOpen size={24} style={s.promoCardIcon} />
              </div>
              <div style={s.promoCardContent}>
                <h3 style={s.promoCardTitle}>Sınavı Şansa Bırakma!</h3>
                <p style={s.promoCardText}>
                  Netlerini artırmak için Sınav Algoritmasına Göre Hazırlanmış Özet PDF'leri İncele ›
                </p>
              </div>
            </div>
          </div>

          {/* Başarı Notu Hesapla - sadece final sınavında */}
          {r.type === 'final' && (
            <button
              className="btn-hover"
              style={{ ...s.btn, background: '#10b981', color: isThemeLight(theme) ? '#fff' : '#030806', marginBottom: 8, fontWeight: 800, justifyContent: 'center' }}
              onClick={() => { setShowPassCheck(true); setPassResult(null); setVizeInput(''); }}
            >
              <IconCalculator size={18} style={{ marginRight: 8 }} />
              <span>Başarı Notu Hesapla</span>
            </button>
          )}

          {/* Dinamik Buton Mantığı */}
          {prevYear ? (
            <button style={s.btn} className="btn-hover" onClick={() => openCategory(activeCategory, prevYear)}>
              <IconChevronLeft size={16} style={{ marginRight: 6 }} />
              <span>Önceki Yıla Geç ({prevYear})</span>
            </button>
          ) : (
            <button style={s.btn} className="btn-hover" onClick={() => openCategory(activeCategory, selectedYear)}>
              <IconRefresh size={16} style={{ marginRight: 6 }} />
              <span>Tekrar Çöz</span>
            </button>
          )}

          <button style={s.btnOutline} className="btn-hover" onClick={() => setScreen('home')}>
            <IconHome size={16} style={{ marginRight: 6 }} />
            <span>Ana Sayfa</span>
          </button>

          {/* YouTube Takip Bölümü */}
          <a
            href="https://www.youtube.com/@aofseslinotlar"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(5, 150, 105, 0.05)', borderRadius: 16,
              padding: '14px 16px', marginTop: 14, textDecoration: 'none',
              border: `1.5px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(5, 150, 105, 0.12)'}`,
            }}
          >
            <div style={{ background: '#ff0000', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconPlay size={16} style={{ color: '#fff', marginLeft: 2 }} />
            </div>
            <div>
              <div style={{ color: s.greeting.color, fontWeight: 800, fontSize: 14 }}>YouTube'da takip et!</div>
              <div style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.55)' : '#4b5563', fontSize: 12, marginTop: 2 }}>@aofseslinotlar — sesli anlatımlar, özetler</div>
            </div>
            <IconChevronRight size={18} style={{ marginLeft: 'auto', color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#059669' }} />
          </a>
        </div>

        {/* Geçtim mi? Modal */}
        {showPassCheck && (
          <div style={s.modalOverlay} onClick={() => setShowPassCheck(false)}>
            <div style={{ ...s.modalBox, maxWidth: 360 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 900, fontSize: 18, color: s.qText.color, marginBottom: 4 }}>🎓 Başarı Notu Hesapla</div>
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 16 }}>
                Vize notunu gir, final puanınla birlikte hesaplayalım.<br/>
                <span style={{ fontSize: 12 }}>Vize %30 + Final %70 ≥ 35 → Geçtin!</span>
              </div>

              <label style={{ fontSize: 13, fontWeight: 700, color: s.qText.color, display: 'block', marginBottom: 6 }}>Vize Notun (0–100)</label>
              <input
                type="number" min="0" max="100"
                placeholder="örn: 60"
                value={vizeInput}
                onChange={e => { setVizeInput(e.target.value); setPassResult(null); }}
                style={s.input}
              />

              {/* Final puanı bilgi satırı */}
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 14, background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: 10, padding: '9px 12px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid #e5e7eb' }}>
                📊 Bu sınavdaki final puanın: <strong style={{ color: theme === 'dark' ? '#10b981' : '#059669' }}>{r.puan} / 100</strong>
              </div>

              <button
                style={{ ...s.btn, background: '#10b981', color: isThemeLight(theme) ? '#fff' : '#030806', marginBottom: 8 }}
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
                  background: passResult.gecti ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${passResult.gecti ? '#10b981' : '#ef4444'}`,
                  color: passResult.gecti ? (theme === 'dark' ? '#a7f3d0' : '#046a4e') : (theme === 'dark' ? '#fca5a5' : '#b91c1c'),
                  fontWeight: 800, fontSize: 16, marginBottom: 8,
                }}>
                  {passResult.gecti ? '🎉 Tebrikler, geçtin!' : '📚 Maalesef geçemedin.'}
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 6 }}>
                    Ortalamanız: <strong>{passResult.ortalama}</strong> / 100
                    {!passResult.gecti && <span style={{ display: 'block', marginTop: 4, fontWeight: 500, fontSize: 12 }}>Geçmek için en az 35 gerekiyor.</span>}
                  </div>
                </div>
              )}

              <button style={s.btnOutline} onClick={() => setShowPassCheck(false)}>Kapat</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'product-detail') {
    return (
      <div style={s.bg}>
        <div style={s.container}>
          <div style={s.header}>
            <button style={s.backBtn} className="btn-hover" onClick={() => setScreen(prevScreen || 'home')}>
              <IconChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Geri Dön
            </button>
            <div style={s.greeting}>Özel Özet PDF</div>
            <div style={{ width: 60 }}></div>
          </div>

          <div style={s.card}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img 
                src="/ozet-pdf-gorsel.png" 
                alt="Özet PDF Görseli" 
                style={{ 
                  width: '100%', 
                  maxWidth: 360, 
                  borderRadius: 12, 
                  boxShadow: theme === 'dark' ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.1)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
                  marginBottom: 8
                }} 
              />
            </div>
            
            <div style={s.cardTitle}>AÖF Sınavı Şansa Bırakılmaz!</div>
            <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#4b5563', lineHeight: 1.6, marginBottom: 16 }}>
              Sınav algoritmasına göre hazırlanmış özet PDF notları ile derslerinizi kolayca geçin. Hangi konuların tekrar tekrar sorulduğu çıkmış sorulardan analiz edilerek bu evrak özenle hazırlandı.
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.08)',
              color: theme === 'dark' ? '#a7f3d0' : '#046a4e',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 18,
              border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)'}`
            }}>
              <IconBookOpen size={14} style={{ marginRight: 2 }} />
              10+ Aktif Ders Seçeneği
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <IconTarget size={20} style={{ color: theme === 'dark' ? '#10b981' : '#059669', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Sınav Sabahı Bilmen Gereken 25 Terim:</strong> Sınavdan hemen önce bilmeniz gereken en kritik 25 terim ve tanım elinizin altında.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <IconBarChart size={20} style={{ color: theme === 'dark' ? '#10b981' : '#059669', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Çıkmış Soru Analizi:</strong> Geçmiş sınav soruları analiz edilerek, tekrar tekrar sorulan konular özel bir algoritmayla belirlendi ve damıtıldı.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <IconZap size={20} style={{ color: theme === 'dark' ? '#10b981' : '#059669', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Shopier Güvencesiyle Anında E-posta:</strong> Ödemenizden hemen sonra PDF dosyanız otomatik olarak mail adresinize gönderilir.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <IconPhone size={20} style={{ color: theme === 'dark' ? '#10b981' : '#059669', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Mobil Uyumlu Format:</strong> Telefon, tablet veya bilgisayarınızdan her yerde kolayca çalışabilirsiniz.
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24, marginTop: 24, paddingTop: 20, borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.qText.color, marginBottom: 16, textAlign: 'center' }}>
                Öğrenciler ne diyor?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.05)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)'}`,
                  borderRadius: 12,
                  padding: 12,
                  borderLeft: `4px solid ${theme === 'dark' ? '#10b981' : '#059669'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: theme === 'dark' ? '#10b981' : '#059669' }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.qText.color }}>Atlas</div>
                      <div style={{ fontSize: 11, color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>Yeni</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.qText.color, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "Tek kelimeyle harika 2 yıldır geçemedığim dersi sonunda verdim :)"
                  </div>
                </div>

                <div style={{
                  background: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.05)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)'}`,
                  borderRadius: 12,
                  padding: 12,
                  borderLeft: `4px solid ${theme === 'dark' ? '#10b981' : '#059669'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: theme === 'dark' ? '#10b981' : '#059669' }}>
                      Y
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.qText.color }}>Yyyyy</div>
                      <div style={{ fontSize: 11, color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>Yeni</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.qText.color, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "Uzun zamandır bu kadar iyi ihazırlanmış kaynak bulamıyordum umarm daha fazla ders eklenir 🌸"
                  </div>
                </div>

                <div style={{
                  background: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(5, 150, 105, 0.05)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)'}`,
                  borderRadius: 12,
                  padding: 12,
                  borderLeft: `4px solid ${theme === 'dark' ? '#10b981' : '#059669'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: theme === 'dark' ? '#10b981' : '#059669' }}>
                      S
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.qText.color }}>Serdar</div>
                      <div style={{ fontSize: 11, color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>Yeni</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.qText.color, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "Her kuruşuna değer. Zaten 10 soru yapsam geçiyordum 6 sını sınav sabahı altın bilgiler içinden öğrendim"
                  </div>
                </div>
              </div>
            </div>

            <a href={SHOPIER_URL} target="_blank" rel="noopener noreferrer" className="btn-hover" style={{ ...s.btn, background: '#f59e0b', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, padding: '14px', borderRadius: 14, boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}>
              <span>Shopier ile Hemen Al & İndir</span>
              <IconChevronRight size={18} />
            </a>

            <a 
              href="/ornek-dokuman.pdf" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-hover"
              style={{ 
                ...s.btn, 
                background: theme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.05)', 
                color: theme === 'dark' ? '#fde68a' : '#d97706', 
                border: '1.5px solid #f59e0b', 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8, 
                fontWeight: 800, 
                padding: '13px', 
                borderRadius: 14, 
                marginTop: 12, 
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)', 
                transition: 'all 0.2s' 
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; 
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.05)'; 
                e.currentTarget.style.transform = 'none';
              }}
            >
              <IconFileText size={18} />
              <span>Örnek PDF İndir & İncele</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'pdf-download') {
    return (
      <div style={s.bg}>
        <div style={s.container}>
          <div style={s.header}>
            <button style={s.backBtn} className="btn-hover" onClick={() => setScreen('home')}>
              <IconChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Geri
            </button>
            <div style={s.greeting}>Ders Kitapları</div>
            <div style={{ width: 60 }}></div>
          </div>

          <div style={s.card}>
            <IconBookOpen size={48} style={{ color: theme === 'dark' ? '#10b981' : '#059669', marginBottom: 8, display: 'block', margin: '0 auto 8px auto' }} />
            <div style={s.cardTitle}>Derslerini Seç</div>
            <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 16 }}>
              Seçtiğin dersleri size e-posta olarak göndereceğiz. En fazla 3 ders seçebilirsin.
            </div>

            {pdfCourses.length === 0 ? (
              <div style={s.empty}>Henüz ders notu eklenmemiş.</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {pdfCourses.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', border: theme === 'dark' ? '1.5px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #e5e7eb', borderRadius: 12, marginBottom: 8, cursor: 'pointer', background: pdfSelected.some(p => p.id === c.id) ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#f0faf4') : 'transparent' }}>
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
                    <span style={{ fontSize: 14, fontWeight: 600, color: s.qText.color }}>{c.name}</span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-posta Adresin</label>
              <input
                type="email"
                placeholder=""
                value={pdfEmail}
                onChange={e => { setPdfEmail(e.target.value); setPdfResult(null); }}
                style={s.input}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={pdfKvkk} onChange={e => { setPdfKvkk(e.target.checked); setPdfResult(null); }} style={{ width: 16, height: 16, marginRight: 10, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', lineHeight: 1.4 }}>
                E-posta adresimin kampanya ve duyurular (YouTube vs.) için kaydedilmesini ve bana e-posta gönderilmesini onaylıyorum.
              </span>
            </label>

            {pdfResult === 'success' && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: theme === 'dark' ? '#a7f3d0' : '#065f46', border: '1px solid #10b981', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconCheckCircle size={16} />
                  <span>Notların başarıyla e-postana gönderildi! Lütfen Spam (Gereksiz) kutunu da kontrol et.</span>
                </span>
              </div>
            )}
            {pdfResult && pdfResult !== 'success' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: theme === 'dark' ? '#fca5a5' : '#991b1b', border: '1px solid #ef4444', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconXCircle size={16} />
                  <span>{pdfResult}</span>
                </span>
              </div>
            )}

            <button
              className="btn-hover"
              style={{ ...s.btn, background: (pdfSending || pdfSelected.length === 0 || !pdfEmail || !pdfKvkk) ? '#e5e7eb' : (theme === 'dark' ? '#10b981' : '#059669'), color: (pdfSending || pdfSelected.length === 0 || !pdfEmail || !pdfKvkk) ? '#9ca3af' : (theme === 'dark' ? '#030806' : '#fff'), cursor: (pdfSending || pdfSelected.length === 0 || !pdfEmail || !pdfKvkk) ? 'not-allowed' : 'pointer', fontSize: 16, padding: '16px', justifyContent: 'center' }}
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
              <span>{pdfSending ? 'Gönderiliyor...' : 'Notları Mailime Gönder'}</span>
            </button>
          </div>

          {/* Ders İsteği Diyalog Kutusu */}
          <div style={s.card}>
            <IconEdit size={32} style={{ display: 'block', margin: '0 auto 8px auto', color: theme === 'dark' ? '#10b981' : '#059669' }} />
            <div style={s.cardTitle}>Görmek İstediğiniz Dersi Bize Yazın</div>
            <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 16 }}>
              Listede olmayan bir ders mi var? Aşağıya yazın, en çok istenen dersleri ekleyelim!
            </div>

            {courseRequestSent ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <IconCheckCircle size={40} style={{ color: '#10b981', display: 'block', margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: 700, color: theme === 'dark' ? '#a7f3d0' : '#065f46', marginTop: 8 }}>İsteğiniz alındı, teşekkürler!</div>
              </div>
            ) : (
              <>
                <textarea
                  placeholder="Ders adını yazın (örn: İşletme Yönetimi)"
                  value={courseRequestText}
                  onChange={e => setCourseRequestText(e.target.value)}
                  style={s.feedbackInput}
                  rows={2}
                />
                <button
                  className="btn-hover"
                  style={{ ...s.btn, background: courseRequestText.trim() ? (theme === 'dark' ? '#10b981' : '#059669') : '#e5e7eb', color: courseRequestText.trim() ? (theme === 'dark' ? '#030806' : '#fff') : '#9ca3af', cursor: courseRequestText.trim() ? 'pointer' : 'not-allowed', justifyContent: 'center', marginTop: 12 }}
                  disabled={!courseRequestText.trim()}
                  onClick={sendCourseRequest}
                >
                  <span>Gönder</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    );
  }

  if (screen === 'notes-download') {
    return (
      <div style={s.bg}>
        <div style={s.container}>
          <div style={s.header}>
            <button style={s.backBtn} className="btn-hover" onClick={() => setScreen('home')}>
              <IconChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Geri
            </button>
            <div style={s.greeting}>Özet Ders Notları</div>
            <div style={{ width: 60 }}></div>
          </div>

          <div style={s.card}>
            <IconBookOpen size={48} style={{ color: theme === 'dark' ? '#10b981' : '#059669', marginBottom: 8, display: 'block', margin: '0 auto 8px auto' }} />
            <div style={s.cardTitle}>Derslerini Seç</div>
            <div style={{ fontSize: 13, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', marginBottom: 16 }}>
              Seçtiğin derslerin özet notlarını e-posta olarak göndereceğiz. En fazla 3 ders seçebilirsin.
            </div>

            {pdfNotes.length === 0 ? (
              <div style={s.empty}>Henüz özet notu eklenmemiş.</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {pdfNotes.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', border: theme === 'dark' ? '1.5px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #e5e7eb', borderRadius: 12, marginBottom: 8, cursor: 'pointer', background: notesSelected.some(p => p.id === c.id) ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#f0faf4') : 'transparent' }}>
                    <input
                      type="checkbox"
                      style={{ width: 18, height: 18, marginRight: 12, accentColor: GREEN }}
                      checked={notesSelected.some(p => p.id === c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (notesSelected.length >= 3) return alert('En fazla 3 ders seçebilirsiniz!');
                          setNotesSelected([...notesSelected, c]);
                        } else {
                          setNotesSelected(notesSelected.filter(p => p.id !== c.id));
                        }
                        setNotesResult(null);
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600, color: s.qText.color }}>{c.name}</span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-posta Adresin</label>
              <input
                type="email"
                placeholder=""
                value={notesEmail}
                onChange={e => { setNotesEmail(e.target.value); setNotesResult(null); }}
                style={s.input}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={notesKvkk} onChange={e => { setNotesKvkk(e.target.checked); setNotesResult(null); }} style={{ width: 16, height: 16, marginRight: 10, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: theme === 'dark' ? '#aeb5c1' : '#6b7280', lineHeight: 1.4 }}>
                E-posta adresimin kampanya ve duyurular (YouTube vs.) için kaydedilmesini ve bana e-posta gönderilmesini onaylıyorum.
              </span>
            </label>

            {notesResult === 'success' && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: theme === 'dark' ? '#a7f3d0' : '#065f46', border: '1px solid #10b981', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconCheckCircle size={16} />
                  <span>Notların başarıyla e-postana gönderildi! Lütfen Spam (Gereksiz) kutunu da kontrol et.</span>
                </span>
              </div>
            )}
            {notesResult && notesResult !== 'success' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: theme === 'dark' ? '#fca5a5' : '#991b1b', border: '1px solid #ef4444', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconXCircle size={16} />
                  <span>{notesResult}</span>
                </span>
              </div>
            )}

            <button
              className="btn-hover"
              style={{ ...s.btn, background: (notesSending || notesSelected.length === 0 || !notesEmail || !notesKvkk) ? '#e5e7eb' : (theme === 'dark' ? '#10b981' : '#059669'), color: (notesSending || notesSelected.length === 0 || !notesEmail || !notesKvkk) ? '#9ca3af' : (theme === 'dark' ? '#030806' : '#fff'), cursor: (notesSending || notesSelected.length === 0 || !notesEmail || !notesKvkk) ? 'not-allowed' : 'pointer', fontSize: 16, padding: '16px', justifyContent: 'center' }}
              disabled={notesSending || notesSelected.length === 0 || !notesEmail || !notesKvkk}
              onClick={async () => {
                setNotesSending(true);
                try {
                  const payload = {
                    email: notesEmail.trim(),
                    dersler: notesSelected.map(c => ({ ad: c.name, link: c.drive_link }))
                  };
                  const res = await fetch(API + '/api/send-notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  if (res.ok) {
                    setNotesResult('success');
                    setNotesSelected([]);
                    setNotesEmail('');
                    setNotesKvkk(false);
                  } else {
                    const err = await res.json().catch(() => null);
                    setNotesResult(err?.error || 'Bir hata oluştu.');
                  }
                } catch (e) {
                  setNotesResult('Bir hata oluştu. Lütfen tekrar deneyin.');
                }
                setNotesSending(false);
              }}
            >
              <span>{notesSending ? 'Gönderiliyor...' : 'Notları Mailime Gönder'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function isThemeLight(theme) {
  return theme === 'light';
}

const GREEN = '#1a6b3c';
const GREEN_DARK = '#0f3d22';
const GREEN_LIGHT = '#22c55e';

const getStyles = (theme) => {
  const isDark = theme === 'dark';
  
  const colors = {
    bgDark: isDark ? '#0a1712' : '#f2faf6',
    bgGradient: isDark 
      ? 'radial-gradient(circle at 50% 0%, #123322 0%, #091a12 60%, #050f0a 100%)'
      : 'radial-gradient(circle at 50% 0%, #d1fae5 0%, #f2faf6 60%, #ffffff 100%)',
    primary: isDark ? '#10b981' : '#059669',
    primaryHover: isDark ? '#059669' : '#047857',
    primaryGlow: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(5, 150, 105, 0.15)',
    accent: isDark ? '#f59e0b' : '#d97706',
    accentHover: isDark ? '#d97706' : '#b45309',
    danger: isDark ? '#ef4444' : '#dc2626',
    dangerBg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.08)',
    successBg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.08)',
    cardBg: isDark ? 'rgba(20, 39, 30, 0.88)' : 'rgba(255, 255, 255, 0.94)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(5, 150, 105, 0.12)',
    textMain: isDark ? '#f9fafb' : '#0c2619',
    textMuted: isDark ? '#aeb5c1' : '#4b5563',
    
    vizeActiveBg: isDark ? '#ffffff' : '#059669',
    vizeActiveText: isDark ? '#0a1712' : '#ffffff',
    correctText: isDark ? '#a7f3d0' : '#046a4e',
    wrongText: isDark ? '#fca5a5' : '#b91c1c',
    activeYearBg: isDark ? '#ffffff' : '#059669',
    activeYearText: isDark ? '#0a1712' : '#ffffff',
    badgeYearText: isDark ? '#c4b5fd' : '#5b21b6',
    badgeYearBg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)',
    badgeYearBorder: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.25)',
    badgeFreqText: isDark ? '#fde68a' : '#b45309',
    badgeFreqBg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
    badgeFreqBorder: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.25)',
    warningText: isDark ? '#fde68a' : '#b45309',
    warningBorder: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.3)',
    warningBg: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
    successText: isDark ? '#a7f3d0' : '#046a4e',
    successBorder: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)',
    successTextBg: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
  };

  return {
    bg: {
      // 100dvh DEĞİL: dvh mobilde adres çubuğu gizlenince değişir → kaydırma sırasında sayfa boyu kayar
      minHeight: '100vh',
      background: colors.bgDark,
      backgroundImage: colors.bgGradient,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '20px 16px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: colors.textMain,
      position: 'relative',
      overflowX: 'hidden',
    },
    splashBox: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 24,
      padding: 32,
      width: '100%',
      maxWidth: 400,
      textAlign: 'center',
      marginTop: 60,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    logo: {
      width: 80,
      height: 80,
      objectFit: 'contain',
      marginBottom: 8,
    },
    logoText: {
      fontSize: 22,
      fontWeight: 600,
      color: colors.textMain,
      fontFamily: "'Outfit', sans-serif",
      marginBottom: 6,
    },
    logoSub: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 28,
    },
    tabRow: {
      display: 'flex',
      marginBottom: 16,
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${colors.cardBorder}`,
      background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(5, 150, 105, 0.05)',
      padding: 4,
    },
    tab: {
      flex: 1,
      padding: '10px 0',
      border: 'none',
      background: 'transparent',
      color: colors.textMuted,
      fontWeight: 500,
      fontSize: 14,
      cursor: 'pointer',
      borderRadius: 10,
      transition: 'all 0.3s',
    },
    tabActive: {
      flex: 1,
      padding: '10px 0',
      border: 'none',
      background: colors.primary,
      color: isDark ? '#030806' : '#fff',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      borderRadius: 10,
      boxShadow: `0 4px 12px ${colors.primaryGlow}`,
      transition: 'all 0.3s',
    },
    input: {
      width: '100%',
      padding: '13px 16px',
      borderRadius: 12,
      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(5, 150, 105, 0.15)',
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
      color: colors.textMain,
      fontSize: 15,
      marginBottom: 10,
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'all 0.3s',
    },
    btn: {
      width: '100%',
      padding: '12px 20px',
      borderRadius: 14,
      border: 'none',
      background: colors.primary,
      color: isDark ? '#030806' : '#fff',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      marginTop: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
      boxShadow: `0 4px 14px ${colors.primaryGlow}`,
      transition: 'all 0.3s',
      minHeight: 44,
    },
    btnOutline: {
      width: '100%',
      padding: '12px 20px',
      borderRadius: 14,
      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(5, 150, 105, 0.15)',
      background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(5, 150, 105, 0.05)',
      color: colors.textMain,
      fontWeight: 500,
      fontSize: 14,
      cursor: 'pointer',
      marginTop: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
      transition: 'all 0.3s',
      minHeight: 44,
    },
    errMsg: {
      background: colors.dangerBg,
      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(220, 38, 38, 0.2)'}`,
      color: colors.wrongText,
      borderRadius: 14,
      padding: '12px 16px',
      fontSize: 13,
      marginBottom: 10,
      textAlign: 'left',
      fontWeight: 500,
    },
    container: {
      width: '100%',
      maxWidth: 480,
      paddingBottom: 16,
      position: 'relative',
      zIndex: 10,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingTop: 8,
    },
    greeting: {
      fontSize: 18,
      fontWeight: 600,
      color: colors.textMain,
      fontFamily: "'Outfit', sans-serif",
    },
    feedbackIconBtn: {
      background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.8)',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.06)' : '1.5px solid rgba(5, 150, 105, 0.12)',
      borderRadius: 12,
      padding: '7px 10px',
      color: colors.textMain,
      fontSize: 14,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      transition: 'all 0.3s',
    },
    logoutBtn: {
      background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.8)',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.06)' : '1.5px solid rgba(5, 150, 105, 0.12)',
      borderRadius: 12,
      padding: '7px 12px',
      color: colors.textMain,
      fontWeight: 700,
      fontSize: 12,
      cursor: 'pointer',
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
      transition: 'all 0.3s',
    },
    headerLogo: {
      width: 36,
      height: 36,
      objectFit: 'contain',
      borderRadius: 8,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    },
    modalBox: {
      background: colors.bgDark,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
    },
    modalTitle: {
      fontWeight: 600,
      fontSize: 17,
      color: colors.textMain,
      marginBottom: 6,
      fontFamily: "'Outfit', sans-serif",
    },
    feedbackInput: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 12,
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(5, 150, 105, 0.15)',
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
      color: colors.textMain,
      fontSize: 15,
      fontFamily: 'inherit',
      resize: 'none',
      outline: 'none',
      boxSizing: 'border-box',
    },
    card: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    cardTitle: {
      fontWeight: 600,
      fontSize: 15,
      marginBottom: 12,
      color: colors.textMain,
      fontFamily: "'Outfit', sans-serif",
    },
    cardTitle2: {
      fontWeight: 600,
      fontSize: 14,
      marginBottom: 10,
      color: colors.textMain,
      fontFamily: "'Outfit', sans-serif",
    },
    lbRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 14,
      marginBottom: 8,
      fontSize: 14,
      color: colors.textMain,
    },
    lbScore: {
      fontWeight: 600,
      color: colors.primary,
      fontFamily: "'Outfit', sans-serif",
    },
    myRankBox: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
      background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.08)',
      border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.2)'}`,
      borderRadius: 16,
      padding: '12px 16px',
      fontSize: 13.5,
      color: colors.primary,
      fontWeight: 600,
    },
    myRankBoxGray: {
      marginTop: 14,
      background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(5, 150, 105, 0.02)',
      border: `1px dashed ${colors.cardBorder}`,
      borderRadius: 16,
      padding: '12px 16px',
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
    },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      padding: 20,
      fontSize: 14,
    },
    catBtn: {
      width: '100%',
      background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.85)',
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 12,
      padding: '11px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontWeight: 500,
      fontSize: 14,
      cursor: 'pointer',
      marginBottom: 8,
      color: colors.textMain,
      transition: 'all 0.2s',
      minHeight: 44,
    },
    catArrow: {
      color: colors.primary,
      fontWeight: 500,
      fontSize: 18,
      display: 'flex',
      alignItems: 'center',
    },
    yearBar: {
      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(5, 150, 105, 0.05)',
      padding: '3px 10px',
      display: 'flex',
      gap: 5,
      overflowX: 'auto',
      flexShrink: 0,
      WebkitOverflowScrolling: 'touch',
    },
    yearBtn: {
      padding: '4px 12px',
      borderRadius: 12,
      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(5, 150, 105, 0.1)',
      background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(5, 150, 105, 0.05)',
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: 'all 0.3s',
      minHeight: 28,
    },
    yearBtnActive: {
      background: colors.activeYearBg,
      color: colors.activeYearText,
      border: `1px solid ${colors.activeYearBg}`,
    },
    quizBg: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.bgDark,
      backgroundImage: colors.bgGradient,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    quizHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5px 16px',
      flexShrink: 0,
      maxWidth: 600,
      margin: '0 auto',
      width: '100%',
    },
    backBtn: {
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(5, 150, 105, 0.15)'}`,
      color: colors.textMain,
      borderRadius: 10,
      padding: '7px 12px',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: 13,
      fontFamily: "'Outfit', sans-serif",
      transition: 'all 0.3s',
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 36,
    },
    progress: {
      color: colors.textMuted,
      fontWeight: 700,
      fontSize: 14,
      fontFamily: "'Outfit', sans-serif",
    },
    rankBadge: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${isDark ? '#059669' : '#047857'} 100%)`,
      borderRadius: 20,
      padding: '5px 11px',
      color: isDark ? '#030806' : '#fff',
      fontWeight: 800,
      fontSize: 11,
      fontFamily: "'Outfit', sans-serif",
      boxShadow: `0 4px 10px ${colors.primaryGlow}`,
    },
    quizScroll: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 16px',
      WebkitOverflowScrolling: 'touch',
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    quizCard: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 16,
      padding: '14px 14px',
      marginBottom: 8,
      width: '100%',
      maxWidth: 600,
      boxSizing: 'border-box',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
    catLabel: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    qText: {
      fontSize: 14,
      color: colors.textMain,
      lineHeight: 1.55,
      fontWeight: 400,
    },
    divider: {
      height: 1,
      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(5, 150, 105, 0.08)',
      margin: '12px 0',
    },
    optBtn: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: 10,
      cursor: 'pointer',
      fontWeight: 400,
      fontSize: 13,
      textAlign: 'left',
      marginBottom: 5,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      transition: 'all 0.2s',
      minHeight: 40,
    },
    optLetter: {
      borderRadius: '50%',
      width: 24,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 11,
      flexShrink: 0,
      transition: 'all 0.2s',
    },
    optText: {
      flex: 1,
      lineHeight: 1.4,
    },
    tapHint: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
      marginBottom: 4,
    },
    freqBadge: {
      background: colors.badgeFreqBg,
      border: `1px solid ${colors.badgeFreqBorder}`,
      borderRadius: 8,
      padding: '3px 8px',
      fontSize: 10,
      fontWeight: 700,
      color: colors.badgeFreqText,
    },
    yearBadge: {
      background: colors.badgeYearBg,
      border: `1px solid ${colors.badgeYearBorder}`,
      borderRadius: 8,
      padding: '3px 8px',
      fontSize: 10,
      fontWeight: 700,
      color: colors.badgeYearText,
    },
    resultEmoji: {
      textAlign: 'center',
      fontSize: 72,
      paddingTop: 10,
      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
    },
    resultTitle: {
      textAlign: 'center',
      fontSize: 20,
      fontWeight: 800,
      color: colors.textMain,
      marginTop: 4,
      marginBottom: 20,
      fontFamily: "'Outfit', sans-serif",
    },
    resultCard: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      marginTop: 8,
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(5, 150, 105, 0.05)'}`,
      fontSize: 14,
      color: colors.textMain,
    },
    gectiBox: {
      background: colors.successTextBg,
      border: `1px solid ${colors.successBorder}`,
      borderRadius: 16,
      padding: '14px 16px',
      color: colors.successText,
      fontWeight: 500,
      fontSize: 13.5,
      lineHeight: 1.5,
      marginTop: 14,
    },
    kaldiBox: {
      background: colors.warningBg,
      border: `1px solid ${colors.warningBorder}`,
      borderRadius: 16,
      padding: '14px 16px',
      color: colors.warningText,
      fontWeight: 500,
      fontSize: 13.5,
      lineHeight: 1.5,
      marginTop: 14,
    },
    rankResult: {
      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.85)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(5, 150, 105, 0.12)'}`,
      borderRadius: 16,
      padding: 12,
      textAlign: 'center',
      color: colors.primary,
      fontWeight: 600,
      fontSize: 14,
      marginBottom: 20,
    },
    examTabRow: {
      display: 'flex',
      gap: 4,
      margin: '16px 0',
      background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(5, 150, 105, 0.05)',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(5, 150, 105, 0.1)'}`,
      padding: 4,
      borderRadius: 14,
    },
    examTab: {
      flex: 1,
      padding: '10px 8px',
      borderRadius: 10,
      border: 'none',
      background: 'transparent',
      color: colors.textMuted,
      fontWeight: 500,
      fontSize: 13,
      cursor: 'pointer',
      transition: 'all 0.25s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    examTabActiveVize: {
      flex: 1,
      padding: '10px 8px',
      borderRadius: 10,
      border: 'none',
      background: colors.vizeActiveBg,
      color: colors.vizeActiveText,
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      boxShadow: `0 3px 10px ${colors.primaryGlow}`,
      transition: 'all 0.25s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    examTabActiveFinal: {
      flex: 1,
      padding: '10px 8px',
      borderRadius: 10,
      border: 'none',
      background: colors.accent,
      color: isDark ? '#0a1712' : '#fff',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      boxShadow: `0 3px 10px ${isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.25)'}`,
      transition: 'all 0.25s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    examTabActiveYazOkulu: {
      flex: 1,
      padding: '10px 8px',
      borderRadius: 10,
      border: 'none',
      background: '#eab308',
      color: '#fff',
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      boxShadow: `0 3px 10px rgba(234, 179, 8, 0.25)`,
      transition: 'all 0.25s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    examDesc: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 20,
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 1.4,
    },
    
    // Shopier Promo Modülleri
    heroBanner: {
      fontFamily: "'Outfit', sans-serif",
      background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
      color: '#ffffff',
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      borderRadius: 10,
      boxShadow: '0 4px 10px rgba(29, 78, 216, 0.12)',
      marginBottom: 10,
      boxSizing: 'border-box',
      position: 'relative',
      width: '100%',
      cursor: 'pointer',
    },
    heroText: {
      margin: 0,
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#fff',
      textAlign: 'left',
      flexGrow: 1,
    },
    heroClose: {
      background: 'none',
      border: 'none',
      color: 'rgba(255,255,255,0.7)',
      fontSize: 18,
      cursor: 'pointer',
      lineHeight: 1,
      padding: '2px 4px',
      zIndex: 10,
    },
    
    promoCard: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 16,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      marginBottom: 12,
      width: '100%',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    },
    promoCardAccent: {
      height: 3,
      background: 'linear-gradient(90deg, #10b981, #f59e0b, #3b82f6)',
      width: '100%',
    },
    promoCardBody: {
      padding: 14,
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      textAlign: 'left',
    },
    promoCardIconBox: {
      background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
      borderRadius: 12,
      width: 48,
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    promoCardIcon: {
      width: 24,
      height: 24,
      color: colors.accent,
    },
    promoCardContent: {
      flexGrow: 1,
    },
    promoCardTitle: {
      margin: '0 0 3px 0',
      fontSize: 14,
      fontWeight: 600,
      color: colors.accent,
    },
    promoCardText: {
      margin: 0,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 1.4,
    },
    
    stickyBottom: {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(10, 23, 18, 0.97)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.25)',
      padding: '8px 12px',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    stickyContainer: {
      display: 'flex',
      width: '100%',
      maxWidth: 480,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    stickyText: {
      margin: 0,
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#ffffff',
      textAlign: 'left',
      flexGrow: 1,
    },
    stickyClose: {
      background: 'none',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: 16,
      cursor: 'pointer',
      padding: '2px 4px',
      zIndex: 10,
    },
  };
};

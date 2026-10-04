import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Varsa kendi API sunucunu buraya yaz, şu an boş bırakıldığı için bağlantı hatası veriyordu:
const API = 'https://aofnotlar.com';
const SKOOL_URL = 'https://www.skool.com/anadolu-universitesi-aof-9482';

// Skool tanıtım sayfası takibi. Ateşle-unut: hata olsa bile kullanıcının akışını engellemez.
const track = (event) => {
  try {
    const url = API + '/api/track/' + event;
    if (navigator.sendBeacon) navigator.sendBeacon(url);
    else fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
  } catch (e) { /* takip başarısız olsa da kullanıcı akışı devam etsin */ }
};

const trackSkoolClick = () => track('skool-click');

// Sınav türü adı regex — her seferinde yeni instance (global /g regex stateful, lastIndex sorununu önler)
const getExamTypeRegex = () => /\s*\(\s*(Vize|Final|Yaz okulu|[Vv]ize|[Ff]inal|[Yy]az [Oo]kulu)\s*\)\s*/g;

// Anadolu Üniversitesi Açıköğretim lisans programları ve dersleri
// Kaynak: abp.anadolu.edu.tr (Anadolu Bilgi Paketi)
const AOF_BOLUMLER = [
  { bolum: "İşletme", dersler: [
    "Hukukun Temel Kavramları",
    "İktisada Giriş I",
    "İşletme İlkeleri",
    "Genel Matematik",
    "Davranış Bilimleri I",
    "İktisada Giriş II",
    "İşletme Fonksiyonları",
    "İşletme İletişimi",
    "Finansal Muhasebe",
    "Davranış Bilimleri II",
    "İstatistik",
    "İşletmelerde Sosyal Sorumluluk ve Etik",
    "İşletme Yönetimi",
    "Dönemsonu İşlemleri",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Ticaret Hukuku",
    "Pazarlamaya Giriş",
    "Teknoloji, İnnovasyon ve Girişimcilik",
    "Tedarik Zinciri Yönetimi",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Finansal Yönetim I",
    "Uluslararası İşletmecilik",
    "Üretim Yönetimi",
    "Maliyet ve Yönetim Muhasebesi",
    "Pazarlama Yönetimi",
    "Finansal Yönetim II",
    "İş ve Sosyal Güvenlik Hukuku",
    "Örgüt Kuramı",
    "Pazarlama İletişimi",
    "Örgütsel Davranış",
    "Stratejik Yönetim",
    "İşletme Bilgi Sistemleri",
    "Denetim",
    "Sermaye Piyasaları ve Finansal Kurumlar",
    "Türk Vergi Sistemi",
    "Finansal Tablolar Analizi",
    "Türkiye Ekonomisi",
    "İnsan Kaynakları Yönetimi",
    "Sayısal Karar Verme Teknikleri",
    "Küresel Pazarlama",
  ] },
  { bolum: "İktisat", dersler: [
    "Hukukun Temel Kavramları",
    "İktisada Giriş I",
    "Genel İşletme",
    "Matematik I",
    "Genel Muhasebe I",
    "İktisada Giriş II",
    "Ekonomi Sosyolojisi",
    "Yönetim ve Organizasyon",
    "Matematik II",
    "Genel Muhasebe II",
    "Anayasa Hukuku",
    "Mikro İktisat",
    "İstatistik I",
    "Kamu Maliyesi",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Ticaret Hukuku",
    "Makro İktisat",
    "İktisat Tarihi",
    "İstatistik II",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Matematiksel İktisat",
    "Para Teorisi",
    "Tarım Ekonomisi ve Tarımsal Politikalar",
    "Uluslararası İktisat Teorisi",
    "Sosyal Bilimlerde Proje Yönetimi",
    "Çalışma Ekonomisi",
    "İş ve Sosyal Güvenlik Hukuku",
    "Para Politikası",
    "Uluslararası İktisat Politikası",
    "Ekonometrinin Temelleri",
    "İktisadi Düşünceler Tarihi",
    "İktisadi Kalkınma",
    "Finansal Ekonomi",
    "Girişimcilik ve İş Kurma",
    "Türk Vergi Sistemi",
    "Doğal Kaynaklar ve Çevre Ekonomisi",
    "Türkiye Ekonomisi",
    "Avrupa Birliği ve Türkiye İlişkileri",
    "Ekonominin Güncel Sorunları",
    "İktisadi Büyüme",
  ] },
  { bolum: "Maliye", dersler: [
    "Hukukun Temel Kavramları",
    "İktisada Giriş I",
    "Genel İşletme",
    "Genel Matematik",
    "Genel Muhasebe I",
    "Borçlar Hukuku",
    "Temel İdare Hukuku",
    "İktisada Giriş II",
    "Genel Muhasebe II",
    "İnsan ve Toplum",
    "Mikro İktisat",
    "İstatistik",
    "Kamu Maliyesi",
    "Genel Vergi Hukuku",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Ticaret Hukuku",
    "Vergi Usul Hukuku",
    "Makro İktisat",
    "Vergi Teorisi",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Özel Vergi Hukuku I",
    "Para ve Banka",
    "Kamu Ekonomisi I",
    "Devlet Bütçesi",
    "Maliyet Muhasebesi",
    "Özel Vergi Hukuku II",
    "Kamu Ekonomisi II",
    "Mahalli İdareler Maliyesi",
    "Kamu Mali Yönetimi",
    "Uluslararası Kamu Maliyesi",
    "Vergi Ceza Hukuku",
    "Vergi İcra Hukuku",
    "Devlet Borçları",
    "Muhasebe Denetimi",
    "Gümrük Mevzuatı",
    "Türkiye Ekonomisi",
    "Ekonominin Güncel Sorunları",
    "Maliye Politikası",
    "Vergi Yargılaması Hukuku",
    "Vergi Planlaması",
  ] },
  { bolum: "Yönetim Bilişim Sistemleri", dersler: [
    "İktisada Giriş",
    "İşletme İlkeleri",
    "Matematik I",
    "Genel Muhasebe",
    "Bilişim Teknolojileri",
    "Bilişim Hukuku",
    "Proje Yönetimi",
    "Yeni İletişim Teknolojileri",
    "İşletme Fonksiyonları",
    "Matematik II",
    "İstatistik",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Bilgisayar ve Programlamaya Giriş",
    "İşlem Tabloları",
    "Bilişim Sistemleri",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "İşletme Analitiği",
    "Algoritmalar ve Programlama",
    "Veritabanı Sistemleri",
    "İş Süreçleri Yönetimi",
    "Dijital Dönüşüm",
    "Üretim Yönetimi",
    "İşlem Tablosu Programlama",
    "Kullanıcı Deneyimi Tasarımı",
    "Sistem Analizi ve Tasarımı",
    "Kurumsal Kaynak Planlama Sistemleri",
    "Marka ve Yönetimi",
    "Örgütsel Davranış",
    "Ağ Yönetimi ve Bilgi Güvenliği",
    "Veritabanı Programlama",
    "İleri Programlama",
    "Sosyal Ağ Analizi",
    "Girişimcilik ve İş Kurma",
    "Yenilik Yönetimi",
    "Yöneylem Araştırması",
    "Karar Modelleri",
    "İnternet ve Web Programlama",
    "Finansal Tablolar Analizi",
    "Müşteri İlişkileri Yönetimi",
    "Karar Destek Sistemleri",
    "Veri Madenciliği",
    "Programlamada Yeni Eğilimler",
  ] },
  { bolum: "Uluslararası Ticaret ve Lojistik", dersler: [
    "Temel Bilgi Teknolojileri",
    "Hukukun Temel Kavramları",
    "İktisada Giriş I",
    "Genel İşletme",
    "Genel Muhasebe I",
    "İktisada Giriş II",
    "Yönetim ve Organizasyon",
    "Genel Muhasebe II",
    "Dış Ticarete Giriş",
    "Uluslararası Ticaret Hukuku",
    "İstatistik",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Dış Ticarette Girişimcilik",
    "Dış Ticaretin Finansmanı ve Teşviki",
    "Türk Dili I",
    "Uluslararası Ticarette Vergilendirme",
    "Küresel Pazarlama",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Elektronik Ticaret",
    "Türk Dili II",
    "İşletme Analitiği",
    "Uluslararası İşletmecilik",
    "Lojistik İlkeleri",
    "Dış Ticarette Risk Yönetimi ve Sigortacılık",
    "Depolama ve Envanter Yönetimi",
    "Uluslararası İktisat",
    "Lojistik Yönetimi",
    "Dış Ticaret İşlemleri ve Belgeleri",
    "İşletme Finansmanı",
    "Dış Ticaret İşlemlerinin Muhasebeleştirilmesi",
    "Gümrük Mevzuatı",
    "Uluslararası Lojistik",
    "Ulaştırma Sistemleri ve Yönetimi",
    "Tehlikeli Madde Lojistiği ve İş Güvenliği",
    "Lojistik Maliyetleri ve Raporlama",
    "Yöneylem Araştırması",
    "Bilişim Sistemleri ve Lojistik",
    "Lojistik Planlama ve Modelleme",
    "Liman ve Terminal Yönetimi",
    "Entegre Lojistik Destek",
    "Tedarik Zinciri Yönetimi",
  ] },
  { bolum: "Uluslararası İlişkiler", dersler: [
    "Hukukun Temel Kavramları",
    "İdare Hukukuna Giriş",
    "İktisada Giriş I",
    "Davranış Bilimleri I",
    "Siyasi Tarih I",
    "İktisada Giriş II",
    "Davranış Bilimleri II",
    "Genel Uygarlık Tarihi",
    "Siyasi Tarih II",
    "Uluslararası İlişkilere Giriş",
    "Anayasa Hukuku",
    "Uluslararası Hukuk I",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Uluslararası Politika I",
    "Türk Dış Politikası I",
    "Uluslararası Hukuk II",
    "Türkiye Ekonomisi",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Uluslararası Politika II",
    "Türk Dış Politikası II",
    "Balkanlar'da Siyaset",
    "Orta Asya ve Kafkaslarda Siyaset",
    "Strateji ve Güvenlik",
    "İnsan Hakları ve Demokratikleşme Süreci",
    "Karşılaştırmalı Siyasal Sistemler",
    "Kültür Tarihi",
    "Orta Doğuda Siyaset",
    "Uluslararası Örgütler",
    "Dış Politika Analizi",
    "Uluslararası Politik Ekonomi",
    "Avrupa Birliği",
    "Siyaset Bilimi",
    "Amerikan Dış Politikası",
    "Uluslararası İlişkiler Kuramları I",
    "Diplomasi Tarihi",
    "Uluslararası İlişkilerde Araştırma Yöntemleri",
    "Avrupa Birliği ve Türkiye İlişkileri",
    "Küreselleşme ve Kültürlerarası İletişim",
    "Gelişmekte Olan Ülkelerde Siyaset",
    "Uluslararası İlişkiler Kuramları II",
  ] },
  { bolum: "Siyaset Bilimi ve Kamu Yönetimi", dersler: [
    "Hukukun Temel Kavramları",
    "İktisada Giriş I",
    "Genel İşletme",
    "Genel Muhasebe I",
    "Davranış Bilimleri I",
    "Borçlar Hukuku",
    "İktisada Giriş II",
    "Genel Muhasebe II",
    "Davranış Bilimleri II",
    "Genel Uygarlık Tarihi",
    "Anayasa Hukuku",
    "Yönetim Bilimi I",
    "Kamu Maliyesi",
    "Siyaset Bilimi",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "İdare Hukuku",
    "Kamu Yönetimi",
    "Yönetim Bilimi II",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Yerel Yönetimler",
    "Sosyal Bilimlerde Araştırma Yöntemleri",
    "Sosyal Politika",
    "Kamu Personel Hukuku",
    "Siyasi Tarih",
    "Karşılaştırmalı Siyasal Sistemler",
    "İdari Yargı",
    "İnsan Hakları ve Kamu Özgürlükleri",
    "Türk Siyasal Hayatı",
    "Örgütsel Davranış",
    "Uluslararası Örgütler",
    "Türk İdare Tarihi",
    "Kentleşme ve Konut Politikaları",
    "Türk Vergi Sistemi",
    "Siyaset Sosyolojisi",
    "Türkiye'nin Toplumsal Yapısı",
    "Türkiye Ekonomisi",
    "Avrupa Birliği ve Türkiye İlişkileri",
    "Yönetimde Güncel Yaklaşımlar",
    "Maliye Politikası",
    "Siyasi Düşünceler Tarihi",
  ] },
  { bolum: "Çalışma Ekonomisi ve Endüstri İlişkileri", dersler: [
    "Hukukun Temel Kavramları",
    "İktisada Giriş I",
    "Genel İşletme",
    "Genel Muhasebe I",
    "Davranış Bilimleri I",
    "Borçlar Hukuku",
    "İktisada Giriş II",
    "Yönetim ve Organizasyon",
    "Genel Muhasebe II",
    "Davranış Bilimleri II",
    "Sosyal Politika I",
    "Çalışma Ekonomisi I",
    "Mikro İktisat",
    "Kamu Maliyesi",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Sosyal Politika II",
    "Çalışma Ekonomisi II",
    "İdare Hukuku",
    "Makro İktisat",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Çalışma İlişkileri Tarihi",
    "İstihdam ve İşsizlik",
    "Türk Anayasa Hukuku",
    "Bireysel İş Hukuku",
    "Çalışma Sosyolojisi",
    "Gelir Dağılımı ve Yoksulluk",
    "Sendikacılık",
    "Uluslararası Sosyal Politika",
    "Toplu İş Hukuku",
    "Örgütsel Davranış",
    "Endüstri İlişkileri",
    "İş Sağlığı ve Güvenliği",
    "Sosyal Güvenlik",
    "İstatistik",
    "Türk Vergi Sistemi",
    "Çalışma Yaşamının Denetimi",
    "Ticaret Hukuku",
    "Sosyal Güvenlik Hukuku",
    "Türkiye Ekonomisi",
    "İnsan Kaynakları Yönetimi",
  ] },
  { bolum: "Halkla İlişkiler ve Reklamcılık", dersler: [
    "İktisada Giriş",
    "İletişim Bilgisi",
    "Genel İşletme",
    "Psikoloji",
    "Pazarlama Yönetimi",
    "Halkla İlişkiler",
    "Yeni İletişim Teknolojileri",
    "İletişim Kuramları",
    "Marka ve Yönetimi",
    "Pazarlama İletişimi",
    "Kurumsal İletişim",
    "İkna Edici İletişim",
    "Reklamcılık",
    "Dijital Medya ve Tüketici",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Halkla İlişkiler Yazarlığı",
    "Reklamda Yaratıcılık",
    "Dijital İçerik Pazarlaması",
    "Kriz İletişimi ve Yönetimi",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Felsefe",
    "Kurumiçi Halkla İlişkiler",
    "Tanıtım ve Pazarlama",
    "İnternet ve Mobil Pazarlama",
    "Sosyal Medya Yönetimi",
    "Kamu Diplomasisi ve Uluslararası Halkla İlişkiler",
    "Sürdürülebilirlik ve Halkla İlişkiler",
    "Medyada Yapım",
    "Marka İletişim Tasarımı ve Uygulamaları",
    "Sanat Tarihi",
    "Halkla İlişkiler Kampanya Analizi",
    "İtibar Yönetimi",
    "Kurum Kültürü",
    "Medya Planlama",
    "Tüketici Davranışları",
    "Dijital Halkla İlişkiler",
    "Halkla İlişkiler Araştırmaları",
    "Reklam Kampanya Süreci",
    "Kurumsal Kimlik ve İmaj Yönetimi",
    "Reklamda Yaratıcılık ve Yazarlık",
  ] },
  { bolum: "Sağlık Yönetimi", dersler: [
    "İktisada Giriş I",
    "Genel Muhasebe I",
    "Pazarlama Yönetimi",
    "Sağlık İşletmeciliği I",
    "Tıbbi Belgeleme",
    "Sağlık Hukuku",
    "İktisada Giriş II",
    "Temel Sağlık ve Hastalık Bilgisi",
    "Sağlık İşletmelerinde Davranış",
    "Sağlık İşletmeciliği II",
    "Denetim",
    "Kamu Maliyesi",
    "Sağlık İşletmelerinde Halkla İlişkiler",
    "Sağlık İşletmelerinde Yönetim",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Sağlık Kurumlarında İletişim",
    "Stratejik Yönetim II",
    "Sağlık İşletmelerinde İnsan Kaynakları Yönetimi",
    "Sağlık Politikaları",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Kamu Personel Hukuku",
    "Psikoloji",
    "Sağlık Alanında İstatistik",
    "Sağlık Ekonomisi",
    "Sağlık Kurumlarında Afet ve Kriz Yönetimi",
    "Tıp Terimleri",
    "Genel Beslenme",
    "Proje Yönetimi",
    "Temel İlkyardım Bilgisi",
    "Genel Tıbbi Ürün ve Tıbbi Cihaz Bilgisi",
    "Bakım Elemanı Yetiştirme ve Geliştirme I",
    "Temel Sağlık Hizmetleri",
    "İş Sağlığı ve Güvenliği",
    "Sosyal Güvenlik",
    "Sağlık Kurumlarında Maliyet Muhasebesi",
    "Sağlık Hizmetlerinde Araştırma ve Değerlendirme",
    "Sağlık Kurumlarında Operasyon Yönetimi",
    "Sağlık Sigortacılığı",
    "Yönetimde Güncel Yaklaşımlar",
    "İnsan Beden Yapısı ve Fizyolojisi",
    "Sağlık Bilimlerinde ve Yönetiminde Etik",
    "Sağlık İşletmelerinde Finansal Yönetim",
    "Sağlık İşletmelerinde Kalite Yönetimi",
    "Sağlık Kurumlarında Bilgi Sistemleri",
  ] },
  { bolum: "Sosyal Hizmet", dersler: [
    "Hukukun Temel Kavramları",
    "Psikoloji",
    "Sosyal Hizmet Mesleğine Giriş",
    "İnsan Davranışı ve Sosyal Çevre I",
    "Sosyolojiye Giriş",
    "Etkili İletişim Teknikleri",
    "Temel İlkyardım Bilgisi",
    "Sosyal Hizmet Kuruluşları",
    "İnsan Davranışı ve Sosyal Çevre II",
    "Toplumsal Tabakalaşma ve Eşitsizlik",
    "Sosyal Güvenlik",
    "Sosyal Psikoloji I",
    "Sosyal Hizmet Kuram ve Yaklaşımları",
    "Türkiye'nin Toplumsal Yapısı",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "İnsan Hakları ve Kamu Özgürlükleri",
    "Görüşme Teknikleri",
    "Sosyal Hizmet Mevzuatı",
    "Bireylerle Sosyal Hizmet",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Sosyal Bilimlerde Araştırma Yöntemleri",
    "Sosyal Politika",
    "Yaşlılarla Sosyal Hizmet",
    "Tıbbi ve Psiko-Sosyal Hizmet",
    "Gruplarla Sosyal Hizmet",
    "Toplumsal Cinsiyet Sosyolojisi",
    "Sosyal Hizmette Kayıt Tutma ve Rapor Yazma İlke ve Teknikleri",
    "Engellilerle Sosyal Hizmet",
    "Aile ve Çocukla Sosyal Hizmet",
    "Sosyal Hizmet Etiği",
    "Toplumla Sosyal Hizmet",
    "Adli Sosyal Hizmet",
    "Göç ve Göçmen Sorunları",
    "Sosyal Hizmet Uygulaması I",
    "Sosyal Hizmet Yönetimi",
    "Sosyal Hizmet Uygulaması II",
  ] },
  { bolum: "Sosyoloji", dersler: [
    "Sosyal Politika",
    "Psikoloji",
    "Sosyolojiye Giriş",
    "Sosyal Bilimlerde Temel Kavramlar",
    "Sosyolojide Araştırma Yöntem ve Teknikleri",
    "Nüfus ve Toplum",
    "Etik",
    "Sembolik Mantık",
    "Türk Siyasal Hayatı",
    "İnsan ve Toplum",
    "Birey ve Davranış",
    "Çocukluk Sosyolojisi",
    "Felsefe",
    "İstatistik",
    "Sosyal Psikoloji I",
    "Siyaset Bilimi",
    "Klasik Sosyoloji Tarihi",
    "Sosyal Antropoloji",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Eğitim Felsefesi",
    "Sosyal Psikoloji II",
    "Modern Sosyoloji Tarihi",
    "Göç Sosyolojisi",
    "Din ve Toplum",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Turizm Sosyolojisi",
    "Çağdaş Sosyoloji Kuramları",
    "Ekonomi Sosyolojisi",
    "Aile Sosyolojisi",
    "Kültür Sosyolojisi",
    "Yeni Toplumsal Hareketler",
    "Toplumsal Cinsiyet Sosyolojisi",
    "Sosyolojide Yakın Dönem Gelişmeler",
    "Toplumsal Tabakalaşma ve Eşitsizlik",
    "Endüstri Sosyolojisi",
    "Kent Sosyolojisi",
    "Toplumsal Cinsiyet Çalışmaları",
    "Sosyal Medya Sosyolojisi",
    "Genel Uygarlık Tarihi",
    "Toplumsal Değişme Kuramları",
    "Türkiye'de Sosyoloji",
    "İletişim Sosyolojisi",
    "Hukuk Sosyolojisi",
    "Türkiye'nin Toplumsal Yapısı",
    "Çevre Sosyolojisi",
    "Bilim Felsefesi",
    "Klasik Mantık",
    "Eğitim Psikolojisi",
    "Türk Sosyologları",
    "Medya Sosyolojisi",
    "Suç Sosyolojisi",
    "Tüketim Sosyolojisi",
  ] },
  { bolum: "Felsefe", dersler: [
    "Sosyal Politika",
    "İlkçağ Felsefesi",
    "Hukukun Temel Kavramları",
    "Psikoloji",
    "Sosyolojiye Giriş",
    "Sosyal Bilimlerde Temel Kavramlar",
    "Kültür Tarihi",
    "Genel Matematik",
    "Sembolik Mantık",
    "İnsan ve Toplum",
    "Birey ve Davranış",
    "Genel Uygarlık Tarihi",
    "Epistemoloji",
    "Yurttaşlık ve Çevre Bilgisi",
    "Ortaçağ Felsefesi I",
    "Felsefe",
    "Türkiye'nin Toplumsal Yapısı",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Aile Psikolojisi ve Eğitimi",
    "Metafizik",
    "Ortaçağ Felsefesi II",
    "Eğitim Psikolojisi",
    "Modern Sosyoloji Tarihi",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Temel Bilgi Teknolojileri",
    "Etik",
    "Bilim Felsefesi",
    "Modern Felsefe I",
    "Siyaset Felsefesi I",
    "Temel Fotoğrafçılık",
    "Çağdaş Sosyoloji Kuramları",
    "İnsan Hakları ve Kamu Özgürlükleri",
    "Dijital Toplum Teknolojileri",
    "Modern Felsefe II",
    "Siyaset Felsefesi II",
    "Mantığın Gelişimi",
    "Türk Siyasal Hayatı",
    "Sosyolojide Yakın Dönem Gelişmeler",
    "Tarih Felsefesi I",
    "Çağdaş Felsefe I",
    "Türkiye'de Felsefenin Gelişimi I",
    "Estetik ve Sanat Felsefesi",
    "Dil Felsefesi",
    "Sosyal Psikoloji I",
    "Toplumsal Değişme Kuramları",
    "Zihin Felsefesi",
    "Tarih Felsefesi II",
    "Çağdaş Felsefe II",
    "Türkiye'de Felsefenin Gelişimi II",
    "Etkili İletişim Teknikleri",
    "Kültürlerarası İletişim",
    "Klasik Mantık",
    "Sosyal Psikoloji II",
  ] },
  { bolum: "Tarih", dersler: [
    "Eski Anadolu Tarihi",
    "İslam Tarihi ve Medeniyeti I",
    "Tarih Metodu",
    "Orta Asya Türk Tarihi",
    "Hellen ve Roma Tarihi",
    "Osmanlı Türkçesi I",
    "Eski Mezopotamya ve Mısır Tarihi",
    "İslam Tarihi ve Medeniyeti II",
    "Büyük Selçuklu Tarihi",
    "Bizans Tarihi",
    "İlk Müslüman Türk Devletleri",
    "Osmanlı Türkçesi II",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Ortaçağ ve Yeniçağ Türk Devletleri Tarihi",
    "Türkiye Selçuklu Tarihi",
    "Ortaçağ-Yeniçağ Avrupa Tarihi",
    "Osmanlı Tarihi (1300-1566)",
    "Osmanlı Türkçesi Metinleri I",
    "Türk Mitolojisi",
    "Türk Dili I",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Osmanlı Tarihi (1566-1789)",
    "Osmanlı Tarihi (1789-1876)",
    "Osmanlı Türkçesi Metinleri II",
    "Osmanlı Devleti Yenileşme Hareketleri (1703-1876)",
    "Türk Kültürü ve Tarihine Giriş",
    "Türk Dili II",
    "Sosyolojiye Giriş",
    "Osmanlı Tarihi (1876-1918)",
    "Tarihi Coğrafya",
    "Osmanlı Devleti Yenileşme Hareketleri (1876-1918)",
    "Osmanlı İktisat Tarihi",
    "Osmanlı Diplomasisi",
    "Türk Askeri Teşkilat Tarihi",
    "Türkiye Cumhuriyeti Siyasi Tarihi",
    "Türkiye Cumhuriyeti İktisat Tarihi",
    "Xıx. Yüzyıl Türk Dünyası",
    "Modern Ortadoğu Tarihi",
    "Türkiye’De Demokrasi ve Parlamento Tarihi",
    "Eğitim Tarihi",
    "Birinci Dünya Savaşı'nda Türk Cepheleri",
    "Osmanlı Merkez ve Taşra Teşkilatı",
    "Yakınçağ Avrupa Tarihi",
    "Sömürgecilik Tarihi (Avrupa-Amerika)",
    "Çağdaş Türk Dünyası",
    "Türk Basın Tarihi",
    "Tarih Felsefesi",
    "Türk Dış Politikası I",
    "Kültür Tarihi",
    "Sanat Tarihi",
    "Osmanlıda İskan ve Göç",
    "Rusya Tarihi",
    "Hukuk Tarihi",
    "Türk Düşünce Tarihi",
    "Milli Mücadele Tarihi",
    "Türk Dış Politikası II",
  ] },
  { bolum: "Türk Dili ve Edebiyatı", dersler: [
    "Halk Edebiyatına Giriş I",
    "Eski Türk Edebiyatına Giriş: Biçim ve Ölçü",
    "Batı Edebiyatında Akımlar I",
    "Yeni Türk Edebiyatına Giriş I",
    "Türkçe Ses Bilgisi",
    "Osmanlı Türkçesine Giriş I",
    "Halk Edebiyatına Giriş II",
    "Eski Türk Edebiyatına Giriş: Söz Sanatları",
    "Batı Edebiyatında Akımlar II",
    "Yeni Türk Edebiyatına Giriş II",
    "Türkçe Biçim Bilgisi",
    "Osmanlı Türkçesine Giriş II",
    "Vııı-Xııı. Yüzyıllar Türk Edebiyatı",
    "Tanzimat Dönemi Türk Edebiyatı I",
    "Halk Hikayeleri",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Orhon Türkçesi",
    "Türkçe Cümle Bilgisi I",
    "Osmanlı Türkçesi Grameri I",
    "Xıv-Xv. Yüzyıllar Türk Edebiyatı",
    "Tanzimat Dönemi Türk Edebiyatı II",
    "Halk Masalları",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Uygur Türkçesi",
    "Türkçe Cümle Bilgisi II",
    "Osmanlı Türkçesi Grameri II",
    "Temel Bilgi Teknolojileri",
    "Xvı. Yüzyıl Türk Edebiyatı",
    "II. Abdülhamit Dönemi Türk Edebiyatı",
    "Türk Halk Şiiri",
    "Xı-Xııı. Yüzyıllar Türk Dili",
    "Çağdaş Türk Yazı Dilleri I",
    "Genel Dilbilim I",
    "Dijital Toplum Teknolojileri",
    "Xvıı. Yüzyıl Türk Edebiyatı",
    "Türk Edebiyatının Mitolojik Kaynakları",
    "Xıv-Xv. Yüzyıllar Türk Dili",
    "Çağdaş Türk Yazı Dilleri II",
    "Genel Dilbilim II",
    "II. Meşrutiyet Dönemi Türk Edebiyatı",
    "Xvııı. Yüzyıl Türk Edebiyatı",
    "Cumhuriyet Dönemi Türk Şiiri",
    "Çağdaş Türk Edebiyatları I",
    "Cumhuriyet Dönemi Türk Nesri",
    "Xvı-Xıx. Yüzyıllar Türk Dili",
    "Eleştiri Tarihi",
    "Xıx. Yüzyıl Türk Edebiyatı",
    "Çağdaş Türk Romanı",
    "Çağdaş Türk Edebiyatları II",
    "Eski Türk Edebiyatının Kaynaklarından Şair Tezkireleri",
    "Eleştiri Kuramları",
    "Türk Tiyatrosu",
    "Türk İşaret Dili",
  ] },
  { bolum: "Turizm İşletmeciliği", dersler: [
    "Hukukun Temel Kavramları",
    "İktisada Giriş",
    "Konaklama İşletmeciliği",
    "Genel Muhasebe",
    "Turizm Tarihi",
    "Turizm ve Güvenlik",
    "Kırsal Turizm ve Kalkınma",
    "Dijital Turizm",
    "Kat Hizmetleri",
    "Ön Büro Yönetimi",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Genel Turizm Bilgisi",
    "Türk Dili I",
    "Turizm Ekonomisi",
    "Otel Yönetimi",
    "Konaklama İşletmelerinde Muhasebe Uygulamaları",
    "Turizm Pazarlaması",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Bireyler Arası İletişim",
    "Hizmet Tasarımı",
    "Turizm Sosyolojisi",
    "Turizmde Güncel Yaklaşımlar",
    "Destinasyon Yönetimi",
    "Sosyal Davranış ve Protokol",
    "Konaklama Hizmetlerinde Kalite Yönetimi",
    "Toplum Temelli Turizm",
    "Turizm Bilgi Teknolojileri",
    "Stratejik Yönetim",
    "İşletmelerde Sosyal Sorumluluk ve Etik",
    "Kültürel Miras Yönetimi",
    "Yiyecek İçecek Yönetimi",
    "Seyahat Acentacılığı ve Tur Operatörlüğü",
    "İnsan Kaynakları Yönetimi",
    "Termal ve Spa Hizmetleri",
    "Kongre ve Etkinlik Yönetimi",
    "Sürdürülebilir Turizm",
    "Rekreasyon Yönetimi",
  ] },
  { bolum: "Havacılık Yönetimi", dersler: [
    "Hukukun Temel Kavramları",
    "İktisada Giriş I",
    "İşletme İlkeleri",
    "Genel Muhasebe",
    "Davranış Bilimleri I",
    "Havacılığa Giriş",
    "İktisada Giriş II",
    "İşletme Fonksiyonları",
    "Genel Matematik",
    "Davranış Bilimleri II",
    "Uçak Bilgisi ve Uçuş İlkeleri",
    "Meteoroloji",
    "İstatistik",
    "İşletme Bilgi Sistemleri",
    "Atatürk İlkeleri ve İnkılap Tarihi I",
    "Türk Dili I",
    "Hava Taşımacılığı",
    "Yer Hizmetleri Yönetimi",
    "Yolcu Hizmetleri",
    "Hava Kargo ve Tehlikeli Maddeler",
    "Atatürk İlkeleri ve İnkılap Tarihi II",
    "Türk Dili II",
    "Finansal Yönetim I",
    "Havaalanı Sistemi",
    "Havacılık Güvenliği",
    "Hava Trafik Kontrol Hizmetleri",
    "Havayolu Pazarlaması",
    "Finansal Yönetim II",
    "Havayolu Yönetimi",
    "Harekat Performans",
    "Halkla İlişkiler",
    "Örgütsel Davranış",
    "Havaalanı Yönetimi",
    "Havacılık Emniyeti",
    "Hava Hukuku",
    "Ulaştırma Sistemleri",
    "Havacılık İşletmelerinde Muhasebe Uygulamaları",
    "Finansal Tablolar Analizi",
    "Genel Havacılık",
    "Havayolu İşletmelerinde Operasyonel Planlama",
    "İnsan Kaynakları Yönetimi",
    "İşletmelerde Karar Verme Teknikleri",
  ] },
];

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

const IconInfo = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);

const IconFlame = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M12 22c4.4 0 8-3.6 8-8 0-4-2.2-7-6-10 .1 3-1.6 5.4-3.4 6.6C9.8 8.7 8.5 7.2 7 6c.2 3-3 4.9-3 8 0 4.4 3.6 8 8 8z"/><path d="M9.5 17.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0-1.2-.6-2.1-1.8-3.1 0 1-.5 1.6-1.1 2-.3-.7-.8-1.2-1.3-1.6.1 1-0.8 1.6-0.8 2.7z"/></svg>
);

const IconCamera = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="4"/></svg>
);

const IconUsers = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const IconStar = ({ size = 18, filled = false, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
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
  return `1. ${name} - ${aofJokes[jokeIndex]}`;
};

export default function App() {
  // Yalnız açık tema (sade ızgara tasarımı)
  const theme = 'light';

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

  // Skool tanıtım sayfası her açıldığında bir görüntülenme say (aynı açılışta tekrar sayma)
  const salesViewSentRef = useRef(false);
  useEffect(() => {
    if (screen !== 'product-detail') {
      salesViewSentRef.current = false;
      return;
    }
    if (salesViewSentRef.current) return;
    salesViewSentRef.current = true;
    track('sales-page-view');
  }, [screen]);

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

  // Ücretsiz Özet Ders Notu İndir
  const [pdfNotes, setPdfNotes] = useState([]);
  const [notesSelected, setNotesSelected] = useState([]);
  const [notesEmail, setNotesEmail] = useState('');
  const [notesKvkk, setNotesKvkk] = useState(false);
  const [notesSending, setNotesSending] = useState(false);
  const [notesResult, setNotesResult] = useState(null); // 'success' | 'error' | null

  const N8N_WEBHOOK = 'BURAYA_N8N_PRODUCTION_URL_GELECEK';

  // Bölüm bazlı ders materyali isteği (çoklu seçim)
  const [crOpenBolum, setCrOpenBolum] = useState('İşletme');
  const [crSelected, setCrSelected] = useState([]); // [{ name, department }]
  const [crSending, setCrSending] = useState(false);
  const [crDone, setCrDone] = useState(false);

  const crToggle = (bolum, ders) => {
    setCrSelected(prev => prev.some(x => x.name === ders && x.department === bolum)
      ? prev.filter(x => !(x.name === ders && x.department === bolum))
      : [...prev, { name: ders, department: bolum }]);
  };

  const sendMaterialRequest = async () => {
    if (!crSelected.length || crSending) return;
    setCrSending(true);
    try {
      await fetch(API + '/api/course-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: crSelected })
      });
    } catch (e) {}
    setCrSending(false);
    setCrDone(true);
    setCrSelected([]);
  };

  useEffect(() => {
    // text-transform: uppercase Türkçe kuralına göre çalışsın (pratik → PRATİK, i → İ)
    document.documentElement.lang = 'tr';

    // Google Fonts Dinamik Yükleme
    const fontId = 'google-fonts-design-system';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Archivo+Narrow:wght@500;600;700&display=swap';
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
    const primary = isDark ? '#157a3c' : '#0047bb';
    const optHoverBg = '#eef3fc';
    const optHoverBorder = '#e4e7ec';
    const scrollThumb = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)';
    const catHoverBg = '#eef3fc';
    const catHoverBorder = isDark ? '#38383a' : '#d2d2d7';
    const feedbackHoverBg = isDark ? '#2c2c2e' : '#f5f5f7';

    styleTag.innerHTML = `
      :root {
        --primary-color: ${primary};
        --opt-hover-bg: ${optHoverBg};
        --opt-hover-border: ${optHoverBorder};
        --scroll-thumb: ${scrollThumb};
      }

      html, body, button, input, textarea, select {
        font-family: 'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        letter-spacing: -0.011em;
      }
      html { -webkit-text-size-adjust: 100%; }
      body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

      .btn-hover {
        transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .btn-hover:hover {
        filter: brightness(1.04);
      }
      .btn-hover:active {
        transform: scale(0.985);
      }

      .cat-btn-hover {
        transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .cat-btn-hover:hover {
        background: ${catHoverBg} !important;
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
      
      body { background: #ffffff; }

      /* Sade ızgara: üst satır (liderler / kaynaklar / Skool) ve ders ızgarası */
      .d-top {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        align-items: start;
        margin-bottom: 40px;
      }
      .d-top > .d-cell { border: 1px solid #d5dae1; padding: 0 16px 14px; min-width: 0; background: #ffffff; }
      .d-top > .d-cell > .d-head {
        margin: 0 -16px 4px;
        padding: 10px 16px;
        background: #f4f6f9;
        border-bottom: 1px solid #d5dae1;
      }
      .d-top > .d-blue { padding: 18px; background: #0047bb; color: #ffffff; cursor: pointer; min-width: 0; }
      .d-courses {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        column-gap: 24px;
      }
      @media (max-width: 760px) {
        .d-top { grid-template-columns: 1fr; }
        .d-courses { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 480px) {
        .d-courses { grid-template-columns: 1fr; }
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
          fontSize: 'inherit',
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
      .map((cat, i) => {
        const cleanName = cat.name.replace(getExamTypeRegex(), '').trim();
        const isFav = favorites.includes(cat.id);
        const isLoading = loadingCatId === cat.id;
        return (
          <button key={cat.id} style={{ ...s.catBtn, opacity: isLoading ? 0.55 : 1 }} className="cat-btn-hover" onClick={() => handleCategoryClick(cat)}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0, flex: 1 }}>
              <span style={s.courseCode}>{tileInitials(cleanName)}</span>
              <span style={s.courseName}>{cleanName}</span>
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); toggleFavorite(e, cat.id); }}
              style={{ display: 'flex', cursor: 'pointer', color: isFav ? '#0047bb' : 'rgba(0,0,0,0.22)', transition: '0.2s', flexShrink: 0 }}
              aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              <IconStar size={17} filled={isFav} />
            </span>
          </button>
        );
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedCategories, examType, favorites, s, handleCategoryClick, toggleFavorite, loadingCatId]);

  // ════════════════════════════════════════════════════════════
  // EKRANLAR
  // ════════════════════════════════════════════════════════════

  if (screen === 'home') return (
    <div style={s.bg}>
      <div style={s.wide}>
        <div style={s.topBar}>
          <div style={s.brandLogo}>AÖF<span style={{ color: '#0047bb' }}>notlar</span></div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <a href="https://t.me/+whse8tbDgac0OTU0" target="_blank" rel="noopener noreferrer" style={s.topLink}><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"/></svg><span>Telegram</span></a>
            <button style={s.topLink} onClick={() => { setShowFeedback(true); loadMyFeedbacks(); }}><IconMessageSquare size={15} /><span>Geri bildirim</span></button>
            {user && <button style={s.topLink} onClick={logout}>Çıkış</button>}
          </div>
        </div>

        {showHeroBanner && (
          <div style={s.heroBanner} onClick={() => { setPrevScreen('home'); setScreen('product-detail'); }}>
            <span style={s.heroText}>Özetler ve soru-cevap Skool topluluğunda →</span>
            <button style={s.heroClose} onClick={(e) => { e.stopPropagation(); setShowHeroBanner(false); }} aria-label="Kapat">&times;</button>
          </div>
        )}

        <h1 style={s.homeTitle}>{user?.username ? `Hoşgeldin, ${user.username}!` : 'Hoşgeldin!'}</h1>

        {showNicknameModal && (
          <div style={s.modalOverlay} onClick={() => setShowNicknameModal(false)}>
            <div style={{ ...s.modalBox, maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <IconUser size={48} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', marginBottom: 8, display: 'block', margin: '0 auto 8px auto' }} />
              <div style={s.modalTitle}>Kullanıcı Adı Seç</div>
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', marginBottom: 20 }}>Liderlik tablosunda bu isimle görüneceksin</div>
              <input style={s.input}
                placeholder="Kullanıcı adın (örn: AhmetAOF)"
                value={anonName} onChange={e => setAnonName(e.target.value.slice(0, 15))}
                onKeyDown={e => e.key === 'Enter' && handleAnonymous()} maxLength={15} />
              {authError && <div style={{ ...s.errMsg, display: 'flex', alignItems: 'center', gap: 7 }}><IconInfo size={16} /> {authError}</div>}
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
                <IconMessageSquare size={20} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb' }} />
                <span>Geri Bildirim / Ders İsteği</span>
              </div>
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', marginBottom: 12 }}>Görüşlerini yaz, ders isteğinde bulun!</div>
              {feedbackSent ? (
                <IconCheckCircle size={48} style={{ color: '#157a3c', display: 'block', margin: '16px auto' }} />
              ) : (
                <>
                  <textarea style={s.feedbackInput} placeholder="Mesajını buraya yaz..."
                    value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={3} />
                  <button style={{ ...s.btn, marginTop: 8 }} className="btn-hover" onClick={sendFeedback}>Gönder</button>
                  <button style={{ ...s.btnOutline, marginTop: 8 }} className="btn-hover" onClick={() => setShowFeedback(false)}>İptal</button>
                </>
              )}

              {myFeedbacks.length > 0 && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e8e8ed'}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', marginBottom: 10 }}>GEÇMİŞ GERİ BİLDİRİMLERİN</div>
                  {myFeedbacks.map((f, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f5f5f7', borderRadius: 0, borderLeft: `3px solid ${f.is_read ? '#157a3c' : '#6e6e73'}`, borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#e8e8ed'}`, borderRight: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#e8e8ed'}`, borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#e8e8ed'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: f.is_read ? '#157a3c' : '#6e6e73', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
                        <span style={{ fontSize: 11, color: '#86868b' }}>{new Date(f.created_at).toLocaleDateString('tr')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: s.qText.color, lineHeight: 1.4 }}>{f.message}</div>
                      {f.admin_reply && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '6px 10px', background: 'rgba(0, 71, 187, 0.08)', borderRadius: 0, fontSize: 12, color: '#0047bb' }}>
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

        {/* Üst satır: liderler, kaynaklar, Skool */}
        <div className="d-top">
          <div className="d-cell">
            <div className="d-head" style={{ ...s.label, ...s.headIcon }}><IconAward size={15} style={{ color: '#0047bb' }} />Bugünün liderleri</div>
            {top3.length > 0 && <div style={{ ...s.joke, marginTop: 8 }}>{getDailyJoke(top3[0]?.username)}</div>}
            {(!top3 || top3.length === 0) ? (
              <div style={s.mutedText}>Henüz soru çözülmedi. İlk sen ol!</div>
            ) : top3.map((p, i) => (
              <div key={i} style={s.lbRow}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ ...s.rankBadge2, ...(i === 0 ? s.rankBadgeFirst : {}) }}>{i + 1}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.username}</span>
                </span>
                <span style={s.lbScore}>{p.total_score} XP</span>
              </div>
            ))}
            {myRank
              ? <div style={s.myRankBox}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><IconTarget size={15} style={{ color: '#0047bb' }} />Sen bugün <strong>{myRank}. sıradasın</strong></span><span style={s.lbScore}>{myLeaderboardScore} XP</span></div>
              : <div style={{ ...s.myRankBoxGray, display: 'flex', alignItems: 'center', gap: 8 }}><IconTarget size={15} />Soru çöz, sıralamada görün.</div>
            }
          </div>

          <div className="d-cell">
            <div className="d-head" style={{ ...s.label, ...s.headIcon }}><IconBookOpen size={15} style={{ color: '#0047bb' }} />Kaynaklar</div>
            <button
              className="cat-btn-hover"
              style={s.resBtn}
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
              <span style={s.resIcon}><IconFileText size={17} /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={s.resTitle}>Ücretsiz özet ders notu</span>
                <span style={s.resSub}>Dersini seç, PDF e-postana gelsin</span>
              </span>
              <IconChevronRight size={16} style={{ color: '#0047bb', flexShrink: 0 }} />
            </button>
            <button
              className="cat-btn-hover"
              style={s.resBtn}
              onClick={() => {
                setCrSelected([]);
                setCrDone(false);
                setCrOpenBolum('İşletme');
                setScreen('course-request');
              }}
            >
              <span style={s.resIcon}><IconEdit size={17} /></span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={s.resTitle}>Ders materyali iste</span>
                <span style={s.resSub}>Listede olmayan dersi yaz</span>
              </span>
              <IconChevronRight size={16} style={{ color: '#0047bb', flexShrink: 0 }} />
            </button>
          </div>

          <div className="d-blue btn-hover" role="button" tabIndex={0}
            onClick={() => { setPrevScreen('home'); setScreen('product-detail'); }}
            onKeyDown={e => { if (e.key === 'Enter') { setPrevScreen('home'); setScreen('product-detail'); } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ ...s.label, color: '#c9d8f5' }}>AÖF Skool topluluğu</div>
              <IconUsers size={30} style={{ color: '#ffffff', opacity: 0.9, flexShrink: 0 }} />
            </div>
            <div style={s.blueTitle}>Tüm derslerin sınav özetleri tek yerde</div>
            <div style={s.blueText}>Özetler ve soru-cevap Skool topluluğunda.</div>
            <span style={s.blueLink}>Katıl →</span>
          </div>
        </div>

        <div style={s.pratikHead} id="pratik-yap">
          <h2 style={{ ...s.h2, display: 'flex', alignItems: 'center', gap: 10 }}><IconTarget size={22} style={{ color: '#0047bb' }} />Pratik yap</h2>
          <div style={s.examTabRow}>
            <button type="button" style={examType === 'vize' ? s.examTabActiveVize : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('vize'); }}><IconFileText size={14} />Vize</button>
            <button type="button" style={examType === 'final' ? s.examTabActiveFinal : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('final'); }}><IconGraduationCap size={14} />Final</button>
            <button type="button" style={examType === 'yazokulu' ? s.examTabActiveYazOkulu : s.examTab} onClick={(e) => { e.preventDefault(); setExamType('yazokulu'); }}><IconSun size={14} />Yaz Okulu</button>
          </div>
        </div>

        {categories.length === 0 && <div style={s.empty}>{catsLoaded ? 'Yakında dersler eklenecek...' : 'Dersler yükleniyor...'}</div>}

        <div style={{ minHeight: '50vh', paddingBottom: 40 }}>
          {filteredCategoryNodes.length > 0 && (
            <div className="d-courses">{filteredCategoryNodes}</div>
          )}
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
            ← Derslere dön
          </button>
          <div style={s.progress}>Soru {currentQ + 1} / {questions.length}</div>
          <div style={s.rankBadge}>
            <IconAward size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
            <span>{score} XP{myRank ? ` · #${myRank}` : ''}</span>
          </div>
        </div>
        <div style={s.pline}><div style={{ ...s.plineFill, width: `${((currentQ + 1) / questions.length) * 100}%` }} /></div>

        <div style={s.quizScroll} onClick={() => { if (selected) handleNext(); }}>
          <div style={{ ...s.quizCard, opacity: quizLoading ? 0.4 : 1, pointerEvents: quizLoading ? 'none' : 'auto', transition: 'opacity 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
              <div style={{ ...s.catLabel, flex: 1, wordBreak: 'break-word', lineHeight: 1.3 }}>{activeCategory?.name}</div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'nowrap' }}>
                {q.year && <div style={s.yearBadge}>{q.year}</div>}
                {q.frequency > 1 && <div style={{ ...s.freqBadge, display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconFlame size={11} /> {q.frequency}x</div>}
              </div>
            </div>
            <div style={s.qText}>{formatQuestion(q.question_text)}</div>
            <div style={s.divider} />
            {opts.map((opt, i) => {
              if (!vals[i]) return null;

              // Sade ızgara: satır arka planı yok; durum renk ve etiketle gösterilir
              let color = '#101318';
              let letterColor = '#0047bb';
              let fontWeight = 400;
              let textDecoration = 'none';
              let tag = null;

              if (selected) {
                if (opt.toLowerCase() === q.correct_option.toLowerCase()) {
                  color = '#157a3c'; letterColor = '#157a3c'; fontWeight = 700;
                  tag = <span style={s.optTag}>Doğru</span>;
                }
                else if (opt === selected) {
                  color = '#6a717d'; letterColor = '#c62828'; textDecoration = 'line-through';
                  tag = <span style={{ ...s.optTag, color: '#c62828' }}>Yanlış</span>;
                }
              }
              return (
                <button key={opt} className="opt-btn-hover" style={{ ...s.optBtn, color, fontWeight }}
                  onClick={e => { e.stopPropagation(); if (selected) handleNext(); else handleAnswer(opt); }}>
                  <span style={{ ...s.optLetter, color: letterColor }}>{opt}</span>
                  <span style={{ ...s.optText, textDecoration }}>{vals[i]}</span>
                  {tag}
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
                borderRadius: 0,
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
                  borderRadius: 0,
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
                  <IconCheckCircle size={48} style={{ color: '#157a3c', display: 'block', margin: '16px auto' }} />
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...s.modalTitle }}>
                      <IconFlag size={20} style={{ color: theme === 'dark' ? '#ff453a' : '#d70015' }} />
                      <span>Hatalı Soru Bildir</span>
                    </div>
                    <div style={{ fontSize: 13, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', marginBottom: 18 }}>Sorunun türünü seç, ekibimize iletilsin.</div>
                    {[
                      { icon: <IconEdit size={20} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb' }} />, label: 'Yazım / imla hatası', desc: 'Soruda veya seçeneklerde yazım yanlışı var' },
                      { icon: <IconXCircle size={20} style={{ color: theme === 'dark' ? '#ff453a' : '#d70015' }} />, label: 'Doğru şık yanlış işaretli', desc: 'Cevap anahtarı yanlış görünüyor' },
                      { icon: <IconHelpCircle size={20} style={{ color: '#6e6e73' }} />, label: 'Mantık / içerik hatası', desc: 'Soru mantıksal olarak hatalı veya eksik' },
                    ].map(opt => (
                      <button key={opt.label}
                        className="opt-btn-hover"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 0, border: theme === 'dark' ? '1.5px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #e8e8ed', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f5f5f7', color: s.qText.color, cursor: 'pointer', textAlign: 'left', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}
                        onClick={() => sendReport(opt.label)}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, width: 24 }}>{opt.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: s.qText.color }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: '#86868b', marginTop: 2 }}>{opt.desc}</div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.greeting.color, fontSize: 12, fontWeight: 600 }}>
                <IconZap size={16} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb' }} />
                <span>Sınav Sabahı Bilmen Gereken 25 Terim</span>
              </div>
              <IconChevronRight size={18} style={{ color: s.progress.color }} />
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
          {/* Puan kahramanı — sonucun kendisi ekranın en büyük öğesi */}
          <div style={{ textAlign: 'center', padding: '22px 0 4px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: s.progress.color }}>
              {r.type === 'vize' ? 'Vize denemesi' : 'Final denemesi'}
            </div>
            <div style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              marginTop: 8,
              fontVariantNumeric: 'tabular-nums',
              color: r.puan >= 50 ? (theme === 'dark' ? '#157a3c' : '#0047bb') : s.greeting.color,
            }}>{r.puan}</div>
            <div style={{ fontSize: 13, color: s.progress.color, marginTop: 2 }}>100 üzerinden</div>
          </div>
          <div style={s.resultTitle}>{r.puan >= 50 ? 'Harika sonuç' : 'Çalışmaya devam'}</div>

          <div style={s.resultCard}>
            <div style={s.resultRow}>
              <span>
                <IconCheckCircle size={16} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                <span>Doğru</span>
              </span>
              <strong>{correct}</strong>
            </div>
            <div style={s.resultRow}>
              <span>
                <IconXCircle size={16} style={{ color: theme === 'dark' ? '#ff453a' : '#d70015', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                <span>Yanlış</span>
              </span>
              <strong>{wrong}</strong>
            </div>
            <div style={s.divider} />

            {r.type === 'vize' ? (
              <>
                <div style={s.resultRow}>
                  <span>
                    <IconFileText size={16} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
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
                    <IconGraduationCap size={16} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
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
                  Netlerini artırmak için sınav özetlerini ve soru-cevabı Skool topluluğunda incele ›
                </p>
              </div>
            </div>
          </div>

          {/* Başarı Notu Hesapla - sadece final sınavında */}
          {r.type === 'final' && (
            <button
              className="btn-hover"
              style={{ ...s.btn, marginBottom: 8, justifyContent: 'center' }}
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
              background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0, 0, 0, 0.04)', borderRadius: 0,
              padding: '14px 16px', marginTop: 14, textDecoration: 'none',
              border: `1.5px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            <div style={{ background: '#ff0000', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconPlay size={16} style={{ color: '#fff', marginLeft: 2 }} />
            </div>
            <div>
              <div style={{ color: s.greeting.color, fontWeight: 600, fontSize: 14 }}>YouTube'da takip et!</div>
              <div style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.55)' : '#6e6e73', fontSize: 12, marginTop: 2 }}>@aofseslinotlar — sesli anlatımlar, özetler</div>
            </div>
            <IconChevronRight size={18} style={{ marginLeft: 'auto', color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#0047bb' }} />
          </a>
        </div>

        {/* Geçtim mi? Modal */}
        {showPassCheck && (
          <div style={s.modalOverlay} onClick={() => setShowPassCheck(false)}>
            <div style={{ ...s.modalBox, maxWidth: 360 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight: 600, fontSize: 18, color: s.qText.color, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><IconGraduationCap size={20} /> Başarı Notu Hesapla</div>
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', marginBottom: 16 }}>
                Vize notunu gir, final puanınla birlikte hesaplayalım.<br/>
                <span style={{ fontSize: 12 }}>Vize %30 + Final %70 ≥ 35 → Geçtin!</span>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: s.qText.color, display: 'block', marginBottom: 6 }}>Vize Notun (0–100)</label>
              <input
                type="number" min="0" max="100"
                placeholder="örn: 60"
                value={vizeInput}
                onChange={e => { setVizeInput(e.target.value); setPassResult(null); }}
                style={s.input}
              />

              {/* Final puanı bilgi satırı */}
              <div style={{ fontSize: 13, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', marginBottom: 14, background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#f5f5f7', borderRadius: 0, padding: '9px 12px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid #e8e8ed' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><IconBarChart size={15} /> Bu sınavdaki final puanın: <strong style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb' }}>{r.puan} / 100</strong></span>
              </div>

              <button
                style={{ ...s.btn, marginBottom: 8 }}
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
                  borderRadius: 0, padding: '14px 16px', textAlign: 'center',
                  background: passResult.gecti ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 69, 58, 0.14)',
                  border: `1px solid ${passResult.gecti ? '#157a3c' : '#ff453a'}`,
                  color: passResult.gecti ? (theme === 'dark' ? '#157a3c' : '#0047bb') : (theme === 'dark' ? '#ff453a' : '#d70015'),
                  fontWeight: 600, fontSize: 16, marginBottom: 8,
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{passResult.gecti ? <IconCheckCircle size={18} /> : <IconBookOpen size={18} />}{passResult.gecti ? 'Tebrikler, geçtin!' : 'Maalesef geçemedin.'}</span>
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
            <div style={s.greeting}>Skool Topluluğu</div>
            <div style={{ width: 60 }}></div>
          </div>

          <div style={s.card}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img
                src="/ozet-pdf-gorsel.jpg"
                alt="Skool topluluğu sınav özetleri"
                width={720}
                height={432}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxWidth: 360,
                  borderRadius: 0, 
                  boxShadow: theme === 'dark' ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.1)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
                  marginBottom: 8
                }} 
              />
            </div>
            
            <div style={s.cardTitle}>Tüm Kitabı Okuyacak Vaktin Yok. Çıkması En Muhtemel Konuları Toplulukla Birlikte Çalış.</div>
            <div style={{ fontSize: 13, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', lineHeight: 1.6, marginBottom: 16 }}>
              Geçmiş 6-7 yılın çıkmış soruları tek tek analiz edildi; hangi konudan kaç soru geldiği sayıldı, en çok tekrar edenler sınav özetlerinde toplandı. Bu materyallerin tamamı Skool topluluğumuzda. Takıldığın yeri sorabilir, aynı dersi alan arkadaşlarınla birlikte çalışabilirsin.
            </div>

            <div style={{
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f5f5f7',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e8e8ed',
              borderRadius: 0,
              padding: 14,
              marginBottom: 16,
              fontSize: 12.5,
              color: theme === 'dark' ? '#c9cfd8' : '#6e6e73',
              lineHeight: 1.6,
              fontStyle: 'italic',
              textAlign: 'left'
            }}>
              "Ben de AÖF öğrencisiyim ve bu sınavlara ben de giriyorum. Bu notları önce kendim geçmek için hazırladım, sonra paylaşmaya karar verdim. İçinde işe yaramayan tek satır yok — çünkü ilk kullanan benim."
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              color: theme === 'dark' ? '#157a3c' : '#0047bb',
              padding: '6px 12px',
              borderRadius: 0,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 18,
              border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`
            }}>
              <IconBookOpen size={14} style={{ marginRight: 2 }} />
              10+ Aktif Ders Seçeneği
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <IconTarget size={20} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Sınav Sabahı Bilmen Gereken 25 Terim:</strong> Sınavdan hemen önce bilmeniz gereken en kritik 25 terim ve tanım elinizin altında.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <IconBarChart size={20} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Çıkmış Soru Analizi:</strong> Geçmiş sınav soruları tek tek incelenerek, tekrar tekrar sorulan konular tespit edildi.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <IconZap size={20} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Soru-Cevap ve Yardımlaşma:</strong> Takıldığın konuyu Skool topluluğunda sor, hızlıca cevap al; aynı dersi alan arkadaşlarınla birlikte çalış.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <IconPhone size={20} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: s.qText.color, textAlign: 'left', lineHeight: 1.4 }}>
                  <strong>Mobil Uyumlu Format:</strong> Telefon, tablet veya bilgisayarınızdan her yerde kolayca çalışabilirsiniz.
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24, paddingTop: 20, borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8ed' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: s.qText.color, marginBottom: 16, textAlign: 'center' }}>
                Öğrenciler ne diyor?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                  borderRadius: 0,
                  padding: 12,
                  borderTop: '2px solid #101318'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: theme === 'dark' ? '#157a3c' : '#0047bb' }}>
                      Z
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.qText.color }}>Zeynep</div>
                      <div style={{ fontSize: 11, color: theme === 'dark' ? '#6e6e73' : '#86868b' }}>Yeni</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.qText.color, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "Yıllardır geçemediğim Sayısal Karar Verme'yi bu doküman sayesinde geçtim. Sözel sorularda zaten 7-8 soruyu garantilemiştim."
                  </div>
                </div>

                <div style={{
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                  borderRadius: 0,
                  padding: 12,
                  borderTop: '2px solid #101318'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: theme === 'dark' ? '#157a3c' : '#0047bb' }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.qText.color }}>Atlas</div>
                      <div style={{ fontSize: 11, color: theme === 'dark' ? '#6e6e73' : '#86868b' }}>Yeni</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.qText.color, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "Tek kelimeyle harika 2 yıldır geçemedığim dersi sonunda verdim :)"
                  </div>
                </div>

                <div style={{
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                  borderRadius: 0,
                  padding: 12,
                  borderTop: '2px solid #101318'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: theme === 'dark' ? '#157a3c' : '#0047bb' }}>
                      Y
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.qText.color }}>Yyyyy</div>
                      <div style={{ fontSize: 11, color: theme === 'dark' ? '#6e6e73' : '#86868b' }}>Yeni</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.qText.color, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "Uzun zamandır bu kadar iyi ihazırlanmış kaynak bulamıyordum umarm daha fazla ders eklenir"
                  </div>
                </div>

                <div style={{
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                  borderRadius: 0,
                  padding: 12,
                  borderTop: '2px solid #101318'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: theme === 'dark' ? '#157a3c' : '#0047bb' }}>
                      M
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.qText.color }}>Merve</div>
                      <div style={{ fontSize: 11, color: theme === 'dark' ? '#6e6e73' : '#86868b' }}>Yeni</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: s.qText.color, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "Her kuruşuna değer. Zaten 10 soru yapsam geçiyordum 6 sını sınav sabahı altın bilgiler içinden öğrendim"
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: s.qText.color, marginBottom: 4, textAlign: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><IconCamera size={16} /> Sayfadan Kesitler</span>
              </div>
              <div style={{ fontSize: 11.5, color: theme === 'dark' ? '#9aa1ab' : '#6e6e73', marginBottom: 12, textAlign: 'center' }}>
                Toplulukta paylaşılan sınav özetlerinden örnek sayfalar.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <img src="/pdf-kesit-1.png" alt="PDF sayfa kesiti 1" loading="lazy" decoding="async" width={900} height={774} style={{ width: '100%', height: 'auto', borderRadius: 0, border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8ed', boxShadow: theme === 'dark' ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.06)' }} />
                <img src="/pdf-kesit-2.png" alt="PDF sayfa kesiti 2" loading="lazy" decoding="async" width={900} height={720} style={{ width: '100%', height: 'auto', borderRadius: 0, border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8ed', boxShadow: theme === 'dark' ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.06)' }} />
                <img src="/pdf-kesit-3.png" alt="PDF sayfa kesiti 3" loading="lazy" decoding="async" width={900} height={586} style={{ width: '100%', height: 'auto', borderRadius: 0, border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8ed', boxShadow: theme === 'dark' ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.06)' }} />
                <img src="/pdf-kesit-4.png" alt="PDF sayfa kesiti 4" loading="lazy" decoding="async" width={900} height={529} style={{ width: '100%', height: 'auto', borderRadius: 0, border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8ed', boxShadow: theme === 'dark' ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 4px 14px rgba(0, 0, 0, 0.06)' }} />
              </div>
            </div>

            <a href={SKOOL_URL} target="_blank" rel="noopener noreferrer" onClick={trackSkoolClick} className="btn-hover" style={{ ...s.btn, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, padding: '14px', borderRadius: 0, boxShadow: 'none' }}>
              <span>Topluluğa Katıl: Tüm Materyaller ve Soru-Cevap</span>
              <IconChevronRight size={18} />
            </a>

          </div>
        </div>
      </div>
    );
  }

  if (screen === 'course-request') {
    const accent = theme === 'dark' ? '#157a3c' : '#0047bb';
    const muted = theme === 'dark' ? '#a1a1a6' : '#6e6e73';
    const border = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0, 0, 0, 0.08)';

    return (
      <div style={s.bg}>
        <div style={s.container}>
          <div style={s.header}>
            <button style={s.backBtn} className="btn-hover" onClick={() => setScreen('home')}>
              <IconChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Geri
            </button>
            <div style={s.greeting}>Ders Materyali İsteği</div>
            <div style={{ width: 60 }}></div>
          </div>

          <div style={s.card}>
            <IconEdit size={28} style={{ display: 'block', margin: '0 auto 6px auto', color: accent }} />
            <div style={{ ...s.cardTitle, fontSize: 15 }}>Hangi derslerin materyalini istiyorsun?</div>
            <div style={{ fontSize: 12, color: muted, marginBottom: 12, lineHeight: 1.5 }}>
              Bölümüne dokun, dersleri seç. Birden fazla seçebilirsin. En çok istenen dersleri sıraya alıyoruz.
            </div>

            {crDone ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <IconCheckCircle size={36} style={{ color: '#157a3c', display: 'block', margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: theme === 'dark' ? '#157a3c' : '#0047bb' }}>İsteğin alındı, teşekkürler!</div>
                <button
                  className="btn-hover"
                  style={{ ...s.btn, background: 'transparent', border: '1px solid ' + border, color: s.greeting.color, justifyContent: 'center', marginTop: 12, fontSize: 12, padding: '8px 12px' }}
                  onClick={() => setCrDone(false)}
                >
                  <span>Yeni istek gönder</span>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'left' }}>
                {AOF_BOLUMLER.map(b => {
                  const acik = crOpenBolum === b.bolum;
                  const secili = crSelected.filter(x => x.department === b.bolum).length;
                  return (
                    <div key={b.bolum} style={{ marginBottom: 6, border: '1px solid ' + border, borderRadius: 0, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setCrOpenBolum(acik ? null : b.bolum)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          padding: '8px 10px',
                          background: acik
                            ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
                            : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: s.greeting.color,
                          fontSize: 12.5,
                          fontWeight: 600,
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ flex: 1 }}>{b.bolum}</span>
                        {secili > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: accent, color: theme === 'dark' ? '#03110b' : '#fff', borderRadius: 0, padding: '1px 6px' }}>{secili}</span>
                        )}
                        <span style={{ fontSize: 10, color: muted }}>{b.dersler.length}</span>
                        <IconChevronRight size={13} style={{ color: muted, transform: acik ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                      </button>

                      {acik && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px 8px 8px' }}>
                          {b.dersler.map(d => {
                            const sec = crSelected.some(x => x.name === d && x.department === b.bolum);
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => crToggle(b.bolum, d)}
                                style={{
                                  fontSize: 11,
                                  lineHeight: 1.3,
                                  padding: '4px 8px',
                                  borderRadius: 0,
                                  cursor: 'pointer',
                                  border: '1px solid ' + (sec ? accent : border),
                                  background: sec ? accent : 'transparent',
                                  color: sec ? (theme === 'dark' ? '#03110b' : '#fff') : s.greeting.color,
                                  fontWeight: sec ? 600 : 400,
                                  transition: 'all 0.15s'
                                }}
                              >
                                {sec ? '✓ ' : ''}{d}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ position: 'sticky', bottom: 0, paddingTop: 10, background: 'transparent' }}>
                  <div style={{ fontSize: 11.5, color: muted, textAlign: 'center', marginBottom: 6 }}>
                    {crSelected.length > 0 ? crSelected.length + ' ders seçildi' : 'Henüz ders seçmedin'}
                  </div>
                  <button
                    className="btn-hover"
                    style={{
                      ...s.btn,
                      fontSize: 12.5,
                      padding: '10px 12px',
                      justifyContent: 'center',
                      background: crSelected.length ? accent : '#e8e8ed',
                      color: crSelected.length ? (theme === 'dark' ? '#04140b' : '#fff') : '#86868b',
                      cursor: crSelected.length ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!crSelected.length || crSending}
                    onClick={sendMaterialRequest}
                  >
                    <span>{crSending ? 'Gönderiliyor...' : 'Seçtiklerimin ders materyallerini görmek isterim'}</span>
                  </button>
                </div>
              </div>
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
            <IconBookOpen size={48} style={{ color: theme === 'dark' ? '#157a3c' : '#0047bb', marginBottom: 8, display: 'block', margin: '0 auto 8px auto' }} />
            <div style={s.cardTitle}>Derslerini Seç</div>
            <div style={{ fontSize: 13, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', marginBottom: 16 }}>
              Seçtiğin derslerin özet notlarını e-posta olarak göndereceğiz. En fazla 3 ders seçebilirsin.
            </div>

            {pdfNotes.length === 0 ? (
              <div style={s.empty}>Henüz özet notu eklenmemiş.</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {pdfNotes.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', border: theme === 'dark' ? '1.5px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #e8e8ed', borderRadius: 0, marginBottom: 8, cursor: 'pointer', background: notesSelected.some(p => p.id === c.id) ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#eef3fc') : 'transparent' }}>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>E-posta Adresin</label>
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
              <span style={{ fontSize: 12, color: theme === 'dark' ? '#a1a1a6' : '#6e6e73', lineHeight: 1.4 }}>
                E-posta adresimin kampanya ve duyurular (YouTube vs.) için kaydedilmesini ve bana e-posta gönderilmesini onaylıyorum.
              </span>
            </label>

            {notesResult === 'success' && (
              <div style={{ background: 'rgba(255, 255, 255, 0.08)', color: theme === 'dark' ? '#157a3c' : '#0047bb', border: '1px solid #30d47e', padding: '12px', borderRadius: 0, fontSize: 14, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconCheckCircle size={16} />
                  <span>Notların başarıyla e-postana gönderildi! Lütfen Spam (Gereksiz) kutunu da kontrol et.</span>
                </span>
              </div>
            )}
            {notesResult && notesResult !== 'success' && (
              <div style={{ background: 'rgba(255, 69, 58, 0.14)', color: theme === 'dark' ? '#ff453a' : '#991b1b', border: '1px solid #ff453a', padding: '12px', borderRadius: 0, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconXCircle size={16} />
                  <span>{notesResult}</span>
                </span>
              </div>
            )}

            <button
              className="btn-hover"
              style={{ ...s.btn, background: (notesSending || notesSelected.length === 0 || !notesEmail || !notesKvkk) ? '#e8e8ed' : (theme === 'dark' ? '#157a3c' : '#0047bb'), color: (notesSending || notesSelected.length === 0 || !notesEmail || !notesKvkk) ? '#86868b' : (theme === 'dark' ? '#04140b' : '#fff'), cursor: (notesSending || notesSelected.length === 0 || !notesEmail || !notesKvkk) ? 'not-allowed' : 'pointer', fontSize: 16, padding: '16px', justifyContent: 'center' }}
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

const GREEN = '#0047bb'; // marka laciverti (adı geçmişten kalma)
const GREEN_DARK = '#003a99';
const GREEN_LIGHT = '#157a3c';

// "İşletme Yönetimi" → "İY", "İstatistik" → "İS"
const tileInitials = (name) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase('tr');
  return (words[0][0] + words[1][0]).toLocaleUpperCase('tr');
};

const getStyles = (theme) => {
  const isDark = theme === 'dark';
  
  // Sade ızgara: beyaz zemin, tek lacivert vurgu, ince çizgiler; başarı yeşil, hata kırmızı (semantik)
  const colors = {
    bgDark: '#ffffff',
    bgGradient: 'none',
    primary: '#0047bb',
    primaryHover: '#003a99',
    primaryGlow: 'rgba(0, 71, 187, 0.16)',
    accent: '#0047bb',
    accentHover: '#003a99',
    danger: '#c62828',
    dangerBg: 'rgba(198, 40, 40, 0.07)',
    successBg: 'rgba(21, 122, 60, 0.07)',
    cardBg: '#ffffff',
    cardBorder: '#e4e7ec',
    textMain: '#101318',
    textMuted: '#6a717d',
    textFaint: '#8a909b',
    surface2: '#f4f6f9',
    line: '#d5dae1',
    separator: '#e4e7ec',
    segTrack: 'transparent',
    accentFill: '#0047bb',
    accentFillText: '#ffffff',
    accentFillHover: '#003a99',
    elev: '0 1px 2px rgba(16,19,24,0.06), 0 12px 32px rgba(16,19,24,0.12)',
    elevSm: 'none',
    vizeActiveBg: 'transparent',
    vizeActiveText: '#0047bb',
    correctText: '#157a3c',
    wrongText: '#c62828',
    activeYearBg: 'transparent',
    activeYearText: '#0047bb',
    badgeYearText: '#6a717d',
    badgeYearBg: '#f4f6f9',
    badgeYearBorder: 'transparent',
    badgeFreqText: '#b25e00',
    badgeFreqBg: 'rgba(178, 94, 0, 0.08)',
    badgeFreqBorder: 'transparent',
    warningText: '#b25e00',
    warningBorder: 'rgba(178, 94, 0, 0.20)',
    warningBg: 'rgba(178, 94, 0, 0.07)',
    successText: '#157a3c',
    successBorder: 'rgba(21, 122, 60, 0.24)',
    successTextBg: 'rgba(21, 122, 60, 0.07)',
  };
  const NARROW = "'Archivo Narrow', 'Arial Narrow', sans-serif";
  const tabBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 0',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'transparent',
    color: colors.textMuted,
    fontFamily: NARROW,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  };
  const tabActive = { ...tabBase, color: colors.primary, borderBottom: `2px solid ${colors.primary}` };

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
      fontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: colors.textMain,
      position: 'relative',
      overflowX: 'hidden',
    },
    splashBox: {
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 0,
      padding: 32,
      width: '100%',
      maxWidth: 400,
      textAlign: 'center',
      marginTop: 60,
      boxShadow: colors.elev,
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
      fontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      borderRadius: 0,
      overflow: 'hidden',
      border: 'none',
      background: colors.surface2,
      padding: 3,
    },
    tab: {
      flex: 1,
      padding: '9px 0',
      border: 'none',
      background: 'transparent',
      color: colors.textMuted,
      fontWeight: 500,
      fontSize: 13.5,
      cursor: 'pointer',
      borderRadius: 0,
      transition: 'all 0.18s',
    },
    tabActive: {
      flex: 1,
      padding: '9px 0',
      border: 'none',
      background: colors.cardBg,
      color: colors.textMain,
      fontWeight: 600,
      fontSize: 13.5,
      cursor: 'pointer',
      borderRadius: 0,
      boxShadow: colors.elevSm,
      transition: 'all 0.18s',
    },
    input: {
      width: '100%',
      padding: '13px 16px',
      borderRadius: 0,
      border: `1px solid ${colors.line}`,
      background: colors.cardBg,
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
      padding: '13px 20px',
      borderRadius: 0,
      border: 'none',
      background: colors.accentFill,
      color: colors.accentFillText,
      fontWeight: 700,
      fontSize: 15,
      cursor: 'pointer',
      marginTop: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      minHeight: 46,
    },
    btnOutline: {
      width: '100%',
      padding: '12px 20px',
      borderRadius: 0,
      border: `1.5px solid ${colors.textMain}`,
      background: 'transparent',
      color: colors.textMain,
      fontWeight: 700,
      fontSize: 15,
      cursor: 'pointer',
      marginTop: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      minHeight: 46,
    },
    errMsg: {
      background: colors.dangerBg,
      border: `1px solid ${isDark ? 'rgba(255, 69, 58, 0.14)' : 'rgba(215, 0, 21, 0.07)'}`,
      color: colors.wrongText,
      borderRadius: 0,
      padding: '12px 16px',
      fontSize: 13,
      marginBottom: 10,
      textAlign: 'left',
      fontWeight: 500,
    },
    container: {
      width: '100%',
      maxWidth: 680,
      paddingBottom: 16,
      position: 'relative',
      zIndex: 10,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
      paddingBottom: 14,
      borderBottom: `1px solid ${colors.cardBorder}`,
    },
    greeting: {
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-0.02em',
      color: colors.textMain,
      fontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    feedbackIconBtn: {
      background: 'transparent',
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 0,
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
      background: 'transparent',
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 0,
      padding: '7px 12px',
      color: colors.textMain,
      fontWeight: 600,
      fontSize: 12,
      cursor: 'pointer',
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      transition: 'all 0.3s',
    },
    headerLogo: {
      width: 36,
      height: 36,
      objectFit: 'contain',
      borderRadius: 0,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(16,19,24,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    },
    modalBox: {
      background: colors.cardBg,
      border: 'none',
      borderRadius: 0,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      boxShadow: colors.elev,
    },
    modalTitle: {
      fontWeight: 600,
      fontSize: 17,
      color: colors.textMain,
      marginBottom: 6,
      fontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    feedbackInput: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 0,
      border: `1px solid ${colors.line}`,
      background: colors.cardBg,
      color: colors.textMain,
      fontSize: 15,
      fontFamily: 'inherit',
      resize: 'none',
      outline: 'none',
      boxSizing: 'border-box',
    },
    card: {
      background: colors.cardBg,
      border: 'none',
      borderTop: `2px solid ${colors.textMain}`,
      borderRadius: 0,
      padding: '18px 0',
      marginBottom: 16,
      boxShadow: 'none',
    },
    // iOS gruplu liste kabı: satırlar içine gelir, ayraçlar ikon hizasından başlar
    group: {
      background: colors.cardBg,
      borderRadius: 0,
      overflow: 'hidden',
      marginBottom: 16,
    },
    groupHeader: {
      fontFamily: NARROW,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: colors.textMuted,
      padding: '0 0 8px 0',
    },
    rowTile: {
      width: 28,
      height: 28,
      borderRadius: 0,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.02em',
      lineHeight: 1,
      color: isDark ? '#0b0b0d' : '#ffffff',
    },
    rowSep: {
      position: 'absolute',
      left: 56,
      right: 0,
      top: 0,
      height: 1,
      background: colors.separator,
    },
    cardTitle: {
      fontWeight: 800,
      fontSize: 22,
      lineHeight: 1.15,
      letterSpacing: '-0.02em',
      marginBottom: 12,
      color: colors.textMain,
    },
    cardTitle2: {
      fontWeight: 600,
      fontSize: 14,
      marginBottom: 10,
      color: colors.textMain,
      fontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    lbRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      padding: '9px 0',
      borderBottom: `1px solid ${colors.cardBorder}`,
      fontSize: 15,
      color: colors.textMain,
      fontVariantNumeric: 'tabular-nums',
    },
    lbScore: {
      fontWeight: 700,
      color: colors.primary,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    },
    myRankBox: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
      background: '#eef3fc',
      borderRadius: 0,
      padding: '10px 12px',
      fontSize: 14,
      color: colors.textMain,
      fontVariantNumeric: 'tabular-nums',
    },
    myRankBoxGray: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
    },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      padding: 20,
      fontSize: 14,
    },
    catBtn: {
      position: 'relative',
      width: '100%',
      background: 'transparent',
      border: 'none',
      borderBottom: `1px solid ${colors.cardBorder}`,
      borderRadius: 0,
      padding: '14px 4px 14px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      cursor: 'pointer',
      color: colors.textMain,
      minHeight: 52,
      textAlign: 'left',
    },
    catArrow: {
      color: colors.textFaint,
      fontWeight: 500,
      fontSize: 18,
      display: 'flex',
      alignItems: 'center',
    },
    yearBar: {
      background: colors.bgDark,
      borderBottom: `1px solid ${colors.cardBorder}`,
      padding: '8px 16px',
      display: 'flex',
      gap: 18,
      overflowX: 'auto',
      flexShrink: 0,
      WebkitOverflowScrolling: 'touch',
    },
    yearBtn: {
      ...tabBase,
      fontSize: 13,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      minHeight: 32,
    },
    yearBtnActive: {
      color: colors.primary,
      borderBottom: `2px solid ${colors.primary}`,
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
      gap: 10,
      padding: '8px 16px',
      flexShrink: 0,
      maxWidth: 712,
      margin: '0 auto',
      width: '100%',
      boxSizing: 'border-box',
    },
    backBtn: {
      background: 'transparent',
      border: 'none',
      color: colors.primary,
      padding: '7px 0',
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: 14,
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 36,
    },
    progress: {
      color: colors.textMuted,
      fontFamily: NARROW,
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontVariantNumeric: 'tabular-nums',
    },
    rankBadge: {
      color: colors.textMuted,
      fontFamily: NARROW,
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: '0.04em',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
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
      background: 'transparent',
      border: 'none',
      padding: '12px 0 6px',
      marginBottom: 6,
      width: '100%',
      maxWidth: 680,
      boxSizing: 'border-box',
    },
    catLabel: {
      fontFamily: NARROW,
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: colors.primary,
    },
    qText: {
      fontSize: 'clamp(15px, 4vw, 19px)',
      color: colors.textMain,
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '-0.01em',
    },
    divider: {
      height: 1,
      background: colors.cardBorder,
      margin: '12px 0 0',
    },
    optBtn: {
      width: '100%',
      padding: '9px 4px 9px 0',
      background: 'transparent',
      border: 'none',
      borderBottom: `1px solid ${colors.cardBorder}`,
      borderRadius: 0,
      cursor: 'pointer',
      fontSize: 'clamp(14px, 3.8vw, 16px)',
      lineHeight: 1.35,
      textAlign: 'left',
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      minHeight: 42,
    },
    optLetter: {
      width: 28,
      flexShrink: 0,
      fontFamily: NARROW,
      fontWeight: 700,
      fontSize: 15,
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
      border: 'none',
      borderRadius: 0,
      padding: '3px 9px',
      fontSize: 10.5,
      fontWeight: 500,
      color: colors.badgeFreqText,
    },
    yearBadge: {
      background: colors.badgeYearBg,
      border: 'none',
      borderRadius: 0,
      padding: '3px 9px',
      fontSize: 10.5,
      fontWeight: 500,
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
      fontSize: 28,
      fontWeight: 800,
      letterSpacing: '-0.03em',
      color: colors.textMain,
      marginTop: 4,
      marginBottom: 22,
    },
    resultCard: {
      background: colors.cardBg,
      borderTop: `2px solid ${colors.textMain}`,
      padding: '4px 0 16px',
      marginBottom: 12,
      marginTop: 8,
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '11px 0',
      borderBottom: `1px solid ${colors.cardBorder}`,
      fontSize: 14,
      color: colors.textMain,
      fontVariantNumeric: 'tabular-nums',
    },
    gectiBox: {
      background: colors.successTextBg,
      border: 'none',
      borderRadius: 0,
      padding: '14px 16px',
      color: colors.successText,
      fontWeight: 500,
      fontSize: 13.5,
      lineHeight: 1.5,
      marginTop: 14,
    },
    kaldiBox: {
      background: colors.warningBg,
      border: 'none',
      borderRadius: 0,
      padding: '14px 16px',
      color: colors.warningText,
      fontWeight: 500,
      fontSize: 13.5,
      lineHeight: 1.5,
      marginTop: 14,
    },
    rankResult: {
      background: '#eef3fc',
      padding: '12px 14px',
      textAlign: 'center',
      color: colors.primary,
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 20,
      fontVariantNumeric: 'tabular-nums',
    },
    examTabRow: {
      display: 'flex',
      gap: 20,
      flexWrap: 'wrap',
    },
    examTab: {
      ...tabBase,
    },
    examTabActiveVize: {
      ...tabActive,
    },
    examTabActiveFinal: {
      ...tabActive,
    },
    examTabActiveYazOkulu: {
      ...tabActive,
    },
    examDesc: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 20,
      textAlign: 'center',
      lineHeight: 1.45,
    },
    
    // Skool Tanıtım Modülleri
    heroBanner: {
      background: '#eef3fc',
      color: colors.primary,
      padding: '10px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
      boxSizing: 'border-box',
      width: '100%',
      cursor: 'pointer',
    },
    heroText: {
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.4,
      color: colors.primary,
      flexGrow: 1,
    },
    heroClose: {
      background: 'none',
      border: 'none',
      color: colors.textFaint,
      fontSize: 18,
      cursor: 'pointer',
      lineHeight: 1,
      padding: '2px 4px',
      zIndex: 10,
    },
    
    promoCard: {
      background: colors.primary,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      marginBottom: 12,
      width: '100%',
    },
    promoCardAccent: {
      height: 0,
      background: 'transparent',
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
      background: 'rgba(255,255,255,0.12)',
      width: 44,
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    promoCardIcon: {
      width: 24,
      height: 24,
      color: '#ffffff',
    },
    promoCardContent: {
      flexGrow: 1,
    },
    promoCardTitle: {
      margin: '0 0 3px 0',
      fontSize: 16,
      fontWeight: 800,
      color: '#ffffff',
    },
    promoCardText: {
      margin: 0,
      fontSize: 13,
      color: '#c9d8f5',
      lineHeight: 1.45,
    },
    
    stickyBottom: {
      fontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: colors.cardBg,
      borderTop: `1px solid ${colors.cardBorder}`,
      boxShadow: colors.elev,
      padding: '10px 14px',
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
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.3,
      color: colors.textMain,
      textAlign: 'left',
      flexGrow: 1,
    },
    stickyClose: {
      background: 'none',
      border: 'none',
      color: colors.textFaint,
      fontSize: 16,
      cursor: 'pointer',
      padding: '2px 4px',
      zIndex: 10,
    },
    // ── Sade ızgara: ana sayfa
    wide: {
      width: '100%',
      maxWidth: 1040,
      paddingBottom: 16,
    },
    topBar: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      padding: '4px 0 16px',
      marginBottom: 16,
      borderBottom: `1px solid ${colors.cardBorder}`,
    },
    brandLogo: {
      fontWeight: 800,
      fontSize: 20,
      letterSpacing: '-0.02em',
      color: colors.textMain,
    },
    topLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'none',
      border: 'none',
      padding: '8px 0',
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: 500,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    homeTitle: {
      fontSize: 'clamp(34px, 6vw, 60px)',
      lineHeight: 1,
      letterSpacing: '-0.035em',
      fontWeight: 800,
      margin: '28px 0 28px',
      color: colors.textMain,
      overflowWrap: 'anywhere',
    },
    label: {
      fontFamily: NARROW,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginBottom: 10,
    },
    joke: {
      fontSize: 14,
      lineHeight: 1.45,
      color: colors.textMuted,
      marginBottom: 8,
    },
    mutedText: {
      fontSize: 14,
      color: colors.textMuted,
      padding: '4px 0',
    },
    resBtn: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      padding: '12px 4px 12px 0',
      background: 'transparent',
      border: 'none',
      borderBottom: `1px solid ${colors.cardBorder}`,
      textAlign: 'left',
      cursor: 'pointer',
      color: colors.textMain,
    },
    resTitle: {
      display: 'block',
      fontSize: 16,
      fontWeight: 700,
    },
    resSub: {
      display: 'block',
      fontSize: 13.5,
      color: colors.textMuted,
      marginTop: 2,
    },
    blueTitle: {
      fontSize: 20,
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      marginBottom: 6,
    },
    blueText: {
      fontSize: 14,
      lineHeight: 1.5,
      color: '#c9d8f5',
      marginBottom: 14,
    },
    blueLink: {
      fontWeight: 700,
      fontSize: 15,
    },
    pratikHead: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
      borderBottom: `2px solid ${colors.textMain}`,
      paddingBottom: 8,
    },
    h2: {
      margin: 0,
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: colors.textMain,
    },
    courseCode: {
      fontFamily: NARROW,
      fontWeight: 700,
      fontSize: 13,
      color: colors.primary,
      width: 26,
      flexShrink: 0,
    },
    courseName: {
      fontWeight: 500,
      fontSize: 15,
      lineHeight: 1.3,
      minWidth: 0,
    },
    // ── Sade ızgara: soru ekranı
    pline: {
      height: 3,
      background: colors.cardBorder,
      flexShrink: 0,
    },
    plineFill: {
      height: '100%',
      background: colors.primary,
      transition: 'width 0.3s',
    },
    optTag: {
      marginLeft: 'auto',
      paddingLeft: 8,
      fontFamily: NARROW,
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#157a3c',
      textDecoration: 'none',
      flexShrink: 0,
    },
    headIcon: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    rankBadge2: {
      width: 24,
      height: 24,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: NARROW,
      fontWeight: 700,
      fontSize: 13,
      background: '#f4f6f9',
      border: `1px solid ${colors.line}`,
      color: colors.textMain,
    },
    rankBadgeFirst: {
      background: colors.primary,
      border: `1px solid ${colors.primary}`,
      color: '#ffffff',
    },
    resIcon: {
      width: 36,
      height: 36,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#eef3fc',
      color: colors.primary,
    },
  };
};

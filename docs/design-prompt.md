# Claude Design Prompt — Jukebox

## ✅ HAZIR TASARIMLAR (2026-07-11) — frontend yazarken buradan import et

Tasarımlar Claude Design'da oluşturuldu. İmplementasyona geçildiğinde
**claude_design MCP** ile import edilecek (https://api.anthropic.com/v1/design/mcp,
auth: `/design-login`):

- **Admin paneli:** https://claude.ai/design/p/7ab42981-daad-4e68-947c-0da457f5cb3b?file=Jukebox+Admin.dc.html
  → dosya: `Jukebox Admin.dc.html`
- **Müşteri oylama:** https://claude.ai/design/p/7ab42981-daad-4e68-947c-0da457f5cb3b?file=Jukebox+Oylama.dc.html
  → dosya: `Jukebox Oylama.dc.html`

Henüz implemente EDİLMEDİ — frontend feature'ları yazılırken kullanılacak.

---

> Bu prompt, Claude'a (claude.ai / Claude Design) UI tasarımı yaptırmak için hazırlandı.
> Aşağıdaki bloğu olduğu gibi yapıştır. Gerekirse tek seferde tek arayüz iste
> (önce müşteri, sonra admin) — daha odaklı sonuç verir.

---

## PROMPT

Bir web uygulaması için UI tasarımı istiyorum. Proje adı: **Jukebox**.

**Ürün:** Kafelerde arka plan müziğinin seçimine müşterileri dahil eden sistem.
Mekan sahibi bir YouTube şarkı havuzu tanımlar; her 10 dakikada bir "sıradaki şarkı
hangisi olsun?" oylaması açılır. Müşteriler masadaki QR kodu okutup telefonlarından
oy verir; kazanan şarkı mekandaki hoparlörlerde çalar. Müşteri için kayıt/giriş YOK —
QR okut, oyla, bitti.

**Marka hissi:** Kafe sıcaklığı + müzik enerjisi. Samimi, oyunbaz ama kaliteli;
"neon gece kulübü" DEĞİL, "üçüncü nesil kahveci" havası. Ana renk sıcak altın/amber
(oklch(60% 0.10 79) civarı), açık ve koyu tema ikisi de olacak. Font: Outfit.
Dil: Türkçe.

**Teknik çerçeve (tasarımı buna göre düşün):** Next.js + HeroUI v3 bileşen kütüphanesi
(Card, Button, Chip, ProgressBar, Tabs, Modal, Input, Avatar, Skeleton, Toast) +
Tailwind CSS v4. Tasarım bu bileşenlerle uygulanabilir olmalı; egzotik custom
bileşenlerden kaçın.

İki ayrı arayüz tasarla:

### 1) Müşteri oylama sayfası — MOBILE-FIRST (telefonda QR ile açılıyor)

Ekranlar/durumlar:
- **Aktif oylama:** Üstte "şimdi çalıyor" mini bar (kapak + şarkı adı, ilerleme).
  Ortada 5 aday şarkı kartı (YouTube kapağı, şarkı adı, kanal adı, canlı oy sayısı).
  Tur bitimine geri sayım. Tek dokunuşla oy verme.
- **Oy verildi:** Seçilen kart "oyun alındı" durumuna geçer (kilitli, vurgulu);
  diğer kartların canlı oy sayıları güncellenmeye devam eder. Cihaz başına 1 oy —
  değiştirme yok.
- **Tur arası / sonuç:** "Kazanan: X — birazdan çalacak" anı + yeni tur geri sayımı.
- **Boş/hata durumu:** Mekan şu an yayında değil ekranı.
- Sayfanın tamamı tek elle, başparmakla kullanılabilir olmalı. Scroll minimum.

### 2) Mekan sahibi (admin) paneli — DESKTOP öncelikli, responsive

Ekranlar:
- **Giriş:** email + şifre (kayıt ekranı da).
- **Genel bakış:** Şu an çalan şarkı, aktif turun canlı oy durumu, sıradaki (kuyruk),
  bugünkü katılım özeti.
- **Şarkı havuzu:** YouTube linki yapıştırarak şarkı ekleme (link alanı + ekle butonu,
  eklenince kapak/başlık otomatik gelir), şarkı listesi (kapak, ad, kanal, eklenme
  tarihi, silme). Arama/filtre.
- **Ayarlar:** Tur aralığı (dk), tur başına aday sayısı, "son çalınan kaç şarkı tekrar
  aday olamaz" — açıklamalı form alanları.
- **QR:** Mekanın QR kodunu görüntüleme + yazdırılabilir PDF/PNG indirme.

Her iki arayüz için: bileşen durumlarını (hover, disabled, loading/skeleton, empty
state) ve açık/koyu temayı göster. Müşteri sayfasında canlı güncellenen değerlerin
(oy sayıları, geri sayım) nasıl hareket edeceğine dair kısa animasyon notları düş.

---

## Not (bizim için)

- Player sayfası (mekan ekranında çalan tam ekran görünüm) bu prompt'a bilerek
  dahil edilmedi — MVP'de minimal olacak, tasarımı sonra ayrıca istenebilir.
- Tasarım çıktısı geldiğinde beğenilen kararlar `frontend/` tema değişkenlerine
  (globals.css) ve feature bileşenlerine birlikte aktarılacak.

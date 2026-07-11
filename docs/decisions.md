# Karar Günlüğü

Format: her karar tarihli, kısa ve "neden"iyle birlikte. Yeni karar en üste eklenir.
Bir karar değişirse silinmez; üstüne "İPTAL/REVİZE (tarih)" notu düşülür.

---

## 2026-07-11 — Geliştirme sırası: önce frontend (mock API'lerle), sonra backend

**Karar:** Uygulama önce frontend tarafında baştan sona tamamlanacak. Kullanılacak
tüm endpoint'ler bu aşamada tanımlanır (path, request/response şekli) ama arkasında
gerçek implementasyon yerine mock veri döner. Backend, bu sözleşme netleştikten sonra
mock'ları gerçek implementasyona çevirerek yazılır.

**Neden:** Kullanıcı tercihi. UI/UX'i önce oturtup API sözleşmesini ona göre şekillendirmek;
backend'i baştan tasarlayıp frontend'i ona zorlamak yerine.

## 2026-07-11 — Açık konular turu (2. oturum)

**Aday seçimi:** Her turda playlist'ten rastgele N aday (varsayılan 5, mekan ayarı);
son çalınanlar (varsayılan son 20 şarkı, ayarlanabilir) hariç tutulur.
*Neden:* Telefonda temiz ekran, oylar dağılmaz, çeşitlilik kendiliğinden gelir.

**Beraberlik:** Eşit oy alanlar arasından rastgele seçilir.
**Oysuz tur:** Kazanan yok; kuyruğa bir şey girmez, fallback devreye girer.

**Skip/veto:** MVP'de YOK, v2'ye bırakıldı. *Neden:* Playlist'i zaten sahip kuruyor;
kapsamı dar tutmak öncelikli.

**Mekan sahibi auth:** Email + şifre (kendi implementasyonumuz, JWT/session).
*Neden:* Dış bağımlılık yok; portfolyoda auth'u kendimiz yazdığımızı gösterir.
Google OAuth v2 adayı.

**Deploy:** Frontend Vercel, backend (Go + Mongo) VPS. *Neden:* Next.js Vercel'de
bedava + CDN; Go tek binary VPS'te basit. *Sonuç:* Cross-domain CORS/cookie yönetimi
gerekir — aynı kök domain kullanılacak (örn. `app.X.com` + `api.X.com`), cihaz çerezi
`Domain=.X.com` ile yazılacak.

**Şarkı metadata:** Link yapıştır + YouTube oEmbed (API key'siz, kotasız). Süre bilgisi
gelmez ama gerekmiyor — şarkı bitişini IFrame olayı bildiriyor. Panelden arama özelliği
v2'de Data API ile eklenebilir.

**Kuyruk:** Ayrı `queue` koleksiyonu (gömülü dizi değil). *Neden:* `playedAt` ile
çalınanlar geçmişi bedavaya çıkar, eşzamanlı güncellemeler basit.

**Playlist:** Mekan başına tek şarkı havuzu. Çoklu playlist (sabah/akşam) v2 adayı.

**Tur geçmişi:** Silinmez, TTL yok — istatistik ekranları için ham veri.

## 2026-07-11 — Oy erişim kontrolü: statik QR + cihaz başına 1 oy/tur

**Karar:** Basılı, değişmeyen QR. Müşteri QR'ı okutunca tarayıcısına anonim bir
cihaz çerezi (device token) yazılır; her cihaz her turda 1 oy verebilir.

**Neden:** Login/kayıt ekranı kafe müşterisi için sürtünme yaratır, kullanımı öldürür.
Statik QR ekran gerektirmez, maliyetsiz. Gizli sekme ile kısmen aşılabilir ama kafe
ölçeğinde yeterli koruma.

**Gelecek:** Dönen QR (ekranda gösterilen, süreli token'lı) mekanizması tasarlandı ve
anlaşıldı; isteyen mekan için opsiyonel mod olarak v2'de eklenebilir. Lazy token üretimi
+ grace period yaklaşımı kullanılacak.

## 2026-07-11 — Oylama modeli: sabit aralıklı turlar

**Karar:** Oylama sabit aralıklarla açılır (varsayılan 10 dk, mekan başına ayarlanabilir
olacak). Tur kapanınca kazanan şarkı çalma kuyruğuna eklenir.

**Neden:** Kullanıcı tercihi; anlaşılması ve anlatılması basit model.

**Bilinen sonuç / ele alınacak:** Tur süresi şarkı süresiyle senkron değil. Kuyruk boşsa
player mekan playlistinden rastgele şarkı çalar (fallback). Detaylar architecture.md'de.

## 2026-07-11 — Realtime: WebSocket

**Karar:** Canlı oy sayıları, tur açılış/kapanışı ve player komutları tek WebSocket
bağlantısı üzerinden taşınır. Go tarafında hub pattern.

**Neden:** Çift yönlü ihtiyaç var (müşteri oy gönderir + canlı sonuç alır; player komut
alır + durum bildirir). SSE ve polling'e göre tek bağlantıyla her şey çözülür.

## 2026-07-11 — Player istemcisi: önce IFrame'li web sayfası, extension v2'de

**Karar:** Mekan bilgisayarında bizim "Player" sayfamız açık durur; YouTube IFrame API
ile çalar. Chrome extension (mekanın kendi youtube.com sekmesini kontrol eden) v2'de
ikinci bir player istemcisi olarak eklenebilir.

**Neden:** IFrame sayfası kurulum gerektirmez, her tarayıcıda çalışır, portfolyo demosu
linkle yapılır. Extension dağıtım + YouTube DOM kırılganlığı yükü taşır. Backend
protokolü istemciden bağımsız tasarlanacak ("play track X" komutunu kim dinlerse
dinlesin), bu yüzden karar bizi kilitlemiyor.

**Not:** Mekanın tarayıcısı YouTube Premium hesabıyla login ise gömülü oynatıcı da
reklamsız çalar; üçüncü taraf çerezlerine izin verilmesi gerekir (kurulum talimatına
yazılacak). `youtube-nocookie.com` KULLANILMAYACAK (oturumu bilerek tanımaz).

## 2026-07-11 — Müzik kaynağı: şimdilik sadece YouTube

**Karar:** MVP'de tek kaynak YouTube. Spotify vb. düşünülmüyor (şimdilik).

**Neden:** Ücretsiz, hesap zorunluluğu yok, katalog geniş. Kullanıcı tercihi.

## 2026-07-11 — Veritabanı: MongoDB

**Karar:** MongoDB kullanılacak.

**Neden:** Kullanıcı tercihi (önceden verilmiş karar). Doküman modeli tur+oy gömme ve
`$inc` ile atomik oy sayacı artırma senaryolarına iyi oturuyor.

## 2026-07-11 — Temel yapı (önceki oturum)

Monorepo (`backend/` + `frontend/`), Go backend Standard Go Layout, Next.js frontend
feature-based (colocation), HeroUI v3 + Tailwind v4.

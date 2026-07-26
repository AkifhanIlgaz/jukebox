# Karar Günlüğü

Format: her karar tarihli, kısa ve "neden"iyle birlikte. Yeni karar en üste eklenir.
Bir karar değişirse silinmez; üstüne "İPTAL/REVİZE (tarih)" notu düşülür.

---

## 2026-07-26 — Uygulama adı: TINI, logo: audiowave

**Karar:** Uygulamanın adı **TINI** olarak belirlendi. Logo audiowave (ses dalgası)
motifi kullanacak.

**Neden:** Kullanıcı tercihi.

**Sonuç:** "Jukebox" ismi proje adı olarak geçtiği yerlerde (CLAUDE.md başlığı, README,
frontend sayfa title/başlık) TINI ile değiştirildi. Repo klasör adı (`jukebox/`) ve kod
içindeki `jukebox` geçen tanımlayıcılar (paket/servis adları vb.) bu kararın kapsamı
dışında — ayrı bir rename gerekirse sonra ele alınır. Logo asseti (audiowave)
tasarım/implementasyon aşaması henüz yapılmadı.

## 2026-07-26 — "Son çalınan" filtresi: Redis sayı bazlı listeden Mongo süre bazlı cooldown'a

**Karar:** Queue fallback seçimindeki (ve round'un aday seçimindeki) "son çalınanları
hariç tut" filtresi artık Redis'teki sayı bazlı `venue:{venueId}:recent` listesi
(`LPUSH`/`LTRIM`, son N şarkı) ile değil, `tracks` (playlist) dokümanındaki
`last_played_at` alanına bakan **süre bazlı cooldown** ile çalışır (`venue.settings.
recentlyPlayedCooldownMin`, dakika). Redis `recent` key'i ve `QueueService.
MarkPlayed`/`IsRecentlyPlayed` kalktı; `MarkPlayed` ve rastgele şarkı seçimi artık
`TrackService`'te (Mongo `$set: last_played_at` / `$or: [{last_played_at: nil},
{last_played_at: {$lt: cutoff}}]`).

**Neden:** Kullanıcı tercihi + database.md'de zaten tanımlı olan (ama koda hiç
girmemiş) `tracks.lastPlayedAt` alanıyla tutarlılık. Ayrıca sayı bazlı pencere
playlist küçükken (`RandomTrack`'in `$nin` sorgusu tüm playlist'i hariç tutabiliyor)
gerçek bir bug'a yol açtı (bkz. aşağıdaki alt karar) — süre bazlı cooldown +
gevşetme fallback'i bunu yapısal olarak çözüyor.

**Alt karar — gevşetme her zaman geçerli:** `RandomTrack`, cooldown filtresi hiç
sonuç vermezse (ör. küçük playlist'te tüm şarkılar cooldown'da) playlist boş
olmadığı sürece ASLA boş dönmemeli; bu durumda cooldown'u yok sayıp `last_played_at`
ascending (null'lar önce) sıralı en eski çalınan/hiç çalınmamış şarkıyı fallback
olarak döner. Bu, 2026-07-12'deki "aday seçiminde gevşetme" kuralının queue'nun
tekil fallback seçimine de genelleştirilmiş hali — daha önce sadece round'un 5
adaylık seçimi için yazılmıştı, tekil seçimde uygulanmadığı için playlist küçükken
(5 şarkı, hepsi son-N'de) hiç şarkı dönmeme bug'ı yaşandı.

**Sonuç:** `venue.settings.recentlyPlayedWindow` (sayı) →
`recentlyPlayedCooldownMin` (dakika) olarak yeniden adlandırıldı/anlamı değişti
(bkz. database.md). `PlaylistTrack.LastPlayedAt *time.Time` alanı eklendi
(database.md'deki taslakla uyumlu).

## 2026-07-26 — WebSocket ertelendi: round da queue gibi önce REST ile yazılacak

**Karar:** WS hub'ı (ve architecture.md'deki `PLAY_TRACK`/`TRACK_ENDED`/`VOTE_UPDATE`
gibi mesajlar) şimdilik ertelendi. Round (oylama turu) akışı da queue gibi önce REST
endpoint'leriyle yazılacak; canlı oy sayısı/tur olayları client'a WS yerine polling
ile gidecek. WS'e geçiş ileride ayrı bir iterasyonda yapılacak.

**Neden:** Kullanıcı tercihi. Hub'ın tasarımı netleşmeden (auth stratejisi, round
scheduler ile ilişkisi, mevcut REST-polling'in tamamen mi yoksa kısmen mi WS'e
taşınacağı gibi açık noktalar) somut koda geçmek riskli görüldü; queue REST ile
zaten çalışıyor, round da aynı yolu izleyip iş mantığı önce netleşecek.

**Sonuç:** `middleware.Auth` no-op kaldığı sürece (2026-07-24 notu) WS auth konusu da
zaten açığa çıkmıyor. WS hub'ı kurulacağı zaman round scheduler'la birlikte
tasarlanacak (round kapanışı da WS'ten gidecek mesajlardan biri).

## 2026-07-25 — Canlı oy sayacı ve kuyruk: Redis (Mongo değil)

**Karar:** Tur içi oy sayaçları Redis **sorted set**'te tutulur (`round:{roundId}:votes`,
member=trackId, score=oy sayısı; `ZINCRBY` ile atomik artır, `ZREVRANGE` ile sıralı
okuma). Çalma kuyruğu Mongo `queue` koleksiyonu yerine Redis **list**'te tutulur
(`venue:{venueId}:queue`, `RPUSH` ile ekle, `LPOP` ile sıradakini al). Redis, backend
ile aynı VPS'te çalışır; **AOF persistence açık** (restart'ta veri kaybını önlemek için).

Tur kapanınca (`ROUND_ENDED`) Redis'teki final skorlar `rounds.candidates[].votes`
alanına yazılıp sorted set silinir — round geçmişi ve istatistikler için kalıcı kayıt
Mongo'da kalır. "Cihaz turda 1 oy" kuralı hâlâ Mongo `votes` koleksiyonundaki
`{ roundId, deviceId }` unique index ile garanti edilir (bu, dedupe/audit amaçlı,
düşük hacimli — Redis'e taşınmadı).

**Neden:** Kullanıcı tercihi. Canlı oy sıralaması ve kuyruktan çekme sık ve düşük
gecikmeli işlemler; Redis'in atomik `ZINCRBY`/`RPUSH`/`LPOP`'u Mongo'nun `$inc` +
sort'undan daha doğal bir fit. RabbitMQ (kuyruk için) değerlendirilip elendi: mekan
başına tek üretici/tek tüketicili basit sıralı liste, message broker'ın çözdüğü hiçbir
problem (çoklu worker, retry, dead-letter) yok — gereksiz ops yükü.

**Sonuçlar:**
- `queue` koleksiyonu KALKAR (bkz. database.md revizyonu). `playedAt` ile gelen
  "çalınanlar geçmişi" bonusu da kalkıyor; "son N çalınan" filtresi zaten
  `tracks.lastPlayedAt` alanına bakıyor, bundan etkilenmiyor.
- Redis restart'ında (AOF'a rağmen bir pencerede) aktif tur oyları veya kuyruk
  kaybolabilir — kafe ölçeğinde kabul edilebilir risk (en kötü ihtimalle bir sonraki
  fallback şarkı çalar / tur sıfırdan başlar).
- Deploy: Redis backend ile aynı VPS'te (docker-compose/systemd), Mongo'nun yanında.

## 2026-07-24 — Mekan sahibi auth: JWT (httpOnly cookie), süresiz token, sadece login/logout

**Karar:** Mekan sahibi girişi username+şifre (email değil) ile yapılır; `owners`
yerine `users` koleksiyonu kullanılır (`username`, `password_hash`, `venue_id`).
Oturum stateless JWT ile tutulur, httpOnly `auth_token` çerezinde taşınır (session
store yok). Token'da süre sınırı YOK — oturum yalnızca logout ile (çerez silinip
JWT geçersiz kılınarak) sona erer. Bu iterasyonda sadece login/logout + route koruma
middleware'i kapsamda; register yok (hesaplar elle DB'ye açılır, bir mekanın sahibi
ileride yeni admin ekleyebilecek — o akış v2/sonraki iterasyon).

**Neden:** Session store için ekstra Mongo koleksiyonu/altyapı gerekmesin (kullanıcı
tercihi). Süresiz token: kullanıcı deneyiminde sürekli yeniden giriş istemiyor;
risk kabul edildi (MVP, brute-force koruması zaten v2'ye ertelenmiş durumda).

**Not:** Route koruma middleware'i (`middleware.Auth`) development sırasında no-op
bırakıldı — gerçek JWT doğrulama kodu yorum satırı olarak dosyada duruyor, userId/
venueId şimdilik elle hardcode edilecek. Gerçek middleware ileride aktif edilecek.

## 2026-07-13 — Backend router: Fiber v3

**Karar:** Go tarafında router/framework olarak Fiber v3 kullanılır.
**Neden:** Kullanıcı tercihi; hazır middleware ekosistemi (cors vb.) ve ergonomi.

## 2026-07-13 — Mock API'ler: Go stub server

**Karar:** Frontend fazındaki mock endpoint'ler, `backend/` içinde gerçek bir Go
server olarak yaşar; tüm handler'lar sabit/mock veri döner. Frontend geliştirirken
bu stub ayakta tutulur (`NEXT_PUBLIC_API_URL` ona işaret eder).

**Neden:** En gerçekçi seçenek — CORS, `withCredentials` ve httpOnly cihaz çerezi
(`Set-Cookie`) akışları baştan gerçek koşullarda test edilir. Backend fazında stub
handler'lar yerinde gerçek implementasyona çevrilir; router/sözleşme iskeleti hazır
olur. (Alternatifler — Next.js route handler, MSW — çerez simülasyonu ve sözleşme
kalıcılığı açısından elendi.)

## 2026-07-12 — Minimum playlist boyutu: 20 şarkı

**Karar:** Sistem (şarkı çalma + tur açma) ancak playlist'te en az 20 şarkı varken
çalışır. Altındaysa player bekleme durumunda kalır, panel "en az 20 şarkı ekle"
uyarısı gösterir, müşteri sayfası bekleme ekranı gösterir. Değer global sabittir
(mekan ayarı değil); saha geri bildirimiyle güncellenecek.

**Neden:** Çok küçük havuz aynı şarkıların sürekli dönmesine ve anlamsız oylamalara
yol açar; net bir eşik kurulum beklentisini de netleştirir.

**Alt kural (mekanik):** Aday seçiminde "son N çalınan hariç" filtresi uygun şarkı
sayısını aday sayısının altına düşürürse, filtre en eski çalınandan başlayarak
gevşetilir — tur her zaman tam aday sayısıyla açılır. (Varsayılanlarla — 20 şarkı,
son 20 hariç — bu durum kaçınılmaz olarak oluşur.)

## 2026-07-12 — Kayıt modeli: 1 hesap = 1 mekan, otomatik slug, mail yok

**Karar:**
- Kayıt tek adım: email + şifre + mekan adı → hesap ve mekan birlikte oluşur.
  MVP'de hesap↔mekan ilişkisi 1:1; çoklu mekan (zincir) v2 adayı.
- Oylama adresi slug'ı mekan adından otomatik türetilir (ör. "Kahve Durağı" →
  `kahve-duragi`); çakışmada sonek eklenir. Kullanıcı slug seçmez.
- Email doğrulama MVP'de YOK; hesap kayıt anında aktiftir.

**Neden:** Kayıt sürtünmesini ve kapsamı en aza indirmek. Mail altyapısı (SMTP)
MVP'ye taşımaya değmez.

**Sonuç:** Mail gönderilemediği için "şifremi unuttum" akışı da MVP'de yok; v2'de
mail altyapısıyla birlikte gelir.

## 2026-07-12 — Oy modeli: değiştirilebilir oy, sınırlama yok

**Karar:** "Cihaz başına turda 1 oy" = 1 *aktif* oy. Ziyaretçi tur kapanana kadar
oyunu başka adaya taşıyabilir (eski adayın sayacı azalır, yeninin artar). Değiştirme
sıklığına MVP'de sınırlama (cooldown/limit) KONULMAZ.

**Neden:** Değiştirme kullanıcı dostu (yanlış dokunmayı da telafi eder). Sürekli
değiştirme sonucu manipüle edemez (net oy hep 1); zararı yalnızca sayaç titreşimi +
WS yayın yükü, kafe ölçeğinde ihmal edilebilir. Sorun görülürse v2'de cooldown eklenir.

## 2026-07-12 — REVİZE: Yeni tur, sıradaki şarkı çalmaya başlayınca açılır

**Karar:** Turlar kesintisiz zincir değil. Tur süresi sabittir (varsayılan 10 dk, mekan
ayarı); tur kapanınca kazanan kuyruğa girer ama yeni tur hemen açılmaz. Yeni tur,
sıradaki şarkı (kazanan; oysuz turda fallback) player'da **çalmaya başladığında** açılır.
Tur kapanışı ile sıradaki şarkının başlaması arasında oylama olmaz (ara durumu).

**Neden:** Kullanıcı kararı. Müşteri oyladığı şarkı başlamadan yeni adaylarla
karşılaşmaz; oylama ile çalan müzik arasındaki bağ korunur.

**Sonuçlar:**
- "Aktif tur yok" ekranı normal ve tekrar eden bir durumdur (tur kapanışı → sıradaki
  şarkı başlayana kadar). Müşteri sayfası bu durumu açıkça gösterir.
- Player kapalıysa (mekan bilgisayarı açık değilse) hiç tur açılmaz — müzik yokken
  oylama da yoktur. QR okutan müşteri "şu an müzik çalmıyor" benzeri bekleme ekranı
  görür. (Kullanıcı onayladı, 2026-07-12.)
- Tur süresi (10 dk) şarkılardan uzun olduğu için bir tur boyunca birden fazla şarkı
  çalabilir; tur ortasında biten şarkının yerine kuyruk/fallback devam eder, yeni tur
  ancak kapanmış turdan sonraki ilk şarkı başlangıcında açılır.
- 2026-07-11 "sabit aralıklı turlar" kararı revize edildi: 10 dk artık "turlar arası
  aralık" değil, turun (oylamanın) süresidir.

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

> **REVİZE (2026-07-12):** Turlar artık kesintisiz sabit aralıklı zincir değil; yeni
> tur sıradaki şarkı çalmaya başlayınca açılıyor. Bkz. üstteki 2026-07-12 kararı.

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

## 2026-07-21 — Frontend dosya adlandırma: bileşen dosyaları PascalCase

**Karar:** React bileşen dosyaları PascalCase (`LoginForm.tsx`), export edilen bileşen
adıyla birebir aynı. Next.js'in kendi zorunlu dosyaları (`page.tsx`, `layout.tsx`,
`providers.tsx` vb.) bu kuralın dışında, framework konvansiyonuna uyar.

**Neden:** Kullanıcı tercihi; dosya adı ile export adı arasında fark olmasın istendi.

## 2026-07-11 — Temel yapı (önceki oturum)

Monorepo (`backend/` + `frontend/`), Go backend Standard Go Layout, Next.js frontend
feature-based (colocation), HeroUI v3 + Tailwind v4.

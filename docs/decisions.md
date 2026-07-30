# Karar Günlüğü

Format: her karar tarihli, kısa ve "neden"iyle birlikte. Yeni karar en üste eklenir.
Bir karar değişirse silinmez; üstüne "İPTAL/REVİZE (tarih)" notu düşülür.

---

## 2026-07-28 — Playlist importu: YouTube Data API (sınırlı kapsam), belirsiz linkte client-side seçim

**Karar:** Şarkı ekleme modalına, girilen link bir playlist'in parçasıysa (ör.
`?v=...&list=...`) "Bu şarkının dahil olduğu playlistteki tüm şarkıları ekle" checkbox'ı
eklendi; kullanıcı yazarken client-side (frontend) URL'i parse edip video/playlist
id'lerini anında çıkarır, backend'e gitmeden checkbox'ı animasyonla gösterir/gizler.
Sadece playlist linki (video id yok) girilirse checkbox'a gerek yok, tüm liste zaten
eklenir.

`POST /tracks` sözleşmesi `{ youtubeUrl, mode?: "video" | "playlist" }` oldu. `mode`
yalnızca link her iki id'yi birden içerdiğinde anlamlıdır; backend yine de linki kendi
tarafında parse eder ve `mode` eksikken (ör. doğrudan API çağrısı) `422` benzeri bir
hata döner — client-side seçim asıl UX'tir, backend validasyonu savunma amaçlıdır.

**API key kapsamı:** Tekli şarkı eklemede metadata hâlâ oEmbed'den geliyor (key
gerektirmez, CLAUDE.md'deki "API key yok" kuralı bu akış için geçerliliğini koruyor).
Playlist importu YouTube Data API v3 (`playlistItems.list`) kullanıyor — bu, key
gerektiren tek akış. Key `YOUTUBE_API_KEY` env değişkeninden okunuyor
(`backend/.env`, gitignore'da). Tek importta en fazla 500 şarkı çekiliyor (quota ve
playlist şişkinliğini sınırlamak için); silinmiş/gizli videolar atlanıyor. Playlist'te
zaten var olan şarkılar importu durdurmaz, sadece atlanır (`skipped` sayacı).

**Neden:** Kullanıcı tercihi. Backend'in URL'i her durumda kendi tarafında da
doğrulaması ("backend belirlesin" sorusuna yanıt) korunuyor, ama gerçek karar anı
kullanıcıya link'i yapıştırdığı anda gösteriliyor — ayrı bir "tek şarkı/playlist" moduna
önceden karar vermek zorunda kalmıyor.

## 2026-07-28 — Refresh token: rotation kaldırıldı, 30 saat sliding window'a geçildi (REVİZE)

**Karar (REVİZE EDİLDİ):** `RefreshStore.Rotate` kaldırıldı, yerine `RefreshStore.Refresh`
geldi. Artık refresh token her kullanımda yeni bir token'la değiştirilmiyor (rotate
edilmiyor) — aynı plaintext token (ve cookie) sürdürülüyor, sadece kalan süresi
`RefreshExtendThreshold`'un (TTL/2) altına düştüyse `expires_at` sliding window ile
yeniden `RefreshTokenTTL`'e ötelenir. `RefreshTokenTTL` 365 günden **30 saate** indirildi.

**Neden:** Eski rotation modelinde `Rotate` atomik değildi (find→delete→insert ayrı
adımlardı); admin panel access token süresi (15 dk) dolunca birden fazla isteği
paralel attığında, aynı refresh cookie'siyle gelen eşzamanlı istekler birbirini
yarıştırıyordu — bazıları "kaybedip" gereksiz yere 401 "oturum geçersiz" alıyordu
(prod'da gözlemlendi, Mongo'daki `refresh_tokens` koleksiyonunda milisaniyeler içinde
aynı eski token'dan türeyen çoklu kayıt kümeleriyle doğrulandı). Rotation'ın asıl amacı
olan "çalınmış token reuse detection" bilinçli olarak feda edildi — bu panel sadece
boss/admin girişi için (müşteri tarafında zaten login yok), risk yüzeyi düşük.

30 saatlik TTL, kafelerin günlük açılış döngüsünü (örn. her gün ~10:00, birkaç saatlik
sapmayla) login istemeden kapsayacak, ama bir gün hiç kullanılmazsa (~48 saatlik boşluk)
oturumun düşmesini sağlayacak şekilde seçildi. Sliding ötelemenin DB'ye her 15 dakikada
bir değil günde ~1 kez yazması için eşik (TTL/2) kondu.

`AuthMiddleware`'in artık kullanılmayan `cookieDomain` alanı ve `NewAuthMiddleware`
parametresi kaldırıldı (refresh cookie'si artık middleware'de yeniden yazılmıyor,
sadece login'de `AuthHandler` yazıyor).

## 2026-07-28 — Player artık WS'e bağlanmıyor: track raporlaması REST, sadece customer WS tek yönlü

**Karar:** Aynı gün içindeki önceki "WS hub track yaşam döngüsü" kararı revize edildi.
Player YouTube IFrame API zaten event-based çalıştığından (`onStateChange`/`onError`),
bunun için kalıcı bir WS bağlantısı tutmaya gerek yok — player tamamen REST'te kalıyor:
- `POST /venue/now-playing` (`{youtubeId}`): player bir track'i fiilen çalmaya
  başladığında (ilk açılış, hata sonrası fallback, ya da player'ın kendi isteğiyle
  REST `/queue/next`'ten aldığı sıradaki track — hepsi için) çağırır.
  `VenueService.SetNowPlaying` çalışır, ardından `hub.BroadcastToVenue(venueId,
  ws.NowPlaying, ws.NowPlayingPayload{...})` ile o venue'nin müşteri WS
  bağlantılarına yayınlanır.
- Hata durumunda (`onError`) player, "ended" ile **aynı şekilde** doğrudan REST
  `/queue/next`'i çağırır — ayrı bir server-seçimli fallback akışı (eski
  `TRACK_ERROR` → `PLAY_TRACK`) yok; `QueueService.Next` zaten aynı seçim mantığını
  çalıştırıyor, kim çağırdığı önemli değil.
- `internal/ws` paketi artık **tek yönlü**: sadece `/ws/venue/:slug` (müşteri)
  bağlantısı var, `/ws/player` kaldırıldı. `Hub` hiçbir servise bağımlı değil —
  sadece `BroadcastToVenue(venueID, msgType, payload)` sunan generic bir dağıtım
  noktası; business mantığı (nowPlaying güncelleme vb.) çağıran REST handler'da
  yaşıyor (`venue.VenueHandler.ReportNowPlaying`).
- Bağımlılık yönü: `venue` paketi `ws.Hub`'ı import ediyor (broadcast için); `ws`
  paketi `venue`'ye bağımlı DEĞİL — slug→venueID çözümü için kendi tanımladığı
  `ws.VenueResolver` arayüzünü kullanıyor (`VenueService.GetVenueIDBySlug` bunu
  karşılıyor). Böylece `ws <-> venue` import cycle'ı oluşmuyor.
- `TRACK_STARTED` broadcast mesajı `NOW_PLAYING`'e yeniden adlandırıldı (server ->
  customer, tek yön); `TRACK_ERROR`/`PLAY_TRACK`/`TrackStartedPayload`/
  `TrackErrorPayload`/`PlayTrackPayload` kaldırıldı. Kullanılmayan `PLAYER_STATE`
  sabiti (`message.go`) de bu revizyonla kaldırıldı.
- Frontend: `usePlayerSocket` hook'u silindi. `QueueContext` tekrar
  `venueApi.reportNowPlaying(youtubeId)` (REST) çağırıyor; `handleError` de
  `handleEnded` gibi doğrudan `advance()` (REST `/queue/next`) çağırıyor.
  Müşteri tarafı (`useNowPlayingSocket`) değişmedi, sadece dinlediği mesaj tipi
  `NOW_PLAYING` oldu.

**Neden:** Player→server yönü tek seferlik event raporlarından ibaret; bunun için
ayrı bir WS bağlantısı (auth, reconnect, lifecycle) taşımak REST'e göre ekstra
karmaşıklık katıyordu, gerçek bir kazanım getirmiyordu. WS'in asıl değeri
server→customer realtime broadcast'te; player tarafı REST'te kalınca `ws`
paketi de hem daha basit hem de tamamen servis-bağımsız (yeniden kullanılabilir)
hale geldi.

## 2026-07-28 — Mekan sahibi auth: access + refresh token (süresiz JWT kararı REVİZE)

**Karar:** Tek süresiz JWT modeli terk edildi; ikili token modeline geçildi:

- **Access token:** JWT, ömür **15 dakika**. Cookie'de TAŞINMAZ — `/login`
  response body'sinde (`{accessToken}`) döner, frontend bunu yalnızca memory'de
  (`api/client.ts` modülü içinde) tutar ve her isteğe `Authorization: Bearer
  <token>` header'ıyla ekler.
- **Refresh token:** rastgele opak string (JWT değil), `httpOnly` `refresh_token`
  çerezinde, ömür **1 yıl**. Yeni `refresh_tokens` Mongo koleksiyonunda hash'lenerek
  saklanır (`{userId, venueId, role, tokenHash, expiresAt, createdAt}`). Düz metin
  token DB'ye yazılmaz.
- **Dedike `/refresh` endpoint'i YOK.** Yenileme `middleware.Auth()` içinde
  şeffafça olur: gelen access token geçersiz/süresi dolmuşsa, middleware
  `refresh_token` çerezini (her isteğe zaten otomatik eklenir) okur, DB'de
  hash'ini arar; geçerliyse **rotate eder** (eski kayıt silinir, yeni refresh
  token kaydedilir, yeni `refresh_token` çerezi set edilir), yeni access token'ı
  `X-Access-Token` response header'ında döner ve istek normal şekilde devam eder.
  Refresh token da yoksa/geçersizse 401. Rotation, çalınan bir refresh token'ın
  süresiz kullanılabilmesini engeller.
- **Logout:** DB'deki refresh token kaydı silinir + `refresh_token`/`role`/
  `username` çerezleri temizlenir (access token zaten cookie değil, frontend
  memory'den siler). `role`/`username` çerezlerinin `MaxAge`'i artık refresh
  token ömrüyle (1 yıl) eşleşir.
- **Frontend:** axios instance'ında (`api/client.ts`) request interceptor access
  token'ı memory'den `Authorization` header'ına ekler; response interceptor HER
  response'ta (başarılı ya da hatalı) `X-Access-Token` header'ı varsa memory'yi
  günceller. Bu header CORS'ta `ExposeHeaders` ile açıkça expose edilmiş olmalı
  (aksi halde tarayıcı JS'e vermez). Gerçek 401 (refresh token da geçersiz)
  durumunda özel bir retry mantığı yok — `AuthContext`/`useCurrentUser` zaten
  `role`/`username` cookie'lerinin yokluğuna göre `/login`'e yönlendiriyor.

**Not:** Access token'ın cookie yerine memory+header ile taşınması, `httpOnly`
refresh cookie modeline göre CSRF'e karşı ekstra bir katman (access token
tarayıcı tarafından isteklere otomatik eklenmiyor, yalnızca uygulama kodu
ekliyor) — ilk taslakta access token da cookie'ydi, bu kısım implementasyon
sırasında (mevcut `frontend/api/client.ts` iskeletiyle tutarlı olsun diye)
memory+header'a çevrildi.

**İPTAL/REVİZE (2026-07-28):** 2026-07-24 kararındaki "süresiz JWT, session store
yok" kısmı geçersiz. Session store artık var (`refresh_tokens` koleksiyonu) ama
stateless olan yalnızca access token; sadece refresh token DB'de tutuluyor.

**Neden:** Kullanıcı kararı — süresiz access token'ın çalınması durumunda risk
penceresi sonsuzdu; kısa ömürlü access token + revoke edilebilir (DB'de tutulan,
rotate edilen) refresh token bu riski sınırlıyor. Refresh token'ın DB'de tutulması
("ekstra koleksiyon istemiyoruz" kısıtından vazgeçildi) revoke/oturum sonlandırma
imkanı sağlıyor; access token stateless kaldığı için her istekte DB'ye gidilmiyor.

## 2026-07-27 — Rol sistemi: Big Boss / Admin

**Karar:** `users` dokümanına `role: "boss" | "admin"` alanı eklendi. Mekan başına
**tam bir** Big Boss olacak — elle DB'ye açılır (register akışı yok, mevcut manuel
hesap açma modeliyle aynı), `{venueId, role}` üzerinde partial unique index
(`role: "boss"` filtresiyle) bunu DB seviyesinde garanti eder. Admin hesapları
Big Boss tarafından panelden açılır/silinir (`POST /users`, `DELETE /users/:id`,
username+şifre — mevcut login modeliyle aynı, register akışı yine yok). Sadece
Big Boss mekan ayarlarını değiştirebilir (`PUT /venue`, ayrıca `GET /venue` de
boss-only — sadece Ayarlar sayfasında kullanılıyor) ve admin oluşturup silebilir;
geri kalan her şey (playlist, kuyruk, round) rol farkı olmadan paylaşımlı.

Rol JWT claim'ine eklendi (`middleware.RequireRole(role)` ile route bazlı
korunuyor). Frontend'in Ayarlar sayfasını/sidebar'ı role göre gösterip
gizleyebilmesi için ayrı bir `/me` endpoint'i **yazılmadı** — bunun yerine
login/logout'ta `auth_token` (httpOnly) ile birlikte httpOnly OLMAYAN `role` ve
`username` cookie'leri de set/temizleniyor; frontend bunları ağ isteği atmadan
okuyor. Bu ikinci cookie çifti bir yetki sınırı değil (client tarafından
değiştirilebilir), sadece UI kararı — asıl yetki her zaman backend'de
`RequireRole` ile korunuyor.

**Neden:** Kullanıcı kararı. `/me` + react-query yerine cookie okuma tercih
edildi çünkü rol zaten güvenlik sınırı taşımıyor; ekstra bir istek/hook
karmaşıklığına gerek yok.

**Sonuç:**
- `backend/internal/auth`: `User.Role`, `RoleAdmin`/`RoleBoss` sabitleri,
  `AuthService.CreateAdmin`/`DeleteAdmin`/`ListByVenue`, `AuthHandler`'da
  `/users` grubu (boss-only).
- JWT/cookie mekaniği (`Claims`, `GenerateToken`, `ParseToken`, `CookieName`)
  `auth` paketinden yeni bir `backend/internal/token` paketine taşındı — `auth`
  paketi artık `middleware.AuthMiddleware`'i (route koruması için) kullanabiliyor
  olsa da, `middleware` paketinin `auth`'a bağımlı kalması import cycle'a yol
  açıyordu. `token` bağımsız bir temel paket; `middleware` ve `auth` ona
  bağımlı, birbirlerine değil. `middleware.RequireBoss()` da bu yüzden generic
  `RequireRole(role string)` oldu — rol sabitleri `middleware`'e değil `auth`
  paketinde kalmaya devam ediyor (kullanıcı tercihi).
- `docs/database.md`: `users.role` alanı ve partial unique index eklendi.

## 2026-07-27 — Round döngüsü otomatikleşti: time.AfterFunc ile FinishRound

**Karar:** Round artık sadece manuel açılıp kapanmıyor — `OpenRound` bir round
oluşturunca `time.AfterFunc(EndsAt, FinishRound)` ile kendi bitişini
zamanlıyor. `FinishRound` süresi dolan round'u kapatır (Redis'teki oy
sayaçlarını final `candidates[].votes`'a yazar, kazananı belirler —
berabere olursa rastgele — ve hemen `queue`'ya ekler, yani kazanan şarkı
gecikmeden çalmaya başlar), ardından **arada boşluk bırakmadan** bir sonraki
round'u hemen `open` durumunda açıp kendi `FinishRound`'unu zamanlar — döngü
böyle sürekli kendi kendini besliyor, dıştan (cron/scheduler) tetiklemeye
gerek kalmıyor.

**REVİZE (2026-07-27):** İlk tasarımda round kapanışı ile bir sonrakinin
açılışı arasında `scheduled` ara durumlu ~1 dakikalık bir boşluk vardı
(`StartRound` diye ayrı bir adım, `time.AfterFunc(StartedAt, StartRound)`).
Kullanıcı bundan vazgeçti: sonuç gösterme/bekleme yerine round bitince
hemen yeni round açılıp kazanan direkt çalmaya başlasın istendi. `scheduled`
status'ü ve `StartRound` kaldırıldı — artık sadece `open`/`closed` var.

**Neden:** Kullanıcı tercihi — basitlik ve gecikmesiz geçiş (kazanan hemen
çalsın) tercih edildi.

**Sonuç:**
- `RoundService` artık `queue.QueueService`'e bağımlı (kazananı kuyruğa
  eklemek için); `round` paketi `queue`'yu import ediyor (tersi yok,
  cycle oluşmuyor).
- `OpenRound` ve `FinishRound`'un aday seçme adımları `selectCandidates`
  private helper'ında birleştirildi (tekrarı önlemek için).
- **Bilinen kısıt:** zamanlayıcılar yalnızca process belleğinde —
  sunucu yeniden başlarsa bekleyen `FinishRound` tetiklemesi kaybolur (o
  round askıda kalır, admin manuel yeni round başlatana kadar). Kalıcı bir
  job scheduler'a geçiş şimdilik kapsam dışı, ileride değerlendirilebilir.
- WebSocket ile sonuç/round bilgisini client'lara anlık gönderme kısmı BU
  karara dahil değil — WS zaten ayrı olarak ertelenmiş durumda (bkz.
  aşağıdaki "WebSocket ertelendi" kararı); `FinishRound`/`StartRound`
  implementasyonunda ilgili adımlar "WS eklenince buraya" notuyla
  işaretlendi.

## 2026-07-27 — Round aday cooldown'u, queue fallback cooldown'undan ayrı

**Karar:** Round'un aday seçiminde kullanılan cooldown, queue fallback'in
`recentlyPlayedCooldownMin`'inden **ayrı** bir ayar: `venue.settings.
candidateCooldownMin` (varsayılan 30 dk). `tracks` (playlist) dokümanına yeni
`lastCandidateAt` alanı eklendi — bir şarkı round'da aday gösterildiğinde
(kazanıp çalınmasa bile) güncellenir. `TrackService.RandomCandidates` artık
`lastPlayedAt` değil `lastCandidateAt`'a bakan bir cooldown filtresiyle çalışır
(`TrackService.MarkCandidates` ile güncellenir).

**Neden:** Bir şarkı round'da aday olup kaybedebilir — hiç çalınmaz,
`lastPlayedAt` değişmez. `recentlyPlayedCooldownMin` filtresini kullansaydık bu
şarkı bir sonraki turda hemen tekrar aday olabilirdi (müşteri "yine bu şarkı mı"
hissi). Ayrı bir cooldown, "adaylık" ile "çalınma"yı birbirinden bağımsız
sınırlıyor.

**Sonuç:** 2026-07-26 kararındaki "(ve round'un aday seçimindeki)" ifadesi bu
kararla REVİZE edildi — round artık kendi cooldown'unu kullanıyor, queue
fallback'inkini paylaşmıyor. `venue.settings.candidateCooldownMin` ve
`tracks.lastCandidateAt` eklendi (bkz. database.md).

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

## 2026-07-28 — WS hub track yaşam döngüsü: REST player-state raporlaması yerini WS'e bırakıyor (REVİZE, bkz. aynı gün "Player artık WS'e bağlanmıyor")

**Karar (REVİZE EDİLDİ):** Player'ın track yaşam döngüsü artık REST `/venue/player-state` yerine
`internal/ws` hub'ı üzerinden yürüyor:
- `TRACK_STARTED` (player -> server) her fiilen çalmaya başlayan track için gönderilir
  (ilk açılış, TRACK_ERROR sonrası fallback, player'ın kendi isteğiyle aldığı sıradaki
  track — hepsi). Sunucu `VenueService.SetNowPlaying` çağırır ve **aynı mesajı** o
  venue'nin `KindCustomer` bağlantılarına broadcast eder — ayrı bir `NOW_PLAYING` sabiti
  eklenmedi, `TRACK_STARTED` iki yönde de kullanılıyor.
- `TRACK_ERROR` (player -> server): sunucu `QueueService.Next` ile yeni track seçip
  player'a `PLAY_TRACK` gönderir (`youtubeVideoId`, `title`, `channel`).
- `TRACK_ENDED` **kaldırıldı** (message.go'da yok). Şarkı normal bitişinde player zaten
  kendi isteğiyle REST `/queue/next` çağırıp yeni track alıyor (bu akış değişmedi);
  yeni track çalmaya başlayınca `TRACK_STARTED` zaten gönderiliyor, ayrıca bir "bitti"
  sinyaline (log/analytics dahil) ihtiyaç duyulmadı.
- REST `POST /venue/player-state` endpoint'i, `PlayerStateRequest`/`PlayerState` DTO'su
  ve `VenueService.ClearNowPlaying` kaldırıldı (kullanılmıyordu — "ended"/"error"
  durumunda artık nowPlaying temizlenmiyor, yeni `TRACK_STARTED` zaten üzerine yazıyor).
- Frontend: admin player sayfası (`QueueContext`) artık `venueApi.reportPlayerState`
  yerine `usePlayerSocket` (`/ws/player?access_token=...`) kullanıyor; müşteri
  `/v/{slug}` sayfası ilk yükü REST `GetPublicVenue`'dan alıyor, sonrasını
  `useNowPlayingSocket` (`/ws/venue/:slug`) ile realtime güncelliyor.

**Neden:** REST raporlama sadece Redis'i güncelliyordu, müşteri tarafına realtime
broadcast yapamıyordu (poll gerektirirdi). WS hub zaten bu ihtiyaç için kuruluyordu;
iki paralel mekanizma taşımanın getirisi yoktu.

## 2026-07-11 — Temel yapı (önceki oturum)

Monorepo (`backend/` + `frontend/`), Go backend Standard Go Layout, Next.js frontend
feature-based (colocation), HeroUI v3 + Tailwind v4.

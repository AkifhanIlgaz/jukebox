# Mimari

> Son güncelleme: 2026-07-11. Kararların gerekçeleri için bkz. [decisions.md](decisions.md).

## Ürün özeti

Mekanlarda (kafe vb.) arka plan müziğinin seçimine müşterileri dahil eden sistem.
Mekan sahibi bir YouTube şarkı havuzu (playlist) tanımlar; belirli aralıklarla
"sıradaki şarkı hangisi olsun?" oylaması açılır. Müşteriler masadaki QR'ı okutup
oy verir; kazanan şarkı mekandaki player'da otomatik çalar.

## Bileşenler

```
                                   ┌─────────────────────────┐
 Müşteri telefonu                  │  Go Backend (tek servis)│
 (Next.js /v/[slug])  ── WS/REST ──►  - REST API             │
                                   │  - WebSocket hub        │──── MongoDB
 Mekan bilgisayarı                 │  - Tur zamanlayıcısı    │
 (Next.js /player)    ── WS ───────►  - (round scheduler)    │
                                   └─────────────────────────┘
 Mekan sahibi paneli
 (Next.js /dashboard) ── REST ─────►
```

- **Go Backend** — tek binary (`cmd/api`). REST (playlist/mekan yönetimi, ilk sayfa
  yüklemeleri) + WebSocket hub (canlı oylar, tur olayları, player komutları) +
  tur zamanlayıcısı (sabit aralıkla tur açıp kapatan goroutine).
- **Müşteri sayfası** (`/v/[slug]`) — QR'dan açılır. Aktif turdaki aday şarkıları ve
  canlı oy sayılarını gösterir, oy gönderir. Cihaz çerezi ile turda 1 oy.
- **Player sayfası** (`/player`) — mekan bilgisayarında sürekli açık. YouTube IFrame
  API ile çalar; WS'den `PLAY_TRACK` komutu alır, şarkı bitince `TRACK_ENDED` bildirir.
- **Mekan paneli** (`/dashboard`) — mekan sahibi girişi, playlist yönetimi, tur aralığı
  ayarı, QR indirme.

## Temel akış (sabit aralıklı tur)

1. Zamanlayıcı, mekan ayarındaki aralıkla (varsayılan 10 dk) yeni tur açar:
   playlist'ten **rastgele N aday** seçilir (varsayılan 5; son 20 çalınan hariç,
   ikisi de mekan ayarı), WS ile `ROUND_STARTED` yayınlanır.
2. Müşteriler oy verir → backend cihaz başına 1 oy kuralını uygular, sayaçları
   atomik artırır (`$inc`), `VOTE_UPDATE` yayınlar.
3. Süre dolunca `ROUND_ENDED`: kazanan şarkı mekanın çalma kuyruğuna eklenir.
   Beraberlikte eşitler arasından rastgele seçilir; hiç oy yoksa kazanan olmaz.
4. Player'daki şarkı bitince (`TRACK_ENDED`) backend kuyruktan sıradakini gönderir
   (`PLAY_TRACK`). **Kuyruk boşsa playlist'ten rastgele şarkı çalınır (fallback).**

## Player protokolü (istemciden bağımsız)

Player istemcisi = WS'e bağlanıp şu mesajları konuşan herhangi bir şey. MVP'de bizim
IFrame'li sayfamız; v2'de Chrome extension aynı protokolle ikinci istemci olabilir.

| Yön | Mesaj | İçerik |
|---|---|---|
| server → player | `PLAY_TRACK` | youtubeVideoId, title |
| player → server | `TRACK_ENDED` | trackId |
| player → server | `PLAYER_STATE` | playing/paused, position (periyodik) |
| server → player | `QR_TOKEN_REFRESH` | (v2, dönen QR modu için rezerve) |

## Kimlik / erişim

- **Müşteri:** login yok. İlk ziyarette anonim cihaz token'ı üretilir (httpOnly cookie).
  Oy kaydında `deviceId + roundId` unique — turda 1 oy.
- **Mekan sahibi:** email + şifre (kendi implementasyonumuz; bcrypt hash, JWT veya
  session cookie — implementasyonda netleşir). Google OAuth v2 adayı.
- **QR:** statik, `jukebox.app/v/{slug}` URL'ini taşır. Dönen QR altyapısı v2.

## Deploy

- **Frontend:** Vercel (Next.js doğal ortamı, CDN, preview deploy'lar bedava).
- **Backend + MongoDB:** tek VPS (Go binary + Mongo; docker-compose veya systemd).
- **Cross-domain kuralı:** İki ortam ayrı olduğu için aynı kök domain kullanılacak —
  örn. `app.X.com` (Vercel) + `api.X.com` (VPS). Cihaz çerezi `Domain=.X.com` ile
  yazılır ki hem sayfa hem API görebilsin; CORS `app.X.com`'a izinli, WS bağlantısı
  `wss://api.X.com`. Yerel geliştirmede `localhost:3000` + `localhost:8080`.

## Frontend yerleşimi (feature-based)

```
frontend/features/
├── voting/     # müşteri oylama ekranı (aday listesi, canlı sonuç, oy butonu)
├── player/     # IFrame player + WS komut dinleyici
├── dashboard/  # mekan sahibi: playlist CRUD, ayarlar, QR
└── auth/       # mekan sahibi girişi
```

## Açık konular

Tümü 2026-07-11'de kararlaştırıldı — bkz. [decisions.md](decisions.md).
Yeni açık konu çıktıkça buraya `- [ ]` olarak eklenecek.

## v2 aday listesi (MVP'ye girmeyecek)

- Chrome extension (ikinci player istemcisi)
- Dönen QR modu (ekranda süreli token)
- Mekan sahibi skip/veto butonu
- Google OAuth ile giriş
- Panelden YouTube araması (Data API)
- Çoklu playlist (sabah/akşam modu)
- İstatistik ekranları (en çok oy alanlar vb.)

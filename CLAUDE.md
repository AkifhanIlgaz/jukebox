# Jukebox

Mekanlarda (kafe vb.) arka plan müziğini müşteri oylamasıyla seçtiren sistem.
Müşteri QR okutur → aktif turda oy verir → kazanan şarkı mekandaki player'da çalar.

## Teknoloji ve yapı

- **Monorepo:** `backend/` (Go, Standard Go Layout) + `frontend/` (Next.js 16 App Router,
  feature-based colocation, HeroUI v3 + Tailwind v4)
- **DB:** MongoDB · **Realtime:** WebSocket · **Müzik kaynağı:** sadece YouTube (IFrame API)

## Temel kararlar (detay: docs/)

- Oylama turları: tur süresi varsayılan 10 dk (mekan ayarı); yeni tur, kapanan turdan
  sonraki ilk şarkı çalmaya başlayınca açılır (player kapalıysa tur açılmaz). Her turda
  playlist'ten rastgele 5 aday (son 20 çalınan hariç). Kazanan kuyruğa girer (ayrı
  `queue` koleksiyonu), kuyruk boşsa playlist'ten rastgele fallback çalar.
  Beraberlik: rastgele.
- Statik QR + anonim cihaz çerezi, cihaz başına turda 1 oy. Müşteri için login YOK.
  Mekan sahibi: email+şifre (bcrypt, kendi implementasyonumuz).
- Player = mekan bilgisayarında açık duran web sayfamız (IFrame API). Player protokolü
  istemciden bağımsız; Chrome extension v2'de ikinci istemci olabilir.
- Şarkı ekleme: YouTube linki yapıştır + oEmbed metadata (API key yok). Mekan başına
  tek şarkı havuzu.
- Deploy: frontend Vercel, backend+Mongo VPS; aynı kök domain (`app.X.com`/`api.X.com`),
  cihaz çerezi `Domain=.X.com`.
- `youtube-nocookie.com` kullanma (Premium oturumunu tanımaz, reklamsızlık bozulur).
- Skip/veto, dönen QR, OAuth, panelden arama, çoklu playlist → v2 (MVP'ye ekleme).

## Dokümanlar — değişiklik yapmadan önce ilgili olanı oku

- `docs/architecture.md` — bileşenler, akışlar, WS protokolü, açık konular
- `docs/database.md` — Mongo şeması (TASLAK, birlikte netleşecek)
- `docs/decisions.md` — karar günlüğü; yeni mimari karar alınınca BURAYA tarihli ekle
- `docs/design-prompt.md` — HAZIR UI tasarımlarının Claude Design linkleri (admin +
  müşteri oylama); frontend yazarken claude_design MCP ile import edilecek

## Geliştirme sırası (kararlaştırıldı, 2026-07-11)

1. **Önce frontend, her şeyiyle bitecek.** İstek atılan tüm endpoint'ler baştan tanımlı
   olacak ama implement edilmemiş halde MOCK veri dönecek. Gerçek API sözleşmesi
   (path'ler, request/response şekilleri) bu aşamada netleşir.
2. **Sonra backend:** mock'lanan endpoint'ler aynı sözleşmeyle gerçek implementasyona
   çevrilir.
- Mock'ların nerede yaşayacağı (Next.js route handler mı, Go stub server mı) frontend'e
  başlarken kararlaştırılacak.

## Çalışma kuralları

- HeroUI dokümanları yerelde: `.heroui-docs/react/` (bkz. kök AGENTS.md). Network'ten
  çekme; dar demo dosyalarını oku (`demos/en/<bileşen>/<örnek>.tsx`).
- Frontend'de Next.js 16 var — `frontend/AGENTS.md` uyarısına uy
  (`node_modules/next/dist/docs/`).
- Mimari/şema kararları kullanıcıyla BİRLİKTE verilir; karar verilince docs/ güncellenir.

# Veritabanı Tasarımı — MongoDB

> DURUM: Koleksiyon yapısı 2026-07-11'de kararlaştırıldı. Alan detayları
> implementasyon sırasında incelikle netleşebilir; yapısal değişiklik gerekirse
> önce decisions.md'ye kayıt düşülür.

## Koleksiyonlar

### venues — mekanlar

```js
{
  _id: ObjectId,
  slug: "kahve-diyari",          // QR URL'inde kullanılır, unique
  name: "Kahve Diyarı",
  ownerId: ObjectId,             // → owners._id
  settings: {
    roundIntervalMin: 10,        // tur aralığı (dk)
    candidateCount: 5,           // tur başına rastgele aday şarkı sayısı
    recentlyPlayedWindow: 20     // son N şarkı tekrar aday olamaz
  },
  createdAt, updatedAt
}
// index: { slug: 1 } unique
```

### users — mekan sahibi/admin hesapları

```js
{
  _id: ObjectId,
  username: "kahvediyari",       // unique (email değil — karar 2026-07-24)
  passwordHash: "...",           // bcrypt
  venueId: ObjectId,             // → venues._id
  createdAt
}
// index: { username: 1 } unique
// NOT: register bu iterasyonda yok, hesaplar elle açılıyor. Bir venue'nin birden
// fazla admin'i olabilecek şekilde tasarlandı (venueId her user'da var, 1:1
// zorunluluğu yok) — mekan sahibi ileride yeni admin ekleyebilecek (bkz. decisions.md
// 2026-07-24).
```

### tracks — mekanın şarkı havuzu (mekan başına TEK havuz)

```js
{
  _id: ObjectId,
  venueId: ObjectId,             // → venues._id
  youtubeVideoId: "dQw4w9WgXcQ", // sahibin yapıştırdığı linkten parse edilir
  title: "...",                  // oEmbed'den (title)
  channelName: "...",            // oEmbed'den (author_name)
  thumbnailUrl: "...",           // oEmbed'den (thumbnail_url)
  addedAt,
  lastPlayedAt: ISODate | null   // "yakın zamanda çalındı" filtresi için
}
// NOT: durationSec YOK — oEmbed süre vermez, akış IFrame'in TRACK_ENDED
// olayıyla yürüdüğü için gerekmez.
// index: { venueId: 1 }, { venueId: 1, youtubeVideoId: 1 } unique
```

### rounds — oylama turları (oylar gömülü sayaç olarak)

```js
{
  _id: ObjectId,
  venueId: ObjectId,
  status: "open" | "closed",
  startsAt, endsAt,
  candidates: [                  // aday şarkılar + oy sayaçları gömülü
    { trackId: ObjectId, youtubeVideoId: "...", title: "...", votes: 12 },
    { trackId: ObjectId, ..., votes: 7 }
  ],
  winnerTrackId: ObjectId | null // tur kapanınca yazılır
}
// index: { venueId: 1, status: 1 }, { venueId: 1, startsAt: -1 }
// Oy artırma: candidates.$.votes üzerinde atomik $inc
```

### votes — kim hangi turda oy verdi (tekrar oy engeli)

```js
{
  _id: ObjectId,
  roundId: ObjectId,
  deviceId: "d_a8f3...",         // anonim cihaz token'ı
  trackId: ObjectId,
  votedAt
}
// index: { roundId: 1, deviceId: 1 } unique  ← turda 1 oy garantisi burada
```

### queue — çalma kuyruğu

```js
{
  _id: ObjectId,
  venueId: ObjectId,
  trackId: ObjectId,
  source: "vote" | "fallback",   // oylamadan mı rastgele fallback mi
  enqueuedAt,
  playedAt: ISODate | null       // null = henüz çalınmadı
}
// index: { venueId: 1, playedAt: 1, enqueuedAt: 1 }
// KARAR: ayrı koleksiyon (gömülü dizi değil) — playedAt sayesinde "çalınanlar
// geçmişi" bedavaya çıkar, eşzamanlı güncellemeler basit.
```

## Tasarım notları

- **Oy sayacı `rounds.candidates` içinde gömülü**: tek dokümanda atomik `$inc`,
  canlı skor için tek okuma. `votes` koleksiyonu yalnızca "cihaz turda 1 oy"
  kuralını unique index ile garanti etmek için var (sayaç orada tutulmaz).
- Cihazlar için ayrı koleksiyon YOK (şimdilik): cihaz token'ı imzalı cookie,
  sunucuda saklamaya gerek yok. Kötüye kullanım analizi gerekirse eklenir.
- Tur geçmişi silinmez → mekan sahibine "en çok oy alanlar" istatistiği çıkarılabilir.

## Kararlaştırıldı (2026-07-11, detay: decisions.md)

- `queue`: ayrı koleksiyon ✓
- `tracks`: mekan başına tek havuz; çoklu playlist v2 ✓
- Metadata: YouTube oEmbed (link yapıştırma); Data API v2 ✓
- Tur geçmişi: TTL yok, silinmez (istatistik için) ✓

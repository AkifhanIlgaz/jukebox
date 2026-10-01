# Pazarlama Orkestrası

> **Şef çalmaz, yönetir.** Pazarlama işini tek bir yapay zekâ sohbetine yıkmak yerine
> bir orkestra kur: ana oturum şef olur, işi uzman ajanlara böler, bağımsız bir
> denetçi kontrol eder, şef birleştirir — ve **hiçbir şey senin onayın olmadan
> dışarı çıkmaz.**

Bu düzen, [Rues Community · Yapay Zekâ Orkestrası](https://github.com/ruesandora/RuesCommunity/tree/main/icerikler/01-yapay-zeka-orkestrasi)
rehberindeki yapının (şef + uzman ajanlar + bağımsız denetçi, brif şablonu, en fazla
3 tur DÜZELT, değişmez kurallar, model seçimi) pazarlama işlerine uyarlanmış hâlidir.

## Kadro

```
                      SEN  (istersin, "yayınla" dersin)
                       │
                     ŞEF  (ana oturum · opus · böler, brif yazar, birleştirir)
                       │
   ┌───────────┬───────┴──────┬─────────────┬──────────────┐
 strateji   arama          içerik        kanallar        üretim
 stratejist seo-uzmani     icerik-yazari sosyal-medya    tasarimci
 arastirmaci geo-uzmani                  reklam-uzmani   video-ureticisi
                                         eposta-uzmani   yukleyici
                                         buyume-cro
                                         pr-is-gelistirme
                                         analist
                       │
                  DENETÇİ  (kulak · ONAY / DUZELT · dosya yazmaz)
```

| Ajan | Model | Neden o model | Önceden yüklü skill'ler |
|---|---|---|---|
| `denetci` | sonnet, riskte opus | Kontrol orta akıl ister; para/hukuk/itibar riskinde opus | brand-voice-enforcement, brand-review, copy-editing |
| `arastirmaci` | sonnet | Okumak, karşılaştırmak, özetlemek | competitive-brief, customer-research, competitor-profiling |
| `stratejist` | opus | Konumlandırma ve plan yargı ister | marketing-plan, campaign-plan, product-marketing |
| `seo-uzmani` | sonnet | Yöntemi belli denetim işi | seo-audit, site-architecture, schema |
| `geo-uzmani` | sonnet | Yöntemi belli denetim işi | ai-seo, schema |
| `icerik-yazari` | sonnet | Tarif edilmiş yazı işi | content-creation, copywriting, content-strategy |
| `sosyal-medya` | sonnet | Kanal metni | social, community-marketing |
| `reklam-uzmani` | sonnet | Kanal metni ve kurgu | ads, ad-creative, ab-testing |
| `eposta-uzmani` | sonnet | Kanal metni | emails, email-sequence |
| `buyume-cro` | sonnet | Hipotez + metin | cro, signup, onboarding |
| `pr-is-gelistirme` | sonnet | Liste ve metin | public-relations, co-marketing |
| `analist` | sonnet | Veriden rapor | performance-report, analytics, attribution |
| `tasarimci` | opus | Görsel yargı ve zevk | image |
| `video-ureticisi` | opus | Uzun, çok adımlı, zevk isteyen iş | video |
| `yukleyici` | haiku | Mekanik iş; adımlar belli | — |

Her ajan dosyasında ayrıca "gerektiğinde açacağın skill'ler" listesi var. Toplamda
kurulan plugin'lerdeki **tüm** skill'ler bir ajana atanmıştır. Önceden yüklenen
skill'lerin tam metni ajanın bağlamına girdiği için her ajanda 2-3 ile sınırlı tutuldu;
gerisini ajan Skill aracıyla ihtiyaç anında açar.

## Bir işin yolculuğu

```
1 SEN ──▶ 2 ŞEF böler, brif yazar ──▶ 3 AJAN taslaklar/<iş>/ ──▶ 4 DENETÇİ
                                              ▲                       │
                                              └──── DUZELT (≤3 tur) ──┤
                                                                      ▼ ONAY
          7 YÜKLEYİCİ yayınlar ◀── 6 SEN "yayınla" ◀── 5 ŞEF yayina-hazir/<iş>/
            + yayinlananlar/gunluk.md
```

Klasörler Rues düzenindeki dalların karşılığıdır:

| Klasör | Ne | Kim yazar |
|---|---|---|
| `briefler/` | Her işin brifi | Şef |
| `taslaklar/<is-kodu>/` | Ajanların çalışma alanı (Rues'teki "ajanın dalı") | Brifte adı geçen ajan |
| `yayina-hazir/<is-kodu>/` | Denetçiden ONAY almış iş (Rues'teki "ana dal") | Yalnızca şef |
| `yayinlananlar/gunluk.md` | Ne, nerede, ne zaman yayınlandı | Şef / yükleyici |
| `marka/` | Ürün, kitle, ses kılavuzu, kanıt noktaları | Sen (ajanlar taslak önerebilir) |

## Kurulum

### 1. Klasörü yerine koy

Bu klasörü ayrı bir repo olarak kullanman önerilir:

```bash
cp -r pazarlama-orkestrasi ~/pazarlama && cd ~/pazarlama && git init
```

Ajanları tüm projelerinde kullanmak istersen `.claude/agents/*.md` dosyalarını
`~/.claude/agents/` altına da kopyalayabilirsin; şef kuralı yine de çalıştığın
klasörün `CLAUDE.md` dosyasında olmalı.

### 2. Plugin'ler

`.claude/settings.json` üç plugin'i otomatik tanımlar. Klasörde `claude` açtığında
marketplace'lere güvenmen istenir; onayla:

| Plugin | Marketplace | Kaynak |
|---|---|---|
| `marketing` | knowledge-work-plugins | Anthropic |
| `brand-voice` | knowledge-work-plugins | Tribe AI (Anthropic kataloğunda) |
| `marketing-skills` | marketingskills | coreyhaines31/marketingskills |

Elle kurmak istersen:

```
/plugin marketplace add anthropics/knowledge-work-plugins
/plugin install marketing@knowledge-work-plugins
/plugin install brand-voice@knowledge-work-plugins
/plugin marketplace add coreyhaines31/marketingskills
/plugin install marketing-skills@marketingskills
```

**İsteğe bağlı plugin'ler** (Anthropic dizininde topluluk plugin'i; claude.ai →
Plugins / Anthropic Directory'den kur): `Product Marketing`, `seo-geo-consultant`,
`dataslayer-marketing-skills`, `Ayrshare`, `Blogr`. Ajan dosyalarında bunlar
"kuruluysa" diye geçer; kurulu değilse ajan onları atlar. Kurduktan sonra `/skills`
ile gerçek adlarına bak; ajan dosyalarındaki ön ek (`product-marketing:`,
`ayrshare:` …) farklıysa düzelt.

> **Ayrshare gerçekten paylaşım yapar.** Bağlarsan bile yalnızca `yukleyici`
> kullanır ve yalnızca brifte `SAHİP ONAYI` satırı varsa.

### 3. Marka dosyalarını doldur (en önemli adım)

Ajanların kalitesi buradaki bağlama bağlı:

1. `marka/urun.md` — elle doldur.
2. Şefe: *"Elimdeki metinlerden marka sesi kılavuzunu çıkar"* →
   `marka/ses-kilavuzu.md` (stratejist, brand-voice skill'leriyle).
3. Şefe: *"ICP ve persona'ları araştır"* → `marka/hedef-kitle.md` taslağı
   (araştırmacı), sen onayla.
4. `marka/kanit-noktalari.md` — doğruladığın rakam ve yorumları elle gir.
   Ajanlar uydurma yasağı gereği yalnızca buradakileri kullanır.

### 4. İlk iş

`briefler/ornek-2026-10-01-ilk-blog-yazisi.md` dosyasına bak, sonra şefe sade
dille söyle:

> "Hedef kitlemiz için ilk blog yazısını hazırla, 3 sosyal medya postuna da dönüştür."

Şef işi böler (içerik-yazarı → denetçi → sosyal-medya → denetçi), sana
`yayina-hazir/` altındaki sonucu ve onayını bekleyen maddeleri raporlar.

### 5. Tekrarlayan işler (isteğe bağlı)

Claude Code'daki **Routines** (zamanlanmış görev) ile ör. "her pazartesi 08:50'de
haftalık içerik planı çıkar ve taslakları hazırla" kurabilirsin. Routine de yalnızca
`yayina-hazir/`'a kadar gider; yayın yine senin onayınla olur.

## Değişmez kurallar (özet)

Ayrıntısı `CLAUDE.md` içinde: yayın kuralı · para kuralı · uydurma yok · mevzuat
(örtülü reklam, reklam etiketi, izinli ileti, lisans) · marka sesi tek kaynaktan ·
sırlar dosyada durmaz · hassas veri toplanmaz · tehlikeli git komutları yasak
(`.claude/settings.json` içinde de engelli).

## Hangi işe hangi model

1. Adımlar belli mi, iş mekanik mi? → **haiku** (yükleyici)
2. Yargı, zevk ya da risk var mı? → **opus** (şef, stratejist, tasarımcı, video,
   riskli denetim)
3. Diğer her şey → **sonnet**

Ucuz iş pahalı modele, yargı gerektiren iş ucuz modele verilmez. Modeli yazılmayan
ajan ana oturumun modelini devralır; genel amaçlı ajana modeli her zaman açıkça ver.

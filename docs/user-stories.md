# User Stories

> Her story kullanıcıyla birlikte tartışılıp anlaşıldıktan sonra buraya eklenir.
> Format: Story (As a / istiyorum / çünkü) · Kabul Kriterleri · Given-When-Then
> (gerekliyse) · Technical Notes (gerekliyse) · Boyut (S/M/L).
> Story'ler INVEST prensibine uyar; bağımlılıklar açıkça belirtilir.

---

## Story 1 — QR ile oylama sayfasına erişim

### Story
As a **ziyaretçi (kafe müşterisi)** olarak,
masadaki QR kodu okutarak hiçbir kayıt/giriş adımı olmadan mekanın oylama sayfasına
ulaşmak istiyorum,
çünkü çalan müziğin seçimine anında, sürtünmesiz katılmak istiyorum.

### Kabul Kriterleri
- Geçerli bir mekan slug'ı ile `/v/{slug}` açıldığında o mekanın oylama sayfası yüklenir.
- Sayfa login/kayıt adımı olmadan doğrudan kullanılabilir.
- İlk ziyarette cihaza anonim bir cihaz kimliği atanır; aynı cihazdan sonraki
  ziyaretlerde bu kimlik korunur.
- Geçersiz/silinmiş slug'da anlaşılır bir "mekan bulunamadı" hatası gösterilir
  (boş/kırık sayfa değil).
- Aktif tur yokken ziyaretçi durumu açıklayan bir bekleme ekranı görür:
  - tur arası (tur kapandı, sıradaki şarkı henüz başlamadı),
  - müzik çalmıyor (player kapalı → hiç tur açılmıyor).
- Sayfa mobil tarayıcıda sorunsuz görüntülenir ve kullanılır (QR mobilden okutulur).

### Given-When-Then
Given mekanın geçerli bir QR kodu (statik `/v/{slug}` URL'i)
When ziyaretçi QR'ı telefonuyla okutur
Then oylama sayfası açılır, cihaza anonim kimlik atanır ve aktif tur varsa adaylar görünür

Given tur kapanmış ve sıradaki şarkı henüz başlamamış
When ziyaretçi sayfayı açar
Then oylamanın birazdan başlayacağını anlatan bekleme ekranı görünür

### Technical Notes
- Cihaz kimliği: httpOnly çerez; cross-domain kuralı gereği `Domain=.X.com`
  (detay: architecture.md → Kimlik / erişim).
- Frontend fazında mekan/slug lookup ve tur durumu endpoint'leri mock dönecek.

**Boyut:** S

---

## Story 2 — Aktif turdaki adayları görme

### Story
As a **ziyaretçi (kafe müşterisi)** olarak,
aktif turdaki aday şarkıları, güncel oy durumunu ve tura ne kadar süre kaldığını
görmek istiyorum,
çünkü hangi şarkıya oy vereceğime bilinçli karar vermek istiyorum.

### Kabul Kriterleri
- Aktif tur varsa aday şarkılar (varsayılan 5) başlık ve küçük görselle listelenir.
- Her adayın güncel oy sayısı en baştan herkese görünür — oy vermeden önce de
  (karar: 2026-07-12, bandwagon etkisi kabul edildi).
- O an çalan şarkı "şu an çalıyor" olarak ekranda gösterilir; müzik çalmıyorsa bu
  alan gösterilmez.
- Turun kapanmasına kalan süre geri sayım olarak gösterilir.
- Geri sayım sıfırlanınca ekran tur arası (bekleme) durumuna geçer — sayfa
  yenilemeye gerek kalmadan.
- Bir adayın verisi eksikse (ör. görsel yüklenemedi) liste kırılmaz, yer tutucu
  gösterilir.

### Technical Notes
- Bu story sayfa yüklendiği andaki durumu kapsar; oy sayılarının canlı (WS ile)
  güncellenmesi ayrı bir story'dir.
- Sayfa ilk yükleme REST ile gelir (architecture.md → Bileşenler).

**Bağımlılık:** Story 1 (sayfaya erişim).

**Boyut:** S

---

## Story 3 — Aday şarkıya oy verme (değiştirilebilir oy)

### Story
As a **ziyaretçi (kafe müşterisi)** olarak,
aktif turdaki adaylardan birine tek dokunuşla oy vermek ve tur bitmeden fikrimi
değiştirebilmek istiyorum,
çünkü sıradaki şarkının seçiminde söz sahibi olmak istiyorum.

### Kabul Kriterleri
- Aktif turda adaylardan birine tek dokunuşla oy verilebilir; oy anında ekrana yansır.
- Oy verilen aday görsel olarak işaretli kalır.
- Tur kapanana kadar oy başka adaya taşınabilir: eski adayın sayısı azalır, yeninin
  artar; cihazın net oyu her an 1'dir.
- Oy değiştirme sıklığında sınır yoktur (karar: 2026-07-12, bkz. decisions.md).
- Sayfa yenilendiğinde verilen oy işaretli kalır (cihaz kimliğinden tanınır).
- Tur kapandıktan sonra ulaşan oy/değiştirme denemesi reddedilir ve sürenin dolduğu
  bildirilir.
- Ağ hatasında oy iletilemezse ziyaretçi bilgilendirilir ve tekrar deneyebilir;
  tekrar deneme çift oy oluşturmaz.

### Given-When-Then
Given ziyaretçi aktif turda A şarkısına oy vermiş
When tur kapanmadan B şarkısına dokunur
Then oyu B'ye taşınır; A'nın sayısı 1 azalır, B'ninki 1 artar, B işaretli görünür

Given tur kapanmış
When ziyaretçi oy vermeyi/değiştirmeyi dener
Then istek reddedilir ve "tur sona erdi" bilgisi gösterilir

### Technical Notes
- Sunucu tarafında `deviceId + roundId` unique oy kaydı; değiştirmede kayıt
  güncellenir, sayaçlar atomik azalt/artır.
- Frontend fazında oy endpoint'i mock dönecek.

**Bağımlılık:** Story 2 (adayların görünmesi).

**Boyut:** M

---

## Story 4 — Canlı oy ve tur güncellemeleri

### Story
As a **ziyaretçi (kafe müşterisi)** olarak,
oy sayılarının ve tur durumunun sayfa yenilemeden anlık güncellenmesini istiyorum,
çünkü yarışın gidişatını canlı takip etmenin heyecanını yaşamak istiyorum.

### Kabul Kriterleri
- Başka bir cihaz oy verdiğinde/değiştirdiğinde tüm açık sayfalardaki sayılar
  yenileme olmadan güncellenir.
- Yeni tur açıldığında adaylar ve geri sayım anlık olarak ekrana gelir.
- Tur kapandığında ekran anlık olarak sonuç/bekleme durumuna geçer.
- Bağlantı koptuğunda kullanıcıya görünür bir gösterge sunulur ("bağlantı yeniden
  kuruluyor…") ve oy butonları geçici olarak devre dışı kalır (karar: 2026-07-12).
- Bağlantı otomatik yeniden kurulur; kurulunca gösterge kalkar, butonlar açılır ve
  ekran güncel durumla senkronlanır (kaçan olaylar yerine güncel durum baz alınır).

### Technical Notes
- Taşıyıcı: tek WebSocket bağlantısı (`VOTE_UPDATE`, `ROUND_STARTED`, `ROUND_ENDED`
  olayları — architecture.md). Yeniden bağlanınca REST ile tam durum çekilir.
- Frontend fazında WS olayları mock (sahte olay üretici) ile beslenecek.

**Bağımlılık:** Story 2 (adayların görünmesi). Story 3'ün "oy anında yansır"
kriteriyle birlikte uçtan uca canlı deneyimi tamamlar.

**Boyut:** M

---

## Story 5 — Tur sonucu ve kazananın duyurulması

### Story
As a **ziyaretçi (kafe müşterisi)** olarak,
tur kapandığında kazanan şarkıyı görmek istiyorum,
çünkü oyladığım şarkının kazanıp kazanmadığını merak ediyorum.

### Kabul Kriterleri
- Tur kapandığında kazanan şarkı (başlık + görsel) sonuç ekranında duyurulur,
  "birazdan çalacak" bilgisiyle birlikte.
- Sonuç ekranında turun son oy dağılımı görünür.
- Sonuç ekranı tur arası boyunca kalır; kazanan çalmaya başlayıp yeni tur açılınca
  otomatik olarak yeni tur ekranına geçilir.
- Hiç oy verilmemiş turda "bu turda kazanan yok" durumu gösterilir; müzik fallback
  ile devam eder.
- Beraberlikte kazanan sunucuda rastgele seçilir; ekranda yalnızca kazanan gösterilir,
  beraberlik bilgisi verilmez (karar: 2026-07-12).
- Ziyaretçinin kendi oyuna dair kişisel vurgu ("senin seçimin kazandı" vb.)
  gösterilmez (karar: 2026-07-12).

**Bağımlılık:** Story 2 (tur ekranı), Story 4 (canlı tur geçişleri).

**Boyut:** S

---

## Story 6 — Mekan sahibi kaydı

### Story
As a **mekan sahibi** olarak,
email ve şifremle hesap açıp mekanımı sisteme kaydetmek istiyorum,
çünkü mekanımda müşteri oylamalı müzik sistemini kullanmaya başlamak istiyorum.

### Kabul Kriterleri
- Email + şifre + mekan adı ile kayıt olunabilir; hesap ve mekan birlikte oluşur
  (1 hesap = 1 mekan, karar: 2026-07-12).
- Oylama adresi slug'ı mekan adından otomatik türetilir; ad çakışmasında sonek
  eklenir. Kayıt sonunda `/v/{slug}` adresi hazırdır.
- Aynı email ile ikinci kayıt engellenir ve anlaşılır hata gösterilir.
- Zayıf şifre (8 karakterden kısa) kabul edilmez; kural formda gösterilir.
- Geçersiz email biçimi kabul edilmez.
- Email doğrulama adımı yoktur; hesap kayıt anında aktiftir (karar: 2026-07-12).
- Kayıt tamamlanınca kullanıcı giriş yapmış olarak panele yönlendirilir.

### Technical Notes
- Şifre bcrypt ile saklanır; oturum JWT/session (architecture.md → Kimlik / erişim).
- "Şifremi unuttum" MVP'de yok — mail altyapısı yok (bkz. decisions.md 2026-07-12).
- Frontend fazında kayıt endpoint'i mock dönecek.

**Bağımlılık:** yok (mekan sahibi akışının başlangıcı).

**Boyut:** M

---

## Story 7 — Mekan sahibi girişi ve oturum

### Story
As a **mekan sahibi** olarak,
email ve şifremle giriş yapıp oturumumun açık kalmasını istiyorum,
çünkü panelime her cihazdan zahmetsizce erişmek istiyorum.

### Kabul Kriterleri
- Doğru email + şifre ile giriş yapılınca panele ulaşılır.
- Hatalı bilgide genel hata gösterilir ("email veya şifre hatalı"); hangisinin
  yanlış olduğu belli edilmez (hesap varlığı sızdırılmaz).
- Oturum kalıcıdır (30 gün); tarayıcı kapatılıp açılsa da devam eder.
- Giriş yapılmadan panel adresleri açılırsa login sayfasına yönlendirilir;
  girişten sonra gitmek istenen sayfaya dönülür.
- "Çıkış yap" oturumu sonlandırır; panel tekrar giriş ister.

### Technical Notes
- Brute-force koruması (deneme sınırı/kilitleme) MVP'de yok; v2 adayı.
- Frontend fazında login/logout/me endpoint'leri mock dönecek.

**Bağımlılık:** Story 6 (kayıtlı hesap gerekir).

**Boyut:** S

---

## Story 8 — Playlist'e YouTube linkiyle şarkı ekleme

### Story
As a **mekan sahibi** olarak,
YouTube linkini yapıştırarak playlist'ime şarkı eklemek istiyorum,
çünkü mekanımda oylanacak şarkı havuzunu zahmetsizce oluşturmak istiyorum.

### Kabul Kriterleri
- Panelde YouTube linki yapıştırıp ekleyince şarkı playlist'e girer; başlık ve
  küçük görsel otomatik alınır (elle bilgi girme yok).
- Yaygın YouTube link biçimleri kabul edilir (`youtube.com/watch?v=…`, `youtu.be/…`).
- YouTube linki olmayan veya video ID'si çıkarılamayan girdi anlaşılır hatayla
  reddedilir.
- Video bilgisi alınamıyorsa (silinmiş/gizli/erişilemez video) ekleme reddedilir ve
  neden gösterilir — çalınamayacak şarkı havuza girmez.
- Aynı video playlist'e ikinci kez eklenemez; "bu şarkı zaten listede" uyarısı
  gösterilir.
- Eklenen şarkı listede anında görünür (sayfa yenilemeden).
- Giriş yapmamış kullanıcı bu işlemi yapamaz.

### Technical Notes
- Metadata kaynağı: YouTube oEmbed (API key'siz — decisions.md 2026-07-11). Süre
  bilgisi gelmez ve gerekmez.
- Frontend fazında ekleme + metadata endpoint'i mock dönecek.

**Bağımlılık:** Story 7 (panele giriş).

**Boyut:** M

---

## Story 9 — Playlist'i görüntüleme ve şarkı silme

### Story
As a **mekan sahibi** olarak,
playlist'imdeki şarkıları görüp istemediklerimi silmek istiyorum,
çünkü havuzun mekanımın tarzına uygun kalmasını istiyorum.

### Kabul Kriterleri
- Panelde playlist'teki tüm şarkılar başlık ve görselle listelenir; toplam şarkı
  sayısı görünür.
- Playlist boşken yönlendirici bir boş durum ekranı gösterilir ("ilk şarkını ekle").
- Şarkı silinebilir; silmeden önce onay istenir.
- Silinen şarkı listeden anında düşer (sayfa yenilemeden).
- Silinen şarkı sonraki turlarda aday olarak çıkmaz.
- Aktif turda aday olan veya kuyrukta bekleyen şarkı da silinebilir; mevcut tur ve
  kuyruk bundan etkilenmez (aday kalır, kazanırsa çalar). Etki bir sonraki aday
  seçiminden itibaren başlar.
- Giriş yapmamış kullanıcı listeye erişemez, silme yapamaz.

**Bağımlılık:** Story 8 (eklenmiş şarkı olmalı).

**Boyut:** S

---

## Story 10 — Mekan ayarları

### Story
As a **mekan sahibi** olarak,
oylama turlarının işleyişini mekanıma göre ayarlamak istiyorum,
çünkü her mekanın temposu (yoğunluk, müşteri profili) farklıdır.

### Kabul Kriterleri
- Tur süresi ayarlanabilir (dakika; izinli aralık 2–30, varsayılan 10).
- Tur başına aday sayısı ayarlanabilir (izinli aralık 2–10, varsayılan 5).
- "Son N çalınan hariç" değeri ayarlanabilir (0–50, varsayılan 20; 0 = kural kapalı).
- Aralık dışı veya sayı olmayan değerler reddedilir; izinli aralık formda gösterilir.
- Değişiklikler bir sonraki turdan itibaren geçerli olur; aktif tur etkilenmez.
- Mekan adı güncellenebilir; slug (ve basılı QR adresi) değişmez — ad yalnızca
  görünen etikettir.
- Başarılı kayıt görünür geri bildirimle onaylanır.
- Giriş yapmamış kullanıcı ayarlara erişemez.

**Bağımlılık:** Story 7 (panele giriş).

**Boyut:** S

---

## Story 11 — QR kodunu görüntüleme ve indirme

### Story
As a **mekan sahibi** olarak,
mekanımın oylama QR kodunu görüntüleyip yazdırılabilir halde indirmek istiyorum,
çünkü masalara koyup müşterileri oylamaya davet etmek istiyorum.

### Kabul Kriterleri
- Panelde mekanın QR kodu görüntülenir (statik `/v/{slug}` adresini taşır).
- QR'ın yanında adres metin olarak da görünür.
- QR, baskıya yetecek çözünürlükte PNG olarak indirilebilir.
- İndirilen QR telefonla okutulduğunda mekanın oylama sayfası açılır.
- Giriş yapmamış kullanıcı QR sayfasına erişemez.

### Technical Notes
- MVP'de çıplak QR (PNG); tasarımlı masa kartı şablonu v2 adayı.

**Bağımlılık:** Story 6 (mekan ve slug oluşmuş olmalı).

**Boyut:** S

---

## Story 12 — Panelde canlı mekan durumu

### Story
As a **mekan sahibi** olarak,
panelde o an çalan şarkıyı, aktif turu ve sistemin sağlığını görmek istiyorum,
çünkü tezgahtan ayrılmadan her şeyin sorunsuz işlediğini doğrulamak istiyorum.

### Kabul Kriterleri
- Panel ana ekranında o an çalan şarkı görünür.
- Aktif tur varsa adaylar, canlı oy sayıları ve kalan süre görünür.
- Kuyrukta bekleyen kazanan (varsa) görünür.
- Player bağlı değilse belirgin bir uyarı gösterilir ("Player kapalı — müzik ve
  oylama durdu") ve player sayfasını açma yönlendirmesi sunulur.
- Playlist 20 şarkının altındaysa "sistem beklemede — en az 20 şarkı gerekli
  (şu an X)" uyarısı ve şarkı ekleme yönlendirmesi gösterilir (karar: 2026-07-12,
  minimum playlist boyutu).
- Tüm bilgiler sayfa yenilemeden canlı güncellenir.
- Giriş yapmamış kullanıcı erişemez.

### Technical Notes
- Canlı veriler Story 4'teki WS altyapısını paylaşır; panel de bir WS istemcisidir.
- Frontend fazında durum endpoint'i + sahte WS olayları mock dönecek.

**Bağımlılık:** Story 7 (giriş).

**Boyut:** M

---

## Story 13 — Player: aç, başlat, kendi kendine çalsın

### Story
As a **mekan sahibi** olarak,
mekan bilgisayarında player sayfasını açıp müziğin kendi kendine akmasını istiyorum,
çünkü gün boyu müzikle uğraşmadan işime bakmak istiyorum.

### Kabul Kriterleri
- Player sayfası (`/player`) mekan sahibi girişi gerektirir; giriş yapılmışsa
  mekanla otomatik ilişkilenir.
- Sayfa açıldığında tek tıkla ("Başlat") çalma başlar; sonrasında şarkılar arası
  hiçbir insan müdahalesi gerekmez.
- Şarkı bitince sıradaki otomatik çalar: kuyrukta kazanan varsa o, yoksa
  playlist'ten rastgele fallback.
- Çalan şarkının adı ve görseli ekranda görünür.
- Playlist 20 şarkının altındaysa çalma başlamaz; "en az 20 şarkı ekleyin"
  bekleme ekranı gösterilir.
- Bir video oynatılamıyorsa (silinmiş, ülke/embed kısıtı) player takılıp kalmaz —
  otomatik olarak sıradakine geçer ve sorunu sunucuya bildirir.

### Given-When-Then
Given player başlatılmış ve kuyrukta kazanan şarkı var
When çalan şarkı biter
Then kuyruktaki kazanan otomatik çalmaya başlar (ve yeni tur açılır — tur modeli)

Given çalınmak istenen video embed kısıtlı
When player videoyu oynatamaz
Then sıradaki şarkıya otomatik geçilir; müzik kesintisi en aza iner

### Technical Notes
- "Başlat" tıkı tarayıcı autoplay kısıtından zorunlu (kullanıcı etkileşimi
  olmadan sesli oynatma engelli) — tasarım tercihi değil.
- Çalma YouTube IFrame API ile; `youtube-nocookie.com` KULLANILMAZ (CLAUDE.md).
- WS protokolü: `PLAY_TRACK` / `TRACK_ENDED` / `PLAYER_STATE`
  (architecture.md → Player protokolü). Oynatılamayan video için hata bildirimi
  protokole eklenecek (ör. `TRACK_ERROR`).
- Frontend fazında WS komutları mock olay üreticiyle beslenecek.

**Bağımlılık:** Story 6–8 (hesap, giriş, playlist'te şarkı).

**Boyut:** L

---

## Story 14 — Player: kesintilerden kendi kendine toparlanma

### Story
As a **mekan sahibi** olarak,
player'ın ağ ve sayfa aksaklıklarını kendi kendine toparlamasını istiyorum,
çünkü mekanda müziğin kesilmemesi ve teknik sorunlarla uğraşmamak istiyorum.

### Kabul Kriterleri
- Sunucu bağlantısı koptuğunda çalan şarkı kesilmez; player arka planda artan
  aralıklarla yeniden bağlanmayı dener.
- Bağlantı durumu (bağlı / yeniden bağlanıyor) player ekranında görünür.
- Bağlantı kopukken çalan şarkı biterse player bekler ("bağlantı bekleniyor");
  yerel fallback çalınmaz (karar: 2026-07-12). Bağlantı kurulunca müzik devam eder.
- Yeniden bağlanınca durum senkronlanır: kopukluk sırasında şarkı bittiyse
  sıradaki şarkı alınıp çalınır.
- Sayfa yanlışlıkla yenilenirse tek "Başlat" tıkıyla kaldığı yerden devam edilir
  (kuyruk ve tur durumu sunucuda tutulduğu için kayıp olmaz).
- Player koptuğunda sunucu bunu algılar; panelde "player kapalı" uyarısı görünür
  (Story 12'nin veri kaynağı).

### Technical Notes
- Kopuk player algısı: WS bağlantı kopması + periyodik `PLAYER_STATE`
  gelmemesi (architecture.md → Player protokolü).
- Yerel fallback (offline çalmaya devam + mutabakat) bilinçli olarak MVP dışı;
  gerekirse v2.

**Bağımlılık:** Story 13 (çalışan player).

**Boyut:** M

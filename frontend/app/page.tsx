"use client";

import {
  Button,
  Card,
  Chip,
  Label,
  ProgressBar,
  Separator,
} from "@heroui/react";

const playlists = [
  {
    name: "Akşam Kodlama",
    trackCount: 42,
    mood: "Lo-fi",
    color: "accent" as const,
  },
  {
    name: "Cuma Partisi",
    trackCount: 27,
    mood: "Pop",
    color: "success" as const,
  },
  {
    name: "Odak Modu",
    trackCount: 63,
    mood: "Ambient",
    color: "warning" as const,
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-12">
      {/* Üst bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎵</span>
          <h1 className="text-xl font-semibold text-foreground">Jukebox</h1>
          <Chip color="warning" size="sm">
            Beta
          </Chip>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost">Giriş Yap</Button>
          <Button>Kayıt Ol</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-start gap-4">
        <h2 className="text-4xl font-bold text-foreground">
          Müziği birlikte seçin
        </h2>
        <p className="max-w-xl text-lg text-muted">
          Bir oda aç, arkadaşlarını davet et; şarkıları kuyruğa herkes eklesin,
          sıradaki parçaya birlikte karar verin.
        </p>
        <div className="flex gap-3">
          <Button size="lg" onPress={() => console.log("oda oluştur")}>
            Oda Oluştur
          </Button>
          <Button size="lg" variant="outline">
            Odaya Katıl
          </Button>
        </div>
      </section>

      <Separator />

      {/* Şimdi çalıyor */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
          Şimdi Çalıyor
        </h3>
        <Card variant="tertiary">
          <Card.Header>
            <Card.Title>Bohemian Rhapsody</Card.Title>
            <Card.Description>Queen · A Night at the Opera</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <ProgressBar aria-label="Şarkı ilerlemesi" value={38}>
              <Label>2:14</Label>
              <ProgressBar.Output />
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <div className="flex items-center gap-2">
              <Button isIconOnly aria-label="Önceki şarkı" variant="ghost">
                ⏮
              </Button>
              <Button isIconOnly aria-label="Oynat / Duraklat">
                ▶
              </Button>
              <Button isIconOnly aria-label="Sonraki şarkı" variant="ghost">
                ⏭
              </Button>
              <Chip className="ml-auto" color="accent" size="sm">
                3 kişi dinliyor
              </Chip>
            </div>
          </Card.Content>
        </Card>
      </section>

      {/* Çalma listeleri */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-muted uppercase">
            Çalma Listeleri
          </h3>
          <Button size="sm" variant="secondary">
            + Yeni Liste
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.name}>
              <Card.Header>
                <Card.Title>{playlist.name}</Card.Title>
                <Card.Description>
                  {playlist.trackCount} şarkı
                </Card.Description>
              </Card.Header>
              <Card.Footer className="flex items-center justify-between">
                <Chip color={playlist.color} size="sm" variant="soft">
                  {playlist.mood}
                </Chip>
                <Button size="sm" variant="ghost">
                  Çal
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

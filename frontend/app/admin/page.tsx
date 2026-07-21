import { Card } from "@heroui/react";

import { NowPlayingCard } from "@/features/admin/components/NowPlayingCard";

function cover(hue: number) {
  return `linear-gradient(135deg, oklch(66% 0.05 ${hue}), oklch(40% 0.06 ${hue}))`;
}

const nowPlaying = {
  youtubeId: "CeTjSfAFcFQ",
};

const candidates = [
  { id: 1, title: "Bu Ev Bizim", channel: "Adamlar", votes: 14, hue: 60 },
  { id: 2, title: "Gesi Bağları", channel: "Anatolian Sessions", votes: 11, hue: 150 },
  { id: 3, title: "Süpürgesi Yoncadan", channel: "Altın Gün", votes: 8, hue: 250 },
  { id: 4, title: "Dağlar Dağlar", channel: "Barış Manço", votes: 5, hue: 30 },
  { id: 5, title: "Gel", channel: "Mabel Matiz", votes: 3, hue: 330 },
].sort((a, b) => b.votes - a.votes);

const queue = [
  { title: "Uç Uç", channel: "Gaye Su Akyol", hue: 200 },
  { title: "Sandık", channel: "Ezginin Günlüğü", hue: 20 },
  { title: "Ay Tenli Kadın", channel: "Bülent Ortaçgil", hue: 280 },
];

const todayStats = [
  { label: "oy", value: 142 },
  { label: "tur", value: 18 },
  { label: "cihaz", value: 37 },
];

const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
const maxVotes = Math.max(...candidates.map((c) => c.votes), 1);

export default function AdminOverviewPage() {
  return (
    <div className="flex w-full flex-col gap-4 p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Genel Bakış</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          Yayında
        </span>
        <div className="flex-1" />
        <span className="text-sm text-muted">
          Yeni tur: <b className="font-semibold tabular-nums text-foreground">4:14</b>
        </span>
      </div>

      <NowPlayingCard youtubeId={nowPlaying.youtubeId} />


      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Card className="px-5.5 py-5">
          <div className="mb-4 flex items-baseline gap-2.5">
            <span className="text-base font-semibold">Aktif tur</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              canlı
            </span>
            <div className="flex-1" />
            <span className="text-xs text-muted">{totalVotes} oy</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {candidates.map((candidate, index) => (
              <div key={candidate.id} className="flex items-center gap-3">
                <div
                  className="size-9 shrink-0 rounded-lg"
                  style={{ background: cover(candidate.hue) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span
                      className={`truncate text-sm ${index === 0 ? "font-semibold" : "font-medium"}`}
                    >
                      {candidate.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{candidate.channel}</span>
                    <div className="flex-1" />
                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums ${
                        index === 0 ? "text-accent" : "text-muted"
                      }`}
                    >
                      {candidate.votes}
                    </span>
                  </div>
                  <div className="h-1.25 overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className={`h-full rounded-full ${index === 0 ? "bg-accent" : "bg-muted"}`}
                      style={{ width: `${Math.max(Math.round((candidate.votes / maxVotes) * 100), 5)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="px-5.5 py-5">
            <div className="mb-3.5 text-base font-semibold">Kuyruk</div>
            <div className="flex flex-col gap-3">
              {queue.map((track, index) => (
                <div key={track.title} className="flex items-center gap-2.75">
                  <span className="w-3.5 text-xs text-muted tabular-nums">{index + 1}</span>
                  <div
                    className="size-7.5 shrink-0 rounded-md"
                    style={{ background: cover(track.hue) }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="text-xs text-muted">{track.channel}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="px-5.5 py-5">
            <div className="mb-3.5 text-base font-semibold">Bugün</div>
            <div className="grid grid-cols-3 gap-2.5">
              {todayStats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-xl font-bold tabular-nums">{stat.value}</div>
                  <div className="text-xs text-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

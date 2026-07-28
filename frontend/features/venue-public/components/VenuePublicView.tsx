"use client";

import { Chip, Skeleton, Tabs } from "@heroui/react";
import NumberFlow from "@number-flow/react";
import { ArrowDown, ArrowUp, ListMusic, Music2, Vote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { PublicCandidate } from "@/features/venue-public/api/roundPublicApi";
import { useActiveRoundPublic } from "@/features/venue-public/hooks/useActiveRoundPublic";
import { useNowPlayingVideoInfo } from "@/features/venue-public/hooks/useNowPlayingVideoInfo";
import { useQueuePublic } from "@/features/venue-public/hooks/useQueuePublic";
import { useVenuePublic } from "@/features/venue-public/hooks/useVenuePublic";

type RankDirection = "up" | "down";

// useRankChanges, orderedCandidates'ın sırası değiştiğinde hangi adayın
// yukarı/aşağı hareket ettiğini bir süreliğine işaretler — kart yanındaki
// yeşil/kırmızı ok göstergesi için kullanılıyor (bkz. admin ActiveRoundCard).
function useRankChanges(orderedYoutubeIds: string[]) {
  const previousRanksRef = useRef<Record<string, number> | null>(null);
  const [directions, setDirections] = useState<Record<string, RankDirection>>({});

  useEffect(() => {
    const previousRanks = previousRanksRef.current;
    const nextRanks: Record<string, number> = {};
    orderedYoutubeIds.forEach((youtubeId, position) => {
      nextRanks[youtubeId] = position;
    });

    const applyDiff = () => {
      if (!previousRanks) return;

      const nextDirections: Record<string, RankDirection> = {};
      for (const youtubeId of orderedYoutubeIds) {
        const previousPosition = previousRanks[youtubeId];
        const nextPosition = nextRanks[youtubeId];
        if (previousPosition !== undefined && previousPosition !== nextPosition) {
          nextDirections[youtubeId] = nextPosition < previousPosition ? "up" : "down";
        }
      }

      if (Object.keys(nextDirections).length > 0) {
        setDirections(nextDirections);
      }
    };
    applyDiff();

    previousRanksRef.current = nextRanks;

    const clear = () => setDirections({});
    const timeout = setTimeout(clear, 700);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedYoutubeIds.join("|")]);

  return directions;
}

function useCountdown(endsAt: Date | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;

    const tick = () => setNow(Date.now());
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return endsAt ? Math.max(0, endsAt.getTime() - now) : 0;
}

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VenuePublicView({ slug }: { slug: string }) {
  const venue = useVenuePublic(slug);
  const queue = useQueuePublic(slug);
  const round = useActiveRoundPublic(slug);
  const remainingMs = useCountdown(round.data?.endsAt);

  if (venue.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
        <Skeleton className="mx-auto aspect-square w-1/2 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (venue.isError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2 p-8 text-center">
        <Music2 className="size-8 text-muted" />
        <div className="text-sm font-medium">Mekan bulunamadı</div>
        <div className="text-xs text-muted">Bağlantıyı kontrol et veya QR kodu tekrar okut.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <div className="pt-2 text-center text-xl font-semibold">{venue.data.name}</div>

      <NowPlayingSection youtubeId={venue.data.nowPlaying} />

      <Tabs className="w-full">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Mekan sekmeleri" className="w-full">
            <Tabs.Tab id="round" className="flex-1 justify-center gap-1.5">
              <Vote className="size-4" />
              Oylama
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="queue" className="flex-1 justify-center gap-1.5">
              <ListMusic className="size-4" />
              Sıra
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="round" className="flex flex-col gap-3.5 pt-4">
          {round.data && (
            <div className="flex items-center justify-end">
              <div className="rounded-full bg-surface-tertiary px-3 py-1 text-sm font-bold tabular-nums">
                {remainingMs <= 0 ? "Bitiyor..." : formatCountdown(remainingMs)}
              </div>
            </div>
          )}

          {round.isPending && (
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          )}

          {!round.isPending && !round.data && (
            <div className="py-8 text-center text-sm text-muted">Şu an aktif oylama yok.</div>
          )}

          {round.data && (
            <AnimatedCandidateList roundId={round.data.id} candidates={round.data.candidates} />
          )}
        </Tabs.Panel>

        <Tabs.Panel id="queue" className="flex flex-col gap-3.5 pt-4">
          {queue.isPending && (
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          )}

          {queue.data && queue.data.tracks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted">Kuyrukta şarkı yok.</div>
          )}

          {queue.data && queue.data.tracks.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {queue.data.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 rounded-lg bg-surface-tertiary px-3 py-2"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-semibold text-muted tabular-nums">
                    {index + 1}
                  </span>
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-surface-secondary">
                    <Image
                      src={`https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`}
                      alt={track.title}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{track.title}</div>
                    <div className="truncate text-xs text-muted">{track.channel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

function AnimatedCandidateList({
  roundId,
  candidates,
}: {
  roundId: string;
  candidates: PublicCandidate[];
}) {
  // Test amaçlı, sadece frontend'de yaşayan oy sayacı — backend'e hiçbir
  // şey göndermiyor, cihaz başına 1 oy sınırı henüz uygulanmıyor (bkz.
  // admin ActiveRoundCard'daki aynı desen). Round değişince sıfırlanır.
  const [votedRoundId, setVotedRoundId] = useState(roundId);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});

  if (roundId !== votedRoundId) {
    setVotedRoundId(roundId);
    setLocalVotes({});
  }

  function handleVote(youtubeId: string) {
    setLocalVotes((prev) => ({ ...prev, [youtubeId]: (prev[youtubeId] ?? 0) + 1 }));
  }

  const orderedCandidates = candidates
    .map((candidate, index) => ({
      ...candidate,
      votes: candidate.votes + (localVotes[candidate.youtubeId] ?? 0),
      index,
    }))
    .sort((a, b) => b.votes - a.votes || a.index - b.index);

  const rankDirections = useRankChanges(orderedCandidates.map((candidate) => candidate.youtubeId));

  return (
    <div className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {orderedCandidates.map((candidate, position) => {
          const isFirst = position === 0;
          const rankDirection = rankDirections[candidate.youtubeId];

          return (
            <motion.button
              key={candidate.youtubeId}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 40, mass: 1 }}
              type="button"
              onClick={() => handleVote(candidate.youtubeId)}
              whileTap={{ scale: 0.97 }}
              style={{ position: "relative", zIndex: isFirst ? 1 : 0 }}
              className={
                isFirst
                  ? "flex items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 px-3 py-2.5 text-left transition-colors hover:bg-accent/15"
                  : "flex items-center gap-3 rounded-lg bg-surface-tertiary px-3 py-2 text-left transition-colors hover:bg-surface-secondary"
              }
            >
              <div
                className={
                  isFirst
                    ? "relative size-13 shrink-0 overflow-hidden rounded-md ring-2 ring-accent"
                    : "relative size-11 shrink-0 overflow-hidden rounded-md bg-surface-secondary"
                }
              >
                <Image
                  src={`https://img.youtube.com/vi/${candidate.youtubeId}/mqdefault.jpg`}
                  alt={candidate.title}
                  fill
                  className="object-cover"
                  sizes="52px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className={isFirst ? "truncate text-base font-semibold" : "truncate text-sm font-medium"}>
                  {candidate.title}
                </div>
                <div className="truncate text-xs text-muted">{candidate.channel}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <AnimatePresence>
                  {rankDirection ? (
                    <motion.span
                      key="rank-indicator"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={rankDirection === "up" ? "text-green-500" : "text-red-500"}
                    >
                      {rankDirection === "up" ? (
                        <ArrowUp className="size-4" />
                      ) : (
                        <ArrowDown className="size-4" />
                      )}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
                <Chip color={isFirst ? "accent" : "default"}>
                  <NumberFlow value={candidate.votes} className="tabular-nums" />
                </Chip>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function NowPlayingSection({ youtubeId }: { youtubeId: string }) {
  const videoInfo = useNowPlayingVideoInfo(youtubeId);

  if (!youtubeId) {
    return (
      <div className="mx-auto flex aspect-square w-1/2 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-tertiary text-center">
        <Music2 className="size-8 text-muted" />
        <div className="text-sm font-medium">Çalan şarkı yok</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative mx-auto aspect-square w-1/2 overflow-hidden rounded-2xl bg-surface-tertiary shadow-md">
        <Image
          src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
          alt={videoInfo.data?.title ?? ""}
          fill
          className="object-cover"
          sizes="224px"
        />
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-accent">Şu an çalıyor</div>
        {videoInfo.isPending ? (
          <div className="mt-1.5 flex flex-col items-center gap-1.5">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
        ) : (
          <>
            <div className="truncate text-lg font-semibold">{videoInfo.data?.title ?? "—"}</div>
            <div className="truncate text-sm text-muted">{videoInfo.data?.channel ?? ""}</div>
          </>
        )}
      </div>
    </div>
  );
}

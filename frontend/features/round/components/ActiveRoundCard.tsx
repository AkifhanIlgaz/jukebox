"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { Crown, Vote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useActiveRound } from "@/features/round/hooks/useActiveRound";
import { useStartRound } from "@/features/round/hooks/useStartRound";

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

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ActiveRoundCard() {
  const { data: round, isLoading } = useActiveRound();
  const startRoundMutation = useStartRound();
  const remainingMs = useCountdown(round?.endsAt);

  // Test amaçlı, sadece frontend'de yaşayan oy sayacı — backend'e hiçbir
  // şey göndermiyor. Round değişince (yeni tur açılınca) sıfırlanması
  // gerekiyor; bunu effect içinde değil, render sırasında (React'ın "prop
  // değişince state sıfırlama" deseni) yapıyoruz.
  const [votedRoundId, setVotedRoundId] = useState(round?.id);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});

  if (round && round.id !== votedRoundId) {
    setVotedRoundId(round.id);
    setLocalVotes({});
  }

  const orderedCandidates = round
    ? [...round.candidates]
        .map((candidate, index) => ({
          ...candidate,
          votes: candidate.votes + (localVotes[candidate.youtubeId] ?? 0),
          index,
        }))
        .sort((a, b) => b.votes - a.votes || a.index - b.index)
    : [];

  function handleVote(youtubeId: string) {
    setLocalVotes((prev) => ({ ...prev, [youtubeId]: (prev[youtubeId] ?? 0) + 1 }));
  }

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 px-5.5 py-8 text-center">
        <Spinner size="md" />
        <div className="text-sm font-medium">Oylama durumu yükleniyor...</div>
      </Card>
    );
  }

  if (!round) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 px-5.5 py-8 text-center">
        <Vote className="size-8 text-muted" />
        <div className="text-sm font-medium">Aktif oylama yok</div>
        <div className="text-xs text-muted">Müşterilerin oy verebilmesi için yeni bir tur başlat.</div>
        <Button
          className="mt-2"
          variant="primary"
          isDisabled={startRoundMutation.isPending}
          onPress={() => startRoundMutation.mutate()}
        >
          {startRoundMutation.isPending ? "Başlatılıyor..." : "Oylama başlat"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="px-5.5 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">Aktif Oylama</div>
          <div className="text-xs text-muted">{round.candidates.length} aday şarkı</div>
        </div>
        <div className="shrink-0 rounded-full bg-surface-tertiary px-3 py-1 text-sm font-bold tabular-nums">
          {remainingMs <= 0 ? "Bitiyor..." : formatCountdown(remainingMs)}
        </div>
      </div>
      <Card.Content className="mt-3.5 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {orderedCandidates.map((candidate, position) => {
            const isFirst = position === 0;

            return (
              <motion.button
                key={candidate.youtubeId}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 40, mass: 1 }}
                type="button"
                onClick={() => handleVote(candidate.youtubeId)}
                style={{ position: "relative", zIndex: isFirst ? 1 : 0 }}
                className={
                  isFirst
                    ? "flex items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-accent/15"
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
                  {isFirst ? (
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-accent/90 py-0.5">
                      <Crown className="size-3 text-white" />
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={isFirst ? "truncate text-base font-bold" : "truncate text-sm font-semibold"}>
                    {candidate.title}
                  </div>
                  <div className="truncate text-xs text-muted">{candidate.channel}</div>
                </div>
                <div
                  className={
                    isFirst ? "shrink-0 text-xl font-bold tabular-nums text-accent" : "shrink-0 text-base font-bold tabular-nums"
                  }
                >
                  {candidate.votes}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </Card.Content>
    </Card>
  );
}

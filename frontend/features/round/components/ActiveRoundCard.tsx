"use client";

import { AlertDialog, Button, Card, Spinner } from "@heroui/react";
import NumberFlow from "@number-flow/react";
import { ArrowDown, ArrowUp, Crown, SquareX, Vote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useActiveRound } from "@/features/round/hooks/useActiveRound";
import { useCloseRound } from "@/features/round/hooks/useCloseRound";
import { useStartRound } from "@/features/round/hooks/useStartRound";

type RankDirection = "up" | "down";

// useRankChanges, orderedCandidates'ın sırası değiştiğinde hangi adayın
// yukarı/aşağı hareket ettiğini bir süreliğine işaretler — kart yanındaki
// yeşil/kırmızı ok göstergesi için kullanılıyor.
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

function Countdown({ remainingMs }: { remainingMs: number }) {
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className="flex items-center tabular-nums">
      <NumberFlow value={minutes} />
      <span>:</span>
      <NumberFlow value={seconds} format={{ minimumIntegerDigits: 2 }} />
    </span>
  );
}

export function ActiveRoundCard() {
  const { data: round, isLoading } = useActiveRound();
  const startRoundMutation = useStartRound();
  const closeRoundMutation = useCloseRound();
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

  const rankDirections = useRankChanges(orderedCandidates.map((candidate) => candidate.youtubeId));

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
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-full bg-surface-tertiary px-3 py-1 text-sm font-bold tabular-nums">
            {remainingMs <= 0 ? "Bitiyor..." : <Countdown remainingMs={remainingMs} />}
          </div>
          <AlertDialog>
            <Button
              variant="danger-soft"
              size="sm"
              isIconOnly
              aria-label="Oylamayı kapat"
              isDisabled={closeRoundMutation.isPending}
            >
              <SquareX className="size-4" />
            </Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog className="sm:max-w-[400px]">
                  <AlertDialog.CloseTrigger />
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>Oylamayı kapat?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p>
                      Aktif oylama turu kazanan seçilmeden kapatılacak ve oylar silinecek. Yeni bir
                      tur açmak için tekrar &quot;Oylama başlat&quot; demen gerekecek.
                    </p>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Vazgeç
                    </Button>
                    <Button slot="close" variant="danger" onPress={() => closeRoundMutation.mutate()}>
                      Kapat
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>
      </div>
      <Card.Content className="mt-3.5 flex flex-col gap-2">
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
                <NumberFlow
                  value={candidate.votes}
                  className={
                    isFirst
                      ? "shrink-0 text-xl font-bold tabular-nums text-accent"
                      : "shrink-0 text-base font-bold tabular-nums"
                  }
                />
                <AnimatePresence>
                  {rankDirection ? (
                    <motion.span
                      key="rank-indicator"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={
                        rankDirection === "up"
                          ? "absolute -right-5 top-1/2 -translate-y-1/2 text-green-500"
                          : "absolute -right-5 top-1/2 -translate-y-1/2 text-red-500"
                      }
                    >
                      {rankDirection === "up" ? (
                        <ArrowUp className="size-4" />
                      ) : (
                        <ArrowDown className="size-4" />
                      )}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </Card.Content>
    </Card>
  );
}

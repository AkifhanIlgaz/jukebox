"use client";

import { Skeleton } from "@heroui/react";
import { Vote } from "lucide-react";
import { useState } from "react";

import { CandidateList } from "@/features/round/components/CandidateList";
import { Countdown } from "@/features/round/components/Countdown";
import { useCountdown } from "@/features/round/hooks/useCountdown";
import type { PublicRound } from "@/features/venue-public/api/roundPublicApi";

// RoundVotingPanel, müşteri /v/{slug} sayfasındaki oylama sekmesi. Backend'e
// henüz gerçek bir oy isteği atmıyor — localVotes, oy API'si gelene kadar
// sadece frontend'de yaşayan bir yer tutucu (cihaz başına 1 oy sınırı da
// henüz uygulanmıyor, bkz. CLAUDE.md).
export function RoundVotingPanel({
  round,
  isPending,
}: {
  round: PublicRound | null | undefined;
  isPending: boolean;
}) {
  const remainingMs = useCountdown(round?.endsAt);
  const [votedRoundId, setVotedRoundId] = useState(round?.id);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});

  if (round && round.id !== votedRoundId) {
    setVotedRoundId(round.id);
    setLocalVotes({});
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-surface-tertiary">
          <Vote className="size-6 animate-pulse text-muted/50" strokeWidth={1.5} />
        </div>
        <div className="text-sm font-semibold text-muted">Şu an aktif oylama yok</div>
        <div className="text-sm text-muted/70">Yeni tur başladığında adaylar burada listelenecek</div>
      </div>
    );
  }

  const candidates = round.candidates.map((candidate) => ({
    ...candidate,
    votes: candidate.votes + (localVotes[candidate.youtubeId] ?? 0),
  }));

  function handleVote(youtubeId: string) {
    setLocalVotes((prev) => ({ ...prev, [youtubeId]: (prev[youtubeId] ?? 0) + 1 }));
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-end">
        <div className="rounded-full bg-surface-tertiary px-3 py-1 text-sm font-bold tabular-nums">
          {remainingMs <= 0 ? "Bitiyor..." : <Countdown remainingMs={remainingMs} />}
        </div>
      </div>
      <CandidateList candidates={candidates} isVotable onVote={handleVote} />
    </div>
  );
}

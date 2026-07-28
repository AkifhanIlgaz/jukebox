"use client";

import { useEffect, useRef, useState } from "react";

type RankDirection = "up" | "down";

// useRankChanges, sıralı youtubeId listesinin sırası değiştiğinde hangi
// adayın yukarı/aşağı hareket ettiğini bir süreliğine işaretler — kart
// yanındaki yeşil/kırmızı ok göstergesi için kullanılıyor (bkz.
// features/round/components/CandidateList).
export function useRankChanges(orderedYoutubeIds: string[]) {
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

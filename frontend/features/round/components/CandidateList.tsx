"use client";

import { Chip } from "@heroui/react";
import NumberFlow from "@number-flow/react";
import { ArrowDown, ArrowUp, Crown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";

import { useRankChanges } from "@/features/round/hooks/useRankChanges";

export type CandidateListItem = {
  youtubeId: string;
  title: string;
  channel: string;
  votes: number;
};

const springTransition = { type: "spring", stiffness: 500, damping: 40, mass: 1 } as const;

// CandidateList, admin (ActiveRoundCard) ve müşteri (RoundVotingPanel)
// tarafında aynı görünümle kullanılan oylama adayları listesi. isVotable
// false'ken (admin) satırlar salt-okunur — admin oy veremez, sadece anlık
// durumu izler; true'yken (müşteri) satıra tıklamak onVote'u tetikler.
export function CandidateList({
  candidates,
  isVotable,
  onVote,
}: {
  candidates: CandidateListItem[];
  isVotable: boolean;
  onVote?: (youtubeId: string) => void;
}) {
  const orderedCandidates = candidates
    .map((candidate, index) => ({ ...candidate, index }))
    .sort((a, b) => b.votes - a.votes || a.index - b.index);

  const rankDirections = useRankChanges(orderedCandidates.map((candidate) => candidate.youtubeId));

  return (
    <div className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {orderedCandidates.map((candidate, position) => {
          const isFirst = position === 0;
          const rankDirection = rankDirections[candidate.youtubeId];
          const className = isFirst
            ? `flex items-center gap-3 rounded-lg border-2 border-accent bg-accent/10 px-3 py-2.5 text-left transition-colors${isVotable ? " hover:bg-accent/15" : ""}`
            : `flex items-center gap-3 rounded-lg bg-surface-tertiary px-3 py-2 text-left transition-colors${isVotable ? " hover:bg-surface-secondary" : ""}`;

          const content = (
            <>
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
            </>
          );

          return isVotable ? (
            <motion.button
              key={candidate.youtubeId}
              layout
              transition={springTransition}
              type="button"
              onClick={() => onVote?.(candidate.youtubeId)}
              whileTap={{ scale: 0.97 }}
              style={{ position: "relative", zIndex: isFirst ? 1 : 0 }}
              className={className}
            >
              {content}
            </motion.button>
          ) : (
            <motion.div
              key={candidate.youtubeId}
              layout
              transition={springTransition}
              style={{ position: "relative", zIndex: isFirst ? 1 : 0 }}
              className={className}
            >
              {content}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

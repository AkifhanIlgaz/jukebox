"use client";

import NumberFlow from "@number-flow/react";

export function Countdown({ remainingMs }: { remainingMs: number }) {
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

"use client";

import { useEffect, useState } from "react";

export function useCountdown(endsAt: Date | undefined) {
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

"use client";

import { useEffect, useRef } from "react";

type Envelope = { type: string; payload: unknown };

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

// useEnvelopeSocket, backend/internal/ws paketinin ortak zarf protokolüyle
// ({type, payload}) konuşan WS bağlantılarının (player/customer) ortak alt
// yapısı. url null olduğu sürece bağlantı açılmaz. Bağlantı beklenmedik
// şekilde koparsa (server yeniden başlatıldı, ağ hıçkırığı vb.) exponential
// backoff ile (1sn'den başlayıp 30sn'de tavan yaparak) otomatik yeniden
// dener; başarılı bir açılışta gecikme sıfırlanır.
export function useEnvelopeSocket(url: string | null, onMessage: (envelope: Envelope) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!url) return;

    let stopped = false;
    let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const socket = new WebSocket(url as string);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        onMessageRef.current(JSON.parse(event.data));
      };

      socket.onopen = () => {
        reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
      };

      socket.onclose = () => {
        if (stopped) return;
        reconnectTimeout = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimeout);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [url]);

  function send(type: string, payload: unknown) {
    socketRef.current?.send(JSON.stringify({ type, payload }));
  }

  return { send };
}

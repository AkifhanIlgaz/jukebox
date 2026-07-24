import { useEffect, useRef, useState } from "react";

import { youtubeApi } from "@/features/admin/api/youtube-api";

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
};

type YouTubePlayerEvent = { target: YouTubePlayer; data?: number };

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: {
            onReady?: (event: YouTubePlayerEvent) => void;
            onStateChange?: (event: YouTubePlayerEvent) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; CUED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeIframeApi() {
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiLoadPromise;
}

export function useYouTubePlayer(youtubeId: string | null, options?: { onEnded?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const onEndedRef = useRef(options?.onEnded);
  useEffect(() => {
    onEndedRef.current = options?.onEnded;
  }, [options?.onEnded]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);

  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;
    youtubeApi.fetchVideoInfo(youtubeId).then((info) => {
      if (cancelled) return;
      setTitle(info.title);
      setChannel(info.channel);
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeId]);

  // Creates the player on the first video and reuses it afterwards, loading
  // (and autoplaying) any later video through loadVideoById instead of
  // tearing down and recreating the iframe.
  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;

    if (!playerRef.current) {
      loadYouTubeIframeApi().then(() => {
        if (cancelled || !mountRef.current || !window.YT) return;

        loadedVideoIdRef.current = youtubeId;
        playerRef.current = new window.YT.Player(mountRef.current, {
          videoId: youtubeId,
          playerVars: { autoplay: 1, controls: 0, disablekb: 1, modestbranding: 1 },
          events: {
            onReady: (event) => {
              setDuration(event.target.getDuration());
            },
            onStateChange: (event) => {
              const playing = event.data === window.YT?.PlayerState.PLAYING;
              setIsPlaying(playing);
              if (playing || event.data === window.YT?.PlayerState.CUED) {
                setDuration(event.target.getDuration());
              }
              if (event.data === window.YT?.PlayerState.ENDED) {
                onEndedRef.current?.();
              }
            },
          },
        });
      });
    } else if (loadedVideoIdRef.current !== youtubeId) {
      loadedVideoIdRef.current = youtubeId;
      playerRef.current.loadVideoById(youtubeId);
      setCurrentTime(0);
    }

    return () => {
      cancelled = true;
    };
  }, [youtubeId]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || isSeeking) return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player) setCurrentTime(player.getCurrentTime());
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking]);

  function handleSeek(value: number) {
    setIsSeeking(true);
    setCurrentTime(value);
  }

  function handleSeekEnd(value: number) {
    playerRef.current?.seekTo(value, true);
    setCurrentTime(value);
    setIsSeeking(false);
  }

  function togglePlayback() {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (isMuted) player.unMute();
    else player.mute();
    setIsMuted(!isMuted);
  }

  return {
    mountRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    title,
    channel,
    handleSeek,
    handleSeekEnd,
    togglePlayback,
    toggleMute,
  };
}

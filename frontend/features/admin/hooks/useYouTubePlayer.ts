import { useEffect, useRef, useState } from "react";

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
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
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
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

async function fetchOEmbed(youtubeId: string) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${youtubeId}`,
  )}&format=json`;
  const response = await fetch(url);
  const data: { title: string; author_name: string } = await response.json();
  return { title: data.title, channel: data.author_name };
}

export function useYouTubePlayer(youtubeId: string) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [channel, setChannel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOEmbed(youtubeId).then((info) => {
      if (cancelled) return;
      setTitle(info.title);
      setChannel(info.channel);
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeId]);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !mountRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId: youtubeId,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1 },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration());
          },
          onStateChange: (event) => {
            const playing = event.data === window.YT?.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (playing) setDuration(event.target.getDuration());
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [youtubeId]);

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

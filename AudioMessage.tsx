import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function AudioMessage({
  src,
  duration: durationProp = 30,
  autoPlay = false,
  onEnded,
}: {
  src?: string;
  duration?: number;
  autoPlay?: boolean;
  onEnded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationProp);
  const triedAutoplayRef = useRef(false);

  // Stable pseudo-random waveform bars
  const bars = useMemo(() => {
    const n = 34;
    return Array.from({ length: n }, (_, i) => {
      const v = 0.35 + Math.abs(Math.sin(i * 1.7) * 0.5) + Math.abs(Math.cos(i * 0.9)) * 0.25;
      return Math.min(1, v);
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const onTime = () => {
      if (audio?.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onMeta = () => {
      if (audio?.duration && isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      onEnded?.();
    };
    if (audio) {
      audio.addEventListener("timeupdate", onTime);
      audio.addEventListener("loadedmetadata", onMeta);
      audio.addEventListener("ended", onEnd);
    }

    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let fallbackStart = 0;
    let fallbackDuration = durationProp;
    let endedFired = false;
    let unlockHandler: (() => void) | null = null;

    const startFallback = () => {
      if (fallbackInterval) return;
      fallbackStart = Date.now();
      setPlaying(true);
      fallbackInterval = setInterval(() => {
        const elapsed = (Date.now() - fallbackStart) / 1000;
        const p = Math.min(1, elapsed / fallbackDuration);
        setProgress(p);
        if (p >= 1) {
          if (fallbackInterval) clearInterval(fallbackInterval);
          fallbackInterval = null;
          setPlaying(false);
          setProgress(0);
          if (!endedFired) {
            endedFired = true;
            onEnded?.();
          }
        }
      }, 100);
    };

    const stopFallback = () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
        fallbackInterval = null;
      }
    };

    if (autoPlay && !triedAutoplayRef.current) {
      triedAutoplayRef.current = true;
      const tryPlay = audio ? audio.play() : Promise.reject(new Error("no audio"));
      Promise.resolve(tryPlay)
        .then(() => {
          setPlaying(true);
          stopFallback();
        })
        .catch(() => {
          // Autoplay blocked or no source — animate progress synthetically so flow continues.
          if (audio?.duration && isFinite(audio.duration)) fallbackDuration = audio.duration;
          startFallback();
          // If the user interacts later, try real playback.
          unlockHandler = () => {
            if (!audio) return;
            audio.play().then(() => {
              stopFallback();
              setProgress(audio.currentTime / (audio.duration || fallbackDuration));
              setPlaying(true);
            }).catch(() => {});
          };
          window.addEventListener("pointerdown", unlockHandler, { once: true });
          window.addEventListener("keydown", unlockHandler, { once: true });
        });
    }

    return () => {
      if (audio) {
        audio.removeEventListener("timeupdate", onTime);
        audio.removeEventListener("loadedmetadata", onMeta);
        audio.removeEventListener("ended", onEnd);
      }
      stopFallback();
      if (unlockHandler) {
        window.removeEventListener("pointerdown", unlockHandler);
        window.removeEventListener("keydown", unlockHandler);
      }
    };
  }, [autoPlay, onEnded, durationProp]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const playedIdx = Math.floor(progress * bars.length);

  return (
    <div className="flex w-[250px] items-center gap-3 py-1">
      {src && <audio ref={audioRef} src={src} preload="metadata" />}
      <button
        onClick={toggle}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-purple)] to-[var(--chat-header)] text-white shadow-md transition active:scale-95"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <div className="flex-1">
        <div className="flex h-7 items-center gap-[2px]">
          {bars.map((h, i) => {
            const played = i <= playedIdx;
            return (
              <span
                key={i}
                className={`block w-[3px] rounded-full ${played ? "bg-[var(--brand-purple)]" : "bg-chat-text-bot/25"} ${playing && i === playedIdx ? "wave-bar" : ""}`}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            );
          })}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-chat-text-bot/55">
          <span>{fmt(progress * duration)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Scene = {
  id: string;
  title: string;
  visualClass: string;
  duration: number;
  narration: string;
  subtitle: string;
  caption: string;
  accent?: "red";
};

const SCENES: Scene[] = [
  {
    id: "house",
    title: "वह पुराना घर",
    visualClass: "scene-house",
    duration: 22000,
    narration:
      "जंगल की आख़िरी साँसों पर ठहरा वह हवेली... कहते हैं उसकी दीवारों ने किसी की चीख़ को निगल लिया था। आज रात, वह चीख़ मुझे पुकार रही है।",
    subtitle:
      "That forsaken mansion, lingering on the forest's final breath... they say its walls swallowed a scream. Tonight, that scream calls for me.",
    caption: "Deep night breathes through rotten beams suspended over fog.",
  },
  {
    id: "doll",
    title: "टूटी गुड़िया",
    visualClass: "scene-doll",
    duration: 19000,
    narration:
      "धूल भरे बरामदे में सिर्फ़ यह गुड़िया बची है। इसकी आँखें धुँधली नहीं... मुझे देख रही हैं। उसकी गर्दन में फँसी दरार किसी के दबे सुबकने जैसी चटकती है।",
    subtitle:
      "Only this doll survives the dust-choked hall. Its eyes aren’t dull... they are watching me. The crack in its neck snaps like a smothered sob.",
    caption:
      "Oil lamp stutters; porcelain skin gleams; the world inhales and forgets to exhale.",
    accent: "red",
  },
  {
    id: "presence",
    title: "सीढ़ियों का साया",
    visualClass: "scene-presence",
    duration: 19000,
    narration:
      "मैं पीछे हटता हूँ, हर पायदान पर कदम उलझते हैं। धुंधले में—लाल आँखों वाला लम्बा परछाईं... वह दौड़ नहीं रहा, बस इंतज़ार कर रहा है। और मैं उसके इंतज़ार में गिर रहा हूँ।",
    subtitle:
      "I retreat, feet snared by every stair. In the blur—a tall shadow with red eyes... it does not chase, it only waits. And I tumble into its patience.",
    caption: "Gravity falters; the void below the staircase opens like a mouth.",
  },
];

const TOTAL_DURATION = SCENES.reduce((sum, scene) => sum + scene.duration, 0);

const computeSceneIndex = (time: number) => {
  let accumulated = 0;
  for (let i = 0; i < SCENES.length; i += 1) {
    accumulated += SCENES[i]!.duration;
    if (time < accumulated) {
      return i;
    }
  }
  return SCENES.length - 1;
};

const formatTime = (time: number) => {
  const seconds = Math.floor(time / 1000);
  return `${seconds.toString().padStart(2, "0")}s`;
};

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [narrating, setNarrating] = useState(false);

  const animationFrame = useRef<number | null>(null);
  const spokenScene = useRef<number>(-1);
  const audioContext = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const heartbeatTimer = useRef<number | null>(null);
  const metallicTimer = useRef<number | null>(null);

  const progress = useMemo(
    () => Math.min(1, elapsed / TOTAL_DURATION),
    [elapsed],
  );

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      return;
    }

    const start = performance.now() - elapsed;

    const update = () => {
      const now = performance.now();
      const nextElapsed = Math.min(now - start, TOTAL_DURATION);
      setElapsed(nextElapsed);
      setSceneIndex((prev) => {
        const nextIndex = computeSceneIndex(nextElapsed);
        return prev === nextIndex ? prev : nextIndex;
      });

      if (nextElapsed >= TOTAL_DURATION) {
        setIsPlaying(false);
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
        animationFrame.current = null;
        return;
      }

      animationFrame.current = requestAnimationFrame(update);
    };

    animationFrame.current = requestAnimationFrame(update);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [isPlaying, elapsed]);

  useEffect(() => {
    const scene = SCENES[sceneIndex]!;

    if (scene.id === "doll" && audioContext.current && masterGainRef.current) {
      const ctx = audioContext.current;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.24), ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < channel.length; i += 1) {
        const progress = i / channel.length;
        const envelope = Math.pow(1 - progress, 3);
        const spike = progress < 0.1 ? 1 - progress * 8 : 0;
        channel[i] = (Math.random() * 2 - 1) * envelope * 0.9 + spike * 0.6;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0, ctx.currentTime);
      crackGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.01);
      crackGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      source.connect(crackGain).connect(masterGainRef.current);
      source.start();
      source.stop(ctx.currentTime + 0.4);
    }

    if (scene.id === "presence" && audioContext.current) {
      // slight lens distortion by nudging master gain for a moment
      const ctx = audioContext.current;
      if (!masterGainRef.current) return;
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setTargetAtTime(
        0.65,
        ctx.currentTime,
        0.08,
      );
      masterGainRef.current.gain.setTargetAtTime(
        0.45,
        ctx.currentTime + 0.32,
        0.12,
      );
    }
  }, [sceneIndex]);

  useEffect(() => {
    if (!isPlaying || typeof window === "undefined") return;
    if (!window.speechSynthesis) return;
    if (spokenScene.current === sceneIndex) return;

    window.speechSynthesis.cancel();
    const scene = SCENES[sceneIndex]!;
    const utterance = new SpeechSynthesisUtterance(scene.narration);
    utterance.lang = "hi-IN";
    utterance.pitch = 0.88;
    utterance.rate = 0.88;
    utterance.volume = 1;

    utterance.onstart = () => {
      setNarrating(true);
    };
    utterance.onend = () => {
      setNarrating(false);
    };
    utterance.onerror = () => {
      setNarrating(false);
    };

    window.speechSynthesis.speak(utterance);
    spokenScene.current = sceneIndex;

    return () => {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [isPlaying, sceneIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    if (audioContext.current) {
      if (audioContext.current.state === "suspended") {
        void audioContext.current.resume();
      }
      return;
    }

    const ctx = new AudioContext();
    audioContext.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.45;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    const darkDrone = ctx.createOscillator();
    darkDrone.type = "sawtooth";
    darkDrone.frequency.value = 38;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.2;
    darkDrone.connect(droneGain).connect(masterGain);
    darkDrone.start();

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const fade = 1 - i / data.length;
      data[i] = (Math.random() * 2 - 1) * fade * 0.6;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1100;
    noiseFilter.Q.value = 7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;

    noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);
    noise.start();

    const heartbeatGain = ctx.createGain();
    heartbeatGain.gain.value = 0;
    heartbeatGain.connect(masterGain);

    const heartbeatOsc = ctx.createOscillator();
    heartbeatOsc.type = "sine";
    heartbeatOsc.frequency.value = 55;
    heartbeatOsc.connect(heartbeatGain);
    heartbeatOsc.start();

    const scheduleHeartbeat = () => {
      if (!audioContext.current) return;
      const now = ctx.currentTime;
      heartbeatGain.gain.cancelScheduledValues(now);
      heartbeatGain.gain.setValueAtTime(0, now);
      heartbeatGain.gain.linearRampToValueAtTime(0.9, now + 0.08);
      heartbeatGain.gain.exponentialRampToValueAtTime(0.02, now + 0.42);

      const secondBeat = now + 0.5;
      heartbeatGain.gain.setValueAtTime(0, secondBeat);
      heartbeatGain.gain.linearRampToValueAtTime(0.6, secondBeat + 0.06);
      heartbeatGain.gain.exponentialRampToValueAtTime(0.015, secondBeat + 0.28);

      heartbeatTimer.current = window.setTimeout(scheduleHeartbeat, 930);
    };

    scheduleHeartbeat();

    const metallicScrape = () => {
      if (!audioContext.current) return;
      const saw = ctx.createOscillator();
      saw.type = "sawtooth";
      saw.frequency.value = 850 + Math.random() * 400;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 800;

      saw.connect(filter).connect(gain).connect(masterGain);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      saw.frequency.exponentialRampToValueAtTime(
        saw.frequency.value * 0.4,
        now + 0.5,
      );
      saw.start();
      saw.stop(now + 0.8);

      metallicTimer.current = window.setTimeout(
        metallicScrape,
        4000 + Math.random() * 3000,
      );
    };

    metallicScrape();

    return () => {
      if (metallicTimer.current) {
        window.clearTimeout(metallicTimer.current);
      }
      if (heartbeatTimer.current) {
        window.clearTimeout(heartbeatTimer.current);
      }
      darkDrone.stop();
      noise.stop();
      heartbeatOsc.stop();
      ctx.close().catch(() => {});
      audioContext.current = null;
      masterGainRef.current = null;
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      spokenScene.current = -1;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const currentScene = SCENES[sceneIndex]!;
  const { remaining: nextCue, sceneElapsed } = useMemo(() => {
    const elapsedBeforeScene = SCENES.slice(0, sceneIndex).reduce(
      (sum, scene) => sum + scene.duration,
      0,
    );
    const sceneElapsed = Math.max(elapsed - elapsedBeforeScene, 0);
    const remaining = Math.max(currentScene.duration - sceneElapsed, 0);
    return { remaining, sceneElapsed };
  }, [currentScene.duration, elapsed, sceneIndex]);
  const isJumpCut =
    currentScene.id === "presence" && sceneElapsed < 280 && isPlaying;

  const startExperience = () => {
    setIsPlaying(true);
    setElapsed(0);
    setSceneIndex(0);
    spokenScene.current = -1;

    if (audioContext.current) {
      void audioContext.current.resume();
    }
  };

  const visualClasses = [
    "scene",
    currentScene.visualClass,
    isJumpCut ? "jump-cut" : "",
    isPlaying ? "playing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className={visualClasses}>
        <div className="overlay overlay--grain" />
        <div className="overlay overlay--vignette" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      <main className="relative z-10 flex min-h-screen flex-col justify-between">
        <header className="p-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.5rem] text-zinc-400">
            <span>Analog Horror Short</span>
            <span>4K | 60s</span>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <h1 className="text-4xl font-light uppercase text-zinc-200 tracking-[0.6rem] sm:text-5xl">
              Agentic Midnight
            </h1>
            <p className="max-w-xl text-sm text-zinc-400 sm:text-base">
              Slow pans, suffocating grain, and a whispered Hindi monologue guide
              you through an analog nightmare.
            </p>
          </div>
        </header>

        <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-6 pb-32 sm:px-12">
          <div className="mb-10 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.3rem] text-zinc-500">
            <span>{currentScene.title}</span>
            <span>
              {formatTime(elapsed)} ▪︎ {formatTime(TOTAL_DURATION)}
            </span>
          </div>

          <div
            className={`max-w-2xl text-sm leading-relaxed text-zinc-300 transition-colors duration-700 ${
              currentScene.accent === "red" ? "text-red-500" : ""
            }`}
          >
            {currentScene.caption}
          </div>

          <div className="mt-12 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full origin-left bg-red-500 transition-transform duration-500 ease-out"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <footer className="pointer-events-none mt-12 flex flex-col gap-4 text-center text-base sm:text-lg">
            <p className="font-medium tracking-wide text-zinc-100">
              {currentScene.subtitle}
            </p>
            <span className="text-xs uppercase tracking-[0.4rem] text-zinc-500">
              {narrating ? "Hindi narration channel active" : "Await the next whisper"}
            </span>
          </footer>
        </section>

        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center text-xs uppercase tracking-[0.3rem] text-zinc-600">
          Next cue in {Math.ceil(nextCue / 1000)}s
        </div>

        {!isPlaying && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <button
              type="button"
              onClick={startExperience}
              className="group relative overflow-hidden border border-red-600/70 px-12 py-6 text-sm uppercase tracking-[0.5rem] text-zinc-200 transition-colors hover:text-red-400"
            >
              <span className="absolute inset-0 bg-red-600/10 transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Enter The Haunting</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

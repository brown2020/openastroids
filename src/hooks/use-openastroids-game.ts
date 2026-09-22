"use client";

import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import {
  createGameAudio,
  readMutedPreference,
  writeMutedPreference,
  type GameAudio,
} from "@/lib/openastroids/audio";
import {
  createInitialState,
  resizeState,
  resetGame,
  startGame,
  step,
  togglePause,
} from "@/lib/openastroids/game";
import { maybeUpdateHighScore, readHighScore } from "@/lib/openastroids/high-score";
import { render } from "@/lib/openastroids/render";
import type { GameState, InputState } from "@/lib/openastroids/types";
import { useOpenAstroidsStore } from "@/stores/openastroids-store";

const EMPTY_INPUT: InputState = {
  isThrusting: false,
  rotateDir: 0,
  isFiring: false,
  isHyperspace: false,
};

function resetInputState(input: InputState, queuedHyperspace: { current: boolean }) {
  input.isThrusting = false;
  input.rotateDir = 0;
  input.isFiring = false;
  queuedHyperspace.current = false;
}

const HUD_UPDATE_INTERVAL_MS = 75;
const GAME_KEYS = [
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyD",
  "KeyP",
  "Enter",
  "ShiftLeft",
  "ShiftRight",
];
const FALLBACK_CANVAS_SIZE = { w: 800, h: 600 };

export function useOpenAstroidsGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const gameRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({ ...EMPTY_INPUT });
  const queuedHyperspaceRef = useRef(false);
  const frameRef = useRef(0);
  const seedRef = useRef<number>(0);
  const hudLastUpdateMsRef = useRef(0);
  const prefersReducedMotionRef = useRef(false);
  const audioRef = useRef<GameAudio | null>(null);

  const {
    status,
    score,
    lives,
    level,
    asteroidsDestroyed,
    activeMs,
    highScore,
    isTouch,
    isMuted,
    setHud,
    setHighScore,
    setIsTouch,
    setMuted,
  } = useOpenAstroidsStore();

  useEffect(() => {
    setHighScore(readHighScore());
    const muted = readMutedPreference();
    setMuted(muted);
    const audio = createGameAudio(muted);
    audioRef.current = audio;
    return () => {
      audio?.dispose();
      audioRef.current = null;
    };
  }, [setHighScore, setMuted]);

  const resumeAudio = useCallback(() => {
    void audioRef.current?.resume();
  }, []);

  const toggleMuted = useCallback(() => {
    const next = !useOpenAstroidsStore.getState().isMuted;
    setMuted(next);
    writeMutedPreference(next);
    audioRef.current?.setMuted(next);
    if (!next) resumeAudio();
  }, [resumeAudio, setMuted]);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, [setIsTouch]);

  // Prefer ref-only motion flag — avoids matchMedia-in-initializer (Doctor)
  // and setState-in-effect (eslint react-hooks).
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = motionQuery.matches;
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };
    motionQuery.addEventListener("change", handleChange);
    return () => motionQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (seedRef.current === 0) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      seedRef.current = buf[0] ?? 1;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const measure = () => {
      const parent = canvas.parentElement;
      if (!parent) return FALLBACK_CANVAS_SIZE;
      const rect = parent.getBoundingClientRect();
      return { w: Math.max(1, Math.floor(rect.width)), h: Math.max(1, Math.floor(rect.height)) };
    };

    const syncSize = () => {
      const { w, h } = measure();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gameRef.current = gameRef.current
        ? resizeState(gameRef.current, w, h)
        : createInitialState({ width: w, height: h, nowMs: performance.now(), seed: seedRef.current });
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const tick = (nowMs: number) => {
      frameRef.current += 1;
      const game = gameRef.current;
      const ctxNow = ctxRef.current;
      if (!game || !ctxNow) {
        rafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const hyperspace = queuedHyperspaceRef.current;
      queuedHyperspaceRef.current = false;
      const input: InputState = { ...inputRef.current, isHyperspace: hyperspace };

      const seed = (seedRef.current + frameRef.current) >>> 0;
      const result = step(game, input, nowMs, seed);
      const { next } = result;
      gameRef.current = next;

      const audio = audioRef.current;
      if (audio) {
        if (result.didFire) audio.playFire();
        for (const size of result.asteroidHits) {
          audio.playExplosion(size);
        }
        if (result.didShipExplode) audio.playShipDeath();
        if (result.extraLivesGained > 0) audio.playExtraLife();
        if (next.status === "gameover" && game.status !== "gameover") {
          audio.playGameOver();
        }
        audio.setThrustActive(next.status === "running" && input.isThrusting);
      }

      if (next.status !== "running") {
        queuedHyperspaceRef.current = false;
      }

      render(ctxNow, next, {
        isCrt: !prefersReducedMotionRef.current,
        isThrusting: next.status === "running" && input.isThrusting,
        prefersReducedMotion: prefersReducedMotionRef.current,
      });

      const isGameOver = next.status === "gameover" && game.status !== "gameover";
      if (isGameOver || nowMs - hudLastUpdateMsRef.current > HUD_UPDATE_INTERVAL_MS) {
        hudLastUpdateMsRef.current = nowMs;
        setHud({
          status: next.status,
          score: next.score,
          lives: next.lives,
          level: next.level,
          asteroidsDestroyed: next.asteroidsDestroyed,
          activeMs: next.activeMs,
        });
        if (isGameOver) {
          setHighScore(maybeUpdateHighScore(next.score));
        }
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [setHud, setHighScore]);

  const updateHud = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setHud({
      status: g.status,
      score: g.score,
      lives: g.lives,
      level: g.level,
      asteroidsDestroyed: g.asteroidsDestroyed,
      activeMs: g.activeMs,
    });
  }, [setHud]);

  const pauseGame = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.status !== "running") return;
    resetInputState(inputRef.current, queuedHyperspaceRef);
    gameRef.current = togglePause(g);
    audioRef.current?.setThrustActive(false);
    updateHud();
  }, [updateHud]);

  const onVisibilityHidden = useEffectEvent(() => {
    pauseGame();
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) onVisibilityHidden();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const doRestart = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    resetInputState(inputRef.current, queuedHyperspaceRef);
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    seedRef.current = buf[0] ?? 1;
    frameRef.current = 0;
    gameRef.current = resetGame(g, performance.now(), seedRef.current);
    updateHud();
  }, [updateHud]);

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (GAME_KEYS.includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") inputRef.current.rotateDir = -1;
    if (e.code === "ArrowRight" || e.code === "KeyD") inputRef.current.rotateDir = 1;
    if (e.code === "ArrowUp" || e.code === "KeyW") inputRef.current.isThrusting = true;
    if (e.code === "Space") inputRef.current.isFiring = true;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") queuedHyperspaceRef.current = true;
    if (e.code === "KeyP") {
      const g = gameRef.current;
      if (!g) return;
      if (g.status === "running") {
        resetInputState(inputRef.current, queuedHyperspaceRef);
        gameRef.current = togglePause(g);
        audioRef.current?.setThrustActive(false);
      } else if (g.status === "paused") {
        resumeAudio();
        gameRef.current = startGame(g, performance.now());
      }
      updateHud();
    }
    if (e.code === "Enter") {
      const g = gameRef.current;
      if (!g) return;
      if (g.status === "gameover") {
        doRestart();
        return;
      }
      resumeAudio();
      gameRef.current = startGame(g, performance.now());
      updateHud();
    }
  });

  const onKeyUp = useEffectEvent((e: KeyboardEvent) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      if (inputRef.current.rotateDir === -1) inputRef.current.rotateDir = 0;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      if (inputRef.current.rotateDir === 1) inputRef.current.rotateDir = 0;
    }
    if (e.code === "ArrowUp" || e.code === "KeyW") inputRef.current.isThrusting = false;
    if (e.code === "Space") inputRef.current.isFiring = false;
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const doStart = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    resumeAudio();
    gameRef.current = startGame(g, performance.now());
    updateHud();
  }, [updateHud, resumeAudio]);

  const doPause = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    if (g.status === "running") {
      resetInputState(inputRef.current, queuedHyperspaceRef);
      gameRef.current = togglePause(g);
      audioRef.current?.setThrustActive(false);
    } else if (g.status === "paused") {
      resumeAudio();
      gameRef.current = startGame(g, performance.now());
    }
    updateHud();
  }, [resumeAudio, updateHud]);

  const handleRotateLeft = useCallback(() => {
    inputRef.current.rotateDir = -1;
  }, []);
  const handleRotateRight = useCallback(() => {
    inputRef.current.rotateDir = 1;
  }, []);
  const handleRotateStop = useCallback(() => {
    inputRef.current.rotateDir = 0;
  }, []);
  const handleThrustStart = useCallback(() => {
    inputRef.current.isThrusting = true;
  }, []);
  const handleThrustStop = useCallback(() => {
    inputRef.current.isThrusting = false;
  }, []);
  const handleFireStart = useCallback(() => {
    inputRef.current.isFiring = true;
  }, []);
  const handleFireStop = useCallback(() => {
    inputRef.current.isFiring = false;
  }, []);
  const handleHyperspace = useCallback(() => {
    queuedHyperspaceRef.current = true;
  }, []);

  return {
    canvasRef,
    status,
    score,
    lives,
    level,
    asteroidsDestroyed,
    activeMs,
    highScore,
    isTouch,
    isMuted,
    toggleMuted,
    doStart,
    doPause,
    doRestart,
    handleRotateLeft,
    handleRotateRight,
    handleRotateStop,
    handleThrustStart,
    handleThrustStop,
    handleFireStart,
    handleFireStop,
    handleHyperspace,
  };
}

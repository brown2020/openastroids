"use client";

import { useCallback, useEffect, useRef } from "react";
import { createInitialState, resizeState, resetGame, startGame, step, togglePause } from "@/lib/openastroids/game";
import { render } from "@/lib/openastroids/render";
import type { GameState, InputState } from "@/lib/openastroids/types";
import { useOpenAstroidsStore } from "@/stores/openastroids-store";

const EMPTY_INPUT: InputState = { isThrusting: false, rotateDir: 0, isFiring: false, isHyperspace: false };
const HUD_UPDATE_INTERVAL_MS = 75;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const gameRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({ ...EMPTY_INPUT });
  const queuedHyperspaceRef = useRef(false);
  const frameRef = useRef(0);
  const seedRef = useRef<number>(0);
  const hudLastUpdateMsRef = useRef(0);

  const { status, score, lives, level, isTouch, setHud, setIsTouch } = useOpenAstroidsStore();

  useEffect(() => {
    const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsTouch(isTouchDevice);
  }, [setIsTouch]);

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
      if (!parent) return { w: 800, h: 600 };
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
      gameRef.current = gameRef.current ? resizeState(gameRef.current, w, h) : createInitialState({ width: w, height: h, nowMs: performance.now(), seed: seedRef.current });
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
      const { next } = step(game, input, nowMs, seed);
      gameRef.current = next;

      render(ctxNow, next, { isCrt: true });

      if (nowMs - hudLastUpdateMsRef.current > HUD_UPDATE_INTERVAL_MS) {
        hudLastUpdateMsRef.current = nowMs;
        setHud({ status: next.status, score: next.score, lives: next.lives, level: next.level });
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [setHud]);

  const updateHud = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setHud({ status: g.status, score: g.score, lives: g.lives, level: g.level });
  }, [setHud]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") inputRef.current.rotateDir = -1;
      if (e.code === "ArrowRight" || e.code === "KeyD") inputRef.current.rotateDir = 1;
      if (e.code === "ArrowUp" || e.code === "KeyW") inputRef.current.isThrusting = true;
      if (e.code === "Space") inputRef.current.isFiring = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") queuedHyperspaceRef.current = true;
      if (e.code === "KeyP") {
        const g = gameRef.current;
        if (!g) return;
        gameRef.current = togglePause(g);
        updateHud();
      }
      if (e.code === "Enter") {
        const g = gameRef.current;
        if (!g) return;
        gameRef.current = startGame(g, performance.now());
        updateHud();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        if (inputRef.current.rotateDir === -1) inputRef.current.rotateDir = 0;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        if (inputRef.current.rotateDir === 1) inputRef.current.rotateDir = 0;
      }
      if (e.code === "ArrowUp" || e.code === "KeyW") inputRef.current.isThrusting = false;
      if (e.code === "Space") inputRef.current.isFiring = false;
    };
    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("keyup", onKeyUp, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [updateHud]);

  const doStart = () => {
    const g = gameRef.current;
    if (!g) return;
    gameRef.current = startGame(g, performance.now());
    updateHud();
  };

  const doPause = () => {
    const g = gameRef.current;
    if (!g) return;
    gameRef.current = togglePause(g);
    updateHud();
  };

  const doRestart = () => {
    const g = gameRef.current;
    if (!g) return;
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    seedRef.current = buf[0] ?? 1;
    frameRef.current = 0;
    gameRef.current = resetGame(g, performance.now(), seedRef.current);
    updateHud();
  };

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-black text-emerald-50">
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label="OpenAstroids game canvas" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4">
        <div className="pointer-events-auto rounded-lg border border-emerald-200/20 bg-black/40 px-3 py-2 backdrop-blur">
          <div className="text-xs tracking-wide text-emerald-100/70">OPENASTROIDS</div>
          <div className="mt-1 flex gap-4 text-sm">
            <div>
              <span className="text-emerald-100/70">Score</span>{" "}
              <span className="font-mono tabular-nums">{score}</span>
            </div>
            <div>
              <span className="text-emerald-100/70">Lives</span>{" "}
              <span className="font-mono tabular-nums">{lives}</span>
            </div>
            <div>
              <span className="text-emerald-100/70">Level</span>{" "}
              <span className="font-mono tabular-nums">{level}</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <GameButton onClick={doStart} disabled={status === "running" || status === "gameover"}>
            {status === "paused" ? "Resume" : "Start"}
          </GameButton>
          <GameButton onClick={doPause} disabled={status === "ready" || status === "gameover"}>
            {status === "paused" ? "Unpause" : "Pause"}
          </GameButton>
          <GameButton onClick={doRestart}>Restart</GameButton>
        </div>
      </div>

      {isTouch ? (
        <TouchControls
          setInput={(next) => {
            inputRef.current = { ...inputRef.current, ...next };
          }}
          queueHyperspace={() => {
            queuedHyperspaceRef.current = true;
          }}
        />
      ) : (
        <DesktopControlsHint />
      )}

      {status === "gameover" ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/40 p-6">
          <div className="max-w-md rounded-xl border border-emerald-200/20 bg-black/60 p-6 text-center backdrop-blur">
            <div className="text-xl font-semibold tracking-wide">GAME OVER</div>
            <div className="mt-2 text-sm text-emerald-100/80">
              Final score: <span className="font-mono tabular-nums">{score}</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <GameButton onClick={doRestart}>Play again</GameButton>
            </div>
            <div className="mt-4 text-xs text-emerald-100/60">
              Tip: rotate with A/D (or ←/→), thrust with W (or ↑), shoot with Space, hyperspace with Shift, pause with P.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DesktopControlsHint() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-20 p-4">
      <div className="rounded-lg border border-emerald-200/20 bg-black/40 px-3 py-2 text-xs text-emerald-100/70 backdrop-blur">
        Controls: <span className="text-emerald-100">A/D</span> rotate, <span className="text-emerald-100">W</span> thrust,{" "}
        <span className="text-emerald-100">Space</span> fire, <span className="text-emerald-100">Shift</span> hyperspace,{" "}
        <span className="text-emerald-100">P</span> pause, <span className="text-emerald-100">Enter</span> start.
      </div>
    </div>
  );
}

function TouchControls(props: { setInput: (next: Partial<InputState>) => void; queueHyperspace: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-4">
      <div className="flex gap-2">
        <HoldButton
          label="⟲"
          onDown={() => props.setInput({ rotateDir: -1 })}
          onUp={() => props.setInput({ rotateDir: 0 })}
        />
        <HoldButton
          label="⟳"
          onDown={() => props.setInput({ rotateDir: 1 })}
          onUp={() => props.setInput({ rotateDir: 0 })}
        />
      </div>

      <div className="flex gap-2">
        <HoldButton label="THRUST" onDown={() => props.setInput({ isThrusting: true })} onUp={() => props.setInput({ isThrusting: false })} />
        <HoldButton label="FIRE" onDown={() => props.setInput({ isFiring: true })} onUp={() => props.setInput({ isFiring: false })} />
        <TapButton label="JUMP" onTap={props.queueHyperspace} />
      </div>
    </div>
  );
}

function GameButton(props: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className="select-none rounded-full border border-emerald-200/20 bg-black/40 px-4 py-2 text-sm text-emerald-50 backdrop-blur transition hover:bg-black/60 disabled:opacity-50"
    >
      {props.children}
    </button>
  );
}

function HoldButton(props: { label: string; onDown: () => void; onUp: () => void }) {
  return (
    <button
      type="button"
      className="select-none rounded-xl border border-emerald-200/20 bg-black/40 px-4 py-3 text-sm text-emerald-50 backdrop-blur active:bg-black/70"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        props.onDown();
      }}
      onPointerUp={props.onUp}
      onPointerCancel={props.onUp}
    >
      {props.label}
    </button>
  );
}

function TapButton(props: { label: string; onTap: () => void }) {
  return (
    <button
      type="button"
      className="select-none rounded-xl border border-emerald-200/20 bg-black/40 px-4 py-3 text-sm text-emerald-50 backdrop-blur active:bg-black/70"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        props.onTap();
      }}
    >
      {props.label}
    </button>
  );
}

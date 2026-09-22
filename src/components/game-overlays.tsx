"use client";

import { useEffect, useRef } from "react";
import { formatRunTimeMs } from "@/lib/openastroids/game";
import { GameButton } from "@/components/game-buttons";

function useShowModal(open: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);
  return dialogRef;
}

type ReadyOverlayProps = {
  highScore: number;
  onStart: () => void;
};

export function ReadyOverlay(props: ReadyOverlayProps) {
  const dialogRef = useShowModal(true);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-30 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-6 open:grid open:place-items-center"
      aria-labelledby="ready-title"
      onCancel={(e) => {
        // Keep the start dialog open; Enter / Start button begins the game.
        e.preventDefault();
      }}
    >
      <div className="max-w-md rounded-xl border border-emerald-200/20 bg-black/80 p-6 text-center text-emerald-50 shadow-xl backdrop-blur">
        <h2 id="ready-title" className="text-2xl font-semibold tracking-wide">
          OPENASTROIDS
        </h2>
        <p className="mt-2 text-sm text-emerald-100/80">Destroy asteroids. Survive. Set a high score.</p>
        {props.highScore > 0 ? (
          <p className="mt-2 text-sm text-emerald-100/70">
            Best score: <span className="font-mono tabular-nums text-emerald-50">{props.highScore}</span>
          </p>
        ) : null}

        <div className="mt-6 text-left text-xs text-emerald-100/70">
          <div className="mb-2 font-medium text-emerald-100/90">Controls</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="text-emerald-100">A/D</span> or <span className="text-emerald-100">←/→</span>
            </div>
            <div>Rotate</div>
            <div>
              <span className="text-emerald-100">W</span> or <span className="text-emerald-100">↑</span>
            </div>
            <div>Thrust</div>
            <div>
              <span className="text-emerald-100">Space</span>
            </div>
            <div>Fire</div>
            <div>
              <span className="text-emerald-100">Shift</span>
            </div>
            <div>Hyperspace (risky!)</div>
            <div>
              <span className="text-emerald-100">P</span>
            </div>
            <div>Pause</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <GameButton onClick={props.onStart} autoFocus>
            Press Enter or Click to Start
          </GameButton>
        </div>
      </div>
    </dialog>
  );
}

type GameOverOverlayProps = {
  score: number;
  highScore: number;
  level: number;
  activeMs: number;
  asteroidsDestroyed: number;
  onRestart: () => void;
};

export function GameOverOverlay(props: GameOverOverlayProps) {
  const dialogRef = useShowModal(true);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-30 m-0 h-full w-full max-h-none max-w-none border-0 bg-transparent p-6 open:grid open:place-items-center"
      aria-labelledby="gameover-title"
      onCancel={(e) => {
        e.preventDefault();
        props.onRestart();
      }}
    >
      <div className="max-w-md rounded-xl border border-emerald-200/20 bg-black/80 p-6 text-center text-emerald-50 shadow-xl backdrop-blur">
        <h2 id="gameover-title" className="text-xl font-semibold tracking-wide">
          GAME OVER
        </h2>
        <div className="mt-2 text-sm text-emerald-100/80">
          Final score: <span className="font-mono tabular-nums">{props.score}</span>
        </div>
        <div className="mt-1 text-sm text-emerald-100/70">
          Best score: <span className="font-mono tabular-nums text-emerald-50">{props.highScore}</span>
          {props.score > 0 && props.score >= props.highScore ? (
            <span className="ml-2 text-emerald-300">New record!</span>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-left text-sm text-emerald-100/80">
          <div>
            <span className="text-emerald-100/70">Level reached</span>
            <div className="font-mono tabular-nums text-emerald-50">{props.level}</div>
          </div>
          <div>
            <span className="text-emerald-100/70">Time survived</span>
            <div className="font-mono tabular-nums text-emerald-50">{formatRunTimeMs(props.activeMs)}</div>
          </div>
          <div className="col-span-2">
            <span className="text-emerald-100/70">Asteroids destroyed</span>
            <div className="font-mono tabular-nums text-emerald-50">{props.asteroidsDestroyed}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <GameButton onClick={props.onRestart} autoFocus>
            Play again
          </GameButton>
        </div>
        <div className="mt-4 text-xs text-emerald-100/60">
          Tip: rotate with A/D (or ←/→), thrust with W (or ↑), shoot with Space, hyperspace with Shift, pause with P.
        </div>
      </div>
    </dialog>
  );
}

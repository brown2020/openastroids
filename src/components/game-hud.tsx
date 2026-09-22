"use client";

import Link from "next/link";
import { GameButton, MuteButton } from "@/components/game-buttons";

type GameHudProps = {
  score: number;
  lives: number;
  level: number;
  status: "ready" | "running" | "paused" | "gameover";
  isMuted: boolean;
  onToggleMuted: () => void;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
};

export function GameHud(props: GameHudProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4">
      <div className="pointer-events-auto rounded-lg border border-emerald-200/20 bg-black/40 px-3 py-2 backdrop-blur">
        <h1 className="text-xs tracking-wide text-emerald-100/70">OPENASTROIDS</h1>
        <div className="mt-1 flex gap-4 text-sm" aria-live="polite">
          <div>
            <span className="text-emerald-100/70">Score</span>{" "}
            <span className="font-mono tabular-nums">{props.score}</span>
          </div>
          <div>
            <span className="text-emerald-100/70">Lives</span>{" "}
            <span className="font-mono tabular-nums">{props.lives}</span>
          </div>
          <div>
            <span className="text-emerald-100/70">Level</span>{" "}
            <span className="font-mono tabular-nums">{props.level}</span>
          </div>
        </div>
        <nav className="mt-2 flex gap-3 text-[11px] text-emerald-100/60" aria-label="Site">
          <Link href="/about" className="hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
            About
          </Link>
          <Link href="/privacy" className="hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50">
            Terms
          </Link>
        </nav>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <MuteButton isMuted={props.isMuted} onToggle={props.onToggleMuted} />
        <GameButton onClick={props.onStart} disabled={props.status === "running" || props.status === "gameover"}>
          {props.status === "paused" ? "Resume" : "Start"}
        </GameButton>
        <GameButton onClick={props.onPause} disabled={props.status !== "running"}>
          Pause
        </GameButton>
        <GameButton onClick={props.onRestart}>Restart</GameButton>
      </div>
    </header>
  );
}

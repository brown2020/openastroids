"use client";

import { memo, type ReactNode } from "react";

export const MuteButton = memo(function MuteButton(props: {
  isMuted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onToggle}
      aria-pressed={props.isMuted}
      aria-label={props.isMuted ? "Unmute game sound" : "Mute game sound"}
      className="select-none rounded-full border border-emerald-200/20 bg-black/40 px-3 py-2 text-sm text-emerald-50 backdrop-blur transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
    >
      {props.isMuted ? "Unmute" : "Mute"}
    </button>
  );
});

export const GameButton = memo(function GameButton(props: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      autoFocus={props.autoFocus}
      className="select-none rounded-full border border-emerald-200/20 bg-black/40 px-4 py-2 text-sm text-emerald-50 backdrop-blur transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:opacity-50"
    >
      {props.children}
    </button>
  );
});

export const HoldButton = memo(function HoldButton(props: {
  label: string;
  ariaLabel: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.ariaLabel}
      className="select-none rounded-xl border border-emerald-200/20 bg-black/40 px-4 py-3 text-sm text-emerald-50 backdrop-blur active:bg-black/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
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
});

export const TapButton = memo(function TapButton(props: {
  label: string;
  ariaLabel: string;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.ariaLabel}
      className="select-none rounded-xl border border-emerald-200/20 bg-black/40 px-4 py-3 text-sm text-emerald-50 backdrop-blur active:bg-black/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        props.onTap();
      }}
    >
      {props.label}
    </button>
  );
});

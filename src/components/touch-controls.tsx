"use client";

import { memo } from "react";
import { HoldButton, TapButton } from "@/components/game-buttons";

export function DesktopControlsHint() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-20 p-4">
      <div className="rounded-lg border border-emerald-200/20 bg-black/40 px-3 py-2 text-xs text-emerald-100/70 backdrop-blur">
        Controls: <span className="text-emerald-100">A/D</span> rotate,{" "}
        <span className="text-emerald-100">W</span> thrust,{" "}
        <span className="text-emerald-100">Space</span> fire,{" "}
        <span className="text-emerald-100">Shift</span> hyperspace,{" "}
        <span className="text-emerald-100">P</span> pause,{" "}
        <span className="text-emerald-100">Enter</span> start.
      </div>
    </div>
  );
}

type TouchControlsProps = {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotateStop: () => void;
  onThrustStart: () => void;
  onThrustStop: () => void;
  onFireStart: () => void;
  onFireStop: () => void;
  onHyperspace: () => void;
};

export const TouchControls = memo(function TouchControls(props: TouchControlsProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-4">
      <div className="flex gap-2">
        <HoldButton label="⟲" ariaLabel="Rotate left" onDown={props.onRotateLeft} onUp={props.onRotateStop} />
        <HoldButton label="⟳" ariaLabel="Rotate right" onDown={props.onRotateRight} onUp={props.onRotateStop} />
      </div>

      <div className="flex gap-2">
        <HoldButton label="THRUST" ariaLabel="Thrust forward" onDown={props.onThrustStart} onUp={props.onThrustStop} />
        <HoldButton label="FIRE" ariaLabel="Fire weapon" onDown={props.onFireStart} onUp={props.onFireStop} />
        <TapButton label="JUMP" ariaLabel="Hyperspace jump" onTap={props.onHyperspace} />
      </div>
    </div>
  );
});

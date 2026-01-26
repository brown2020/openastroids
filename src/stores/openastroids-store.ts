import { create } from "zustand";

type HudState = {
  status: "ready" | "running" | "paused" | "gameover";
  score: number;
  lives: number;
  level: number;
  isTouch: boolean;
  setHud: (next: Pick<HudState, "status" | "score" | "lives" | "level">) => void;
  setIsTouch: (isTouch: boolean) => void;
};

export const useOpenAstroidsStore = create<HudState>((set) => ({
  status: "ready",
  score: 0,
  lives: 3,
  level: 1,
  isTouch: false,
  setHud: (next) => set(next),
  setIsTouch: (isTouch) => set({ isTouch }),
}));

import { create } from "zustand";

type HudState = {
  status: "ready" | "running" | "paused" | "gameover";
  score: number;
  lives: number;
  level: number;
  asteroidsDestroyed: number;
  activeMs: number;
  highScore: number;
  isTouch: boolean;
  setHud: (
    next: Pick<HudState, "status" | "score" | "lives" | "level" | "asteroidsDestroyed" | "activeMs">,
  ) => void;
  setHighScore: (highScore: number) => void;
  setIsTouch: (isTouch: boolean) => void;
};

export const useOpenAstroidsStore = create<HudState>((set) => ({
  status: "ready",
  score: 0,
  lives: 3,
  level: 1,
  asteroidsDestroyed: 0,
  activeMs: 0,
  highScore: 0,
  isTouch: false,
  setHud: (next) => set(next),
  setHighScore: (highScore) => set({ highScore }),
  setIsTouch: (isTouch) => set({ isTouch }),
}));

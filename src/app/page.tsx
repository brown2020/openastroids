"use client";

import { GameHud } from "@/components/game-hud";
import { GameOverOverlay, ReadyOverlay } from "@/components/game-overlays";
import { DesktopControlsHint, TouchControls } from "@/components/touch-controls";
import { useOpenAstroidsGame } from "@/hooks/use-openastroids-game";

export default function Home() {
  const {
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
  } = useOpenAstroidsGame();

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-black text-emerald-50">
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          role="img"
          aria-label="OpenAstroids game canvas"
        />
      </div>

      <GameHud
        score={score}
        lives={lives}
        level={level}
        status={status}
        isMuted={isMuted}
        onToggleMuted={toggleMuted}
        onStart={doStart}
        onPause={doPause}
        onRestart={doRestart}
      />

      {isTouch ? (
        <TouchControls
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onRotateStop={handleRotateStop}
          onThrustStart={handleThrustStart}
          onThrustStop={handleThrustStop}
          onFireStart={handleFireStart}
          onFireStop={handleFireStop}
          onHyperspace={handleHyperspace}
        />
      ) : (
        <DesktopControlsHint />
      )}

      {status === "ready" ? <ReadyOverlay highScore={highScore} onStart={doStart} /> : null}
      {status === "gameover" ? (
        <GameOverOverlay
          score={score}
          highScore={highScore}
          level={level}
          activeMs={activeMs}
          asteroidsDestroyed={asteroidsDestroyed}
          onRestart={doRestart}
        />
      ) : null}
    </main>
  );
}

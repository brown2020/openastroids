import Link from "next/link";

export const metadata = {
  title: "About - OpenAstroids",
  description: "About OpenAstroids, an open-source remake of the classic Asteroids arcade game.",
};

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-[#05070a] px-6 py-12 text-emerald-50">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-block text-sm text-emerald-100/70 transition hover:text-emerald-100"
        >
          &larr; Back to game
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-wide">About OpenAstroids</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-emerald-100/90">
          <section>
            <h2 className="text-lg font-medium text-emerald-50">The Game</h2>
            <p className="mt-2">
              OpenAstroids is a modern, open-source remake of the classic Asteroids arcade game
              originally released by Atari in 1979. Navigate your ship through an asteroid field,
              destroy asteroids for points, and survive as long as possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">How to Play</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong>Rotate:</strong> A/D or Arrow keys
              </li>
              <li>
                <strong>Thrust:</strong> W or Up arrow
              </li>
              <li>
                <strong>Fire:</strong> Space
              </li>
              <li>
                <strong>Hyperspace:</strong> Shift (random teleport, risky!)
              </li>
              <li>
                <strong>Pause:</strong> P
              </li>
              <li>
                <strong>Start:</strong> Enter
              </li>
            </ul>
            <p className="mt-2">Touch controls are available on mobile devices.</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Scoring</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Large asteroid: 20 points</li>
              <li>Medium asteroid: 50 points</li>
              <li>Small asteroid: 100 points</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Technology</h2>
            <p className="mt-2">
              Built with Next.js, React, and TypeScript. Features canvas-based vector graphics,
              deterministic gameplay via seeded RNG, and full keyboard/touch support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Open Source</h2>
            <p className="mt-2">
              OpenAstroids is licensed under AGPL-3.0. Contributions are welcome! The source code
              is available on GitHub.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Links</h2>
            <div className="mt-2 flex gap-4">
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-emerald-400 hover:underline">
                Terms of Service
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

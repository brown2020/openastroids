import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - OpenAstroids",
  description: "Privacy policy for OpenAstroids, an open-source Asteroids game.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#05070a] px-6 py-12 text-emerald-50">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-block text-sm text-emerald-100/70 transition hover:text-emerald-100"
        >
          &larr; Back to game
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-wide">Privacy Policy</h1>
        <p className="mt-2 text-sm text-emerald-100/70">Last updated: May 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-emerald-100/90">
          <section>
            <h2 className="text-lg font-medium text-emerald-50">Summary</h2>
            <p className="mt-2">
              OpenAstroids is a privacy-respecting game. We do not collect, store, or transmit any
              personal data to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Data Collection</h2>
            <p className="mt-2">
              <strong>We collect nothing on our servers.</strong> OpenAstroids runs entirely in your
              browser. No analytics, no tracking pixels, no cookies, and no server-side data storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Local Storage</h2>
            <p className="mt-2">
              The game stores one number locally in your browser: your best high score (key:{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-emerald-100">openastroids-highscore</code>
              ). This value never leaves your device and is not sent over the network.
            </p>
            <p className="mt-2">
              Clearing site data, using a private browsing window, or blocking storage in your browser
              will reset or prevent saving your high score. In-progress game state is not saved and is
              lost when you refresh or close the page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Third Parties</h2>
            <p className="mt-2">
              We do not share any data with third parties. The high score stays on your device only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Open Source</h2>
            <p className="mt-2">
              OpenAstroids is open source under the AGPL-3.0 license. You can inspect the source
              code to verify these privacy claims.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Contact</h2>
            <p className="mt-2">
              For questions about this privacy policy, please open an issue on the project&apos;s
              GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

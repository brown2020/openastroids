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
              personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Data Collection</h2>
            <p className="mt-2">
              <strong>We collect nothing.</strong> OpenAstroids runs entirely in your browser. No
              analytics, no tracking pixels, no cookies, no server-side data storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Local Storage</h2>
            <p className="mt-2">
              The game does not currently use cookies, local storage, or session storage. Game
              state and scores exist only in memory for the current browser session and are lost
              when you refresh or close the page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Third Parties</h2>
            <p className="mt-2">
              We do not share any data with third parties because we do not collect any data.
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

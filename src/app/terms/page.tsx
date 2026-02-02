import Link from "next/link";

export const metadata = {
  title: "Terms of Service - OpenAstroids",
  description: "Terms of service for OpenAstroids, an open-source Asteroids game.",
};

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#05070a] px-6 py-12 text-emerald-50">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-block text-sm text-emerald-100/70 transition hover:text-emerald-100"
        >
          &larr; Back to game
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-wide">Terms of Service</h1>
        <p className="mt-2 text-sm text-emerald-100/70">Last updated: February 2025</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-emerald-100/90">
          <section>
            <h2 className="text-lg font-medium text-emerald-50">License</h2>
            <p className="mt-2">
              OpenAstroids is free software licensed under the GNU Affero General Public License
              version 3 (AGPL-3.0). You are free to use, modify, and distribute this software
              under the terms of that license.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">No Warranty</h2>
            <p className="mt-2">
              This software is provided &ldquo;as is&rdquo;, without warranty of any kind, express
              or implied, including but not limited to the warranties of merchantability, fitness
              for a particular purpose, and noninfringement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Limitation of Liability</h2>
            <p className="mt-2">
              In no event shall the authors or copyright holders be liable for any claim, damages,
              or other liability, whether in an action of contract, tort, or otherwise, arising
              from, out of, or in connection with the software or the use or other dealings in the
              software.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Use at Your Own Risk</h2>
            <p className="mt-2">
              You use this game at your own risk. While we strive to make it enjoyable and
              bug-free, we make no guarantees about its behavior or availability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-emerald-50">Source Code</h2>
            <p className="mt-2">
              The complete source code for OpenAstroids is available on GitHub. Per the AGPL-3.0
              license, if you modify and deploy this software, you must make your modifications
              available under the same license.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

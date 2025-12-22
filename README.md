## OpenAstroids

OpenAstroids is a modern, open-source remake of the classic **Asteroids** arcade game — built with **Next.js + TypeScript** and a lightweight **Canvas** renderer.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open `http://localhost:3000` with your browser to play.

## Controls (Desktop)

- **Rotate**: `A/D` or `←/→`
- **Thrust**: `W` or `↑`
- **Fire**: `Space`
- **Hyperspace**: `Shift`
- **Pause**: `P`
- **Start**: `Enter`

## Controls (Touch)

Use the on-screen buttons for rotate, thrust, fire, and hyperspace.

## Dev Notes

- Game logic lives in `src/lib/openastroids/*` (pure TypeScript).
- UI lives in `src/app/page.tsx` (single client canvas).

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See `LICENSE.md`.

> AGPL note: if you run a modified version of this project and make it available to users over a network, you must also offer the complete corresponding source to those users (see AGPLv3 §13).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

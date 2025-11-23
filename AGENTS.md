# Repository Guidelines

Follow these notes to stay aligned with the repo’s layout, tooling, and review expectations.

## Project Structure & Modules
- Root docs: `README.md`, `DEVELOP.md` (dev standards), `docs/` (feature notes), `FUTURE_IMPROVEMENTS.md`.
- Frontend app lives in `frontend/` (Next.js App Router, TypeScript, Tailwind + Shadcn). Key paths: `src/app` (routes + API handlers), `src/components` (reusable UI; feature folders under `components/*`), `src/lib` (helpers such as `claude.ts`, `fal.ts`, `storage.ts`), `public/` (static assets).
- Data samples sit in `dataset/` and `.jpg` examples at repo root; avoid adding large binaries to git without compression/justification.

## Build, Test, and Development Commands
Run everything from `frontend/` with `bun` (per `DEVELOP.md`):
- Install deps: `bun install`
- Dev server: `bun dev` (Next.js at http://localhost:3000)
- Production build: `bun run build` (uses webpack flag already set)
- Start built app: `bun start`
- Lint: `bun run lint`
No automated tests are checked in yet; add them before shipping riskier changes.

## Coding Style & Naming Conventions
- Language: TypeScript; components in `.tsx`, logic in `.ts`. Functional components, hooks where stateful.
- Styling: Tailwind utility classes plus Shadcn UI primitives. Keep variants in `components/ui`.
- Imports: use absolute paths from `src` only if configured; otherwise relative. Prefer named exports and PascalCase for components, camelCase for functions/variables, UPPER_SNAKE for env keys.
- Formatting: follow ESLint (`eslint.config.mjs`); prefer single quotes and 2-space indentation as seen in `src/app/page.tsx`. Run `bun run lint` before PRs.

## Testing Guidelines
- Add tests alongside code (`*.test.ts` / `*.test.tsx`) or under `src/__tests__`. Use Vitest or Jest + React Testing Library; mock remote clients (`claude`, `fal`) to avoid network calls.
- For UI flows that hit APIs, include loading/error state assertions (required for remote ops per `DEVELOP.md`).

## Commit & Pull Request Guidelines
- Commit style observed: short, imperative summaries (e.g., `add frontend`, `fix build`). Keep related changes together.
- PR checklist: describe scope and rationale; link issues/linear tickets; include screenshots or clips for UI changes; note env var needs (e.g., `ANTHROPIC_MODEL`, external API keys); confirm lint/build/tests executed (`bun run lint`, future `bun test`).

## Security & Configuration
- Store secrets in `.env`/`.env.local`; never commit them. Document required keys in PRs.
- Remote operations (image generation, AI analysis): show loading state, enforce timeout (~120s default), and surface user-friendly errors (see `DEVELOP.md`).

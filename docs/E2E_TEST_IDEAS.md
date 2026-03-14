# E2E Test Ideas (Trivia Jam)

Brainstorm for Playwright E2E tests that run in CI. The app needs **multiple participants** to start a game (host + ≥1 player; host needs questions).

## Constraints

- **Backend**: Remix + Cloudflare Workers + Durable Objects + WebSockets. E2E must run the real app (`npm run dev`) or hit a stable staging URL.
- **Questions**: Host must have questions to start. Today that means **PARSE_QUESTIONS** (Gemini). For CI: avoid Gemini (slow, flaky, key in secrets) unless we add a test key and accept cost/flakiness.
- **Multi-player**: Use Playwright **browser contexts** (or multiple pages): one context = one “device” / one session. Host and player get different cookies/session, so they are different users.

## Scenarios that work well in CI (no Gemini)

| Scenario | What it proves | Notes |
|----------|----------------|-------|
| **Homepage → Create Game → Host sees Game Setup** | Host flow loads; Game Setup and “Import Questions” are visible | One context. No questions needed. |
| **Player joins lobby** | Player can open game URL, see Join Game, enter name, join, see “Waiting for host…” (or player list) | Need a **game URL**. Either host creates game in same test (2 contexts) or we create game via API/seed. |
| **Host creates game, player joins same game** | Full lobby flow: host has game URL, player uses it, both see each other in lobby | 2 contexts. Host doesn’t need to add questions for “players in lobby” to show. |
| **Host sees “Start Game” disabled** | When there are no questions (or no players), Start Game is disabled | One context; no questions. |

## Scenarios that need questions (harder in CI)

| Scenario | What it proves | Options |
|----------|----------------|--------|
| **Full game: start → one question → answer → results** | Full happy path | (1) **Seed questions**: add test-only API or service event to set questions on a game (no Gemini). (2) **Use Gemini in CI**: set `GEMINI_API_KEY` in GitHub secrets; one minimal parse; accept ~5–10s and possible flakiness. |
| **Host imports questions (paste + submit)** | Parse flow and error handling | Same as above: seed or real Gemini. |

## Recommended first tests (CI without Gemini)

1. **Host: homepage → Create Game → Game Setup visible**  
   - Go to `/` → click “Create New Game” → expect Game Setup (e.g. “Import Questions”, “Share Game Link”, “Start Game” disabled or similar).

2. **Two contexts: host creates game, player joins**  
   - Context A (host): go to `/` → Create New Game → copy or read game URL from “Share Game Link”.  
   - Context B (player): go to that game URL → see “Join Game” → fill “Your Name” → Join → see lobby (e.g. “Waiting for host…” or player list with host + self).  
   - Optional: host sees “Players (1/…)” or “Players (2/…)” after player joins.

3. **Player: join page shows Join form**  
   - Go to `/games/:gameId` (use a known test game ID or one created in step 2) → expect “Your Name” and “Join Game” (and optionally “How to Play”).

## Future: full game with questions

- **Option A – Seed questions**: Add a test-only mechanism (e.g. `QUESTIONS_PARSED`-style event from a test helper, or internal API) to set questions on a game. Then E2E: host creates game → seed questions → host starts game → player joins (or already in lobby) → one question → player answers → see results.
- **Option B – Gemini in CI**: Store `GEMINI_API_KEY` in GitHub secrets; in E2E, host pastes a tiny doc (e.g. “2+2? 4”) and submits; wait for parse; then start game and run one question. Slower and slightly flaky.
- **Smoke test (real Gemini)**: Keep one tiny Playwright test that pastes a short doc (e.g. `"What is 2 + 2?\n4"`) and asserts that at least one parsed question appears. This runs against the live Gemini API using `GEMINI_API_KEY` in CI and is tagged as `` so it can be filtered if needed.

## Tech notes

- **Base URL**: `http://localhost:8787` (wrangler dev) or from `PLAYWRIGHT_BASE_URL`. In CI, start app with `npm run dev` (or `wrangler dev` + remix) then run Playwright.
- **Stability**: Prefer `getByRole` and `getByLabelText`; wait for network/WebSocket to settle (e.g. wait for “Players (1/…)” or “Join Game” to be visible) to avoid flakiness.
- **Game ID**: For “player joins” in isolation, either create a game in the same test (2 contexts) or have a seeded test game ID (faster, but requires seed script or fixture).

# ZenBreath

ZenBreath is a single-page mindfulness breathing app with guided 4-phase breathing, ambient soundscapes, and immersive visual feedback.

## Local Run
Open `ZenBreath.html` directly in a modern Chromium browser.

## Test
```bash
npm install
npx playwright install chromium
npm run test:e2e
```

## Docs
- `docs/requirements.md`
- `docs/technical.md`
- `docs/testing.md`
- `docs/test-report-2026-02-21.md`
- `docs/release-notes-v0.1.0.md`

## Deploy (Vercel)
- `vercel.json` rewrites `/` to `/ZenBreath.html`.
- Connect GitHub repo once in Vercel, then pushes auto-deploy.

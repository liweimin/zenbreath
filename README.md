# ZenBreath

ZenBreath is a single-page mindfulness breathing app with guided 4-phase breathing, ambient soundscapes, and immersive visual feedback.

## Local Run
Open `ZenBreath.html` directly in a modern Chromium browser.

## Test
```bash
npm install
npx playwright install chromium
npm run test:e2e
npm run test:e2e:all
npm run test:online-smoke
```

If external network is restricted, set proxy before online smoke:
```powershell
$env:HTTP_PROXY="http://127.0.0.1:7897"
$env:HTTPS_PROXY="http://127.0.0.1:7897"
$env:TARGET_URL="https://zenbreath-wheat.vercel.app/"
npm run test:online-smoke
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

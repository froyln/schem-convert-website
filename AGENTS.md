## Working conventions for AI agents

- Read [CLAUDE.md](CLAUDE.md) — it points here and to `PLAN.md`.
- This is a React (Vite) + Express website. `api.js` is a full `express()` app (not a bare
  `Router`) mounted by both `vite.config.js` (dev) and `server.js` (prod) — a bare Router loses
  `res.json`/`req.query` when used as raw connect middleware, only a full app instance sets up
  Express's request/response prototypes on every request.
- `api.js` is a thin wrapper over `@froyln/schem-convert-lib` (`inspectFile`, `convertFile`,
  `SUPPORTED`, `PRE_FLATTENING_MC_VERSION`) — no conversion logic lives here. Uploads stay in
  memory (`express.raw`), nothing is written to disk.
- Conversion bugs (wrong substitution, dropped property, bad sign/item translation) belong in
  `@froyln/schem-convert-lib`, not here — this repo has no conversion logic and no conversion
  tests to fix them against.
- Don't add dependencies for what a few lines of Express/React/the browser already cover.
- No secrets in code or commits.

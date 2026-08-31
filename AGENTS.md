## Working conventions for AI agents

- Read [CLAUDE.md](CLAUDE.md) — it points here and to `PLAN.md`.
- Don't add dependencies for what discord.js/node stdlib already cover.
- No secrets in code or commits — `TOKEN`/`CLIENT_ID` come from `.env` only.
- Conversion bugs (wrong substitution, dropped property, bad sign/item translation) belong in
  `@froyln/schem-convert-lib`, not here — this repo has no conversion logic and no conversion
  tests to fix them against.

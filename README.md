# Schem Converter
A website for converting Litematica `.litematic` schematics between Minecraft versions — the
same job as the [Schem-Converter Discord bot](https://github.com/CodeW4VE/Schem-Converter), on
the web. Powered by [`@froyln/schem-convert-lib`](https://www.npmjs.com/package/@froyln/schem-convert-lib).

Drop a `.litematic` file, see its detected source version, pick a target version, and download
the converted file along with a report of any block/item substitutions made.

<img width="920" height="480" alt="image" src="https://github.com/user-attachments/assets/b8124aad-3aa1-4fdc-998d-eee43198cf64" />

## Develop

```bash
npm install
npm run dev
```

## Build & run

```bash
npm run build
npm start
```

## Test

```bash
npm test
```

## Deploy

GitHub Pages only serves static files, so the frontend and API deploy separately:

- **Frontend** — `.github/workflows/deploy-pages.yml` builds and deploys `dist/` to GitHub Pages
  on every push to `main`. It builds with `VITE_BASE=/schem-convert-website/` (the Pages subpath)
  and `VITE_API_URL` set from the repo variable `API_URL`.
- **API** — deploy `render.yaml` as a Render Blueprint (or run `node server.js` on any Node
  host). Once you have its URL, set it as a repo variable so the next Pages build picks it up:

  ```bash
  gh variable set API_URL --body "https://<your-api>.onrender.com"
  ```

  Then re-run the Pages workflow (push, or `gh workflow run deploy-pages.yml`).

Building without `VITE_BASE`/`VITE_API_URL` set (the default) keeps `npm run build && npm start`
working as a single self-hosted app, same-origin API included.

# CDN sync

Project images live in [joppekoers/cdn.joppekoers.nl](https://github.com/joppekoers/cdn.joppekoers.nl) under `projectImg/<project>/`. The app container keeps a clone of that repo and updates it when told to.

## Flow

1. A push to `main` in the cdn repo runs `.github/workflows/sync.yaml` there.
2. The workflow sends `POST https://joppekoers.nl/api/sync-cdn` with `Authorization: Bearer <SYNC_TOKEN>`.
3. The backend (`backend/src/syncCdn.ts`) runs `git fetch origin main && git reset --hard origin/main` in `/app/cdn`. If there is no clone yet, it clones instead.
4. It clears the cached project list and replies `{ "from": "<old sha>", "to": "<new sha>" }`.

Changed images get a new mtime, so their `?v=` changes and browsers and Cloudflare fetch the new version. `/projects-list` can stay cached at the Cloudflare edge for up to 60 seconds.

## Responses

| Status | Meaning |
|---|---|
| 200 | Synced; body is `{ from, to }`. `from` is `null` after the first clone. |
| 401 | Missing or wrong token |
| 409 | A sync is already running |
| 500 | git failed; body is git's error output |
| 503 | `SYNC_TOKEN` is not set on the server |

## Run it yourself

From the cdn repo:

```sh
SYNC_TOKEN=<token> ./sync.sh
```

`SYNC_URL` defaults to `https://joppekoers.nl/api/sync-cdn`. Or run the workflow from the Actions tab (Run workflow).

## Configuration

| Variable | Container value | Purpose |
|---|---|---|
| `SYNC_TOKEN` | from `.env`, at least 32 characters | Bearer token for the endpoint |
| `CDN_REPO_DIR` | `/app/cdn` | Where the clone lives (`./cdn` on the host) |
| `PROJECTS_DIR` | `/app/cdn/projectImg` | Folder the site reads projects from |
| `CACHE_DIR` | `/app/cache` | Resized image cache (`./cache` on the host), kept outside the clone |
| `CDN_REPO_URL` | default `https://github.com/joppekoers/cdn.joppekoers.nl.git` | Repo to clone |

Local development: `docker compose up` mounts `./cdn` and `./cache` in this repo (both git-ignored), not your own `../cdn.joppekoers.nl` clone, because a sync runs `git reset --hard`.

## Rotating the token

1. Generate a new one: `openssl rand -hex 32`.
2. Put it in the server `.env` and run `docker compose -f docker-compose.prod.yaml up -d`.
3. Update the secret: `gh secret set SYNC_TOKEN --repo joppekoers/cdn.joppekoers.nl`.

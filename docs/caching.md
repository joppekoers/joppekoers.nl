# Caching

The backend sets every TTL via `Cache-Control` in `backend/src/cacheControl.ts`. Cloudflare respects those headers. To change a TTL, edit that file and deploy.

| Route | Browser | Edge |
|---|---|---|
| `/assets/*` (hashed) | 1 year | 1 year |
| `index.html` / SPA routes | revalidate | 10s + stale-while-revalidate |
| `/projects-list` | revalidate | 60s + stale-while-revalidate |
| `/projects/*?v=<mtime>` | 1 year | 1 year |
| `frontend/static/*` | 1 week | 1 week |
| `/cv`, `/media/CV Joppe Koers.pdf` | 60s | 60s |
| `/media/*` | revalidate | revalidate |
| `/drop/*` | never | never |
| 404 | revalidate | 60s |
| 400 / 5xx | never | never |

## Verify

```sh
curl -sI https://joppekoers.nl/projects-list | grep -iE 'cache-control|cf-cache-status'
```

Run it twice. The second request should show `HIT`. `DYNAMIC` means the cache rule is missing.

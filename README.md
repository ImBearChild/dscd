# DSCD — Deadly Simple Clash Dashboard

A single-file, zero-dependency dashboard for clash-meta. Open `dist/dashboard.html` in any browser and you're done.

## Quick Start

```bash
pnpm install
pnpm build       # → dist/dashboard.html
```

Open `dist/dashboard.html` directly (works from `file://`) and point it at your clash API.

## URL Parameters

Pre-fill connection details via query string (compatible with Yacd/metacubexd):

```
dashboard.html?hostname=192.168.1.1&port=9090&secret=mytoken
```

| Param      | Description                          |
|------------|--------------------------------------|
| `hostname` | clash API host (without protocol)    |
| `port`     | clash API port (default: 9090)       |
| `secret`   | clash API secret                     |

**Priority:** URL params > localStorage > default (`http://127.0.0.1:9090`)

When `hostname` is present, auto-connect is attempted on load.

## Features

- **Proxy groups** — dropdown switching, latency testing
- **Traffic monitor** — real-time upload/download rates via WebSocket
- **Connection table** — active connections with auto-refresh
- **Log viewer** — streaming logs with level filter
- **Toast notifications** — operation feedback

## Tech Stack

| Layer      | Choice                                      |
|------------|---------------------------------------------|
| UI         | [VanJS](https://vanjs.org/) (~1 KB)         |
| Language   | TypeScript (strict)                         |
| Bundler    | [esbuild](https://esbuild.github.io/)       |
| CSS        | Plain CSS, dark theme, CSS variables        |
| Output     | Single `dashboard.html`, zero dependencies  |

## Commands

| Command        | Description                  |
|----------------|------------------------------|
| `pnpm check`   | Type-check with `tsc --noEmit` |
| `pnpm build`   | Bundle + inject into HTML    |
| `pnpm dev`     | Watch mode                   |

## Prerequisites

Clash needs CORS enabled for `file://` usage:

```yaml
external-controller-cors:
  allow-private-network: true
```

## License

MIT

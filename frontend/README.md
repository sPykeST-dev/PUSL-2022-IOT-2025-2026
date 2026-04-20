# Frontend

React 18 + Vite application served via Nginx inside Docker.

See the root [README](../README.md) for setup and running instructions.

## Local Development (without Docker)

```bash
npm install
npm run dev
```

Set `VITE_API_URL` to point at the backend:

```bash
VITE_API_URL=http://localhost:8080 npm run dev
```

## Build

```bash
VITE_API_URL=/ npm run build
```

The Docker image runs this build and serves `dist/` via Nginx, which proxies `/api/*` to the backend container.

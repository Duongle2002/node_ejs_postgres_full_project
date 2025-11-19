# React Frontend

This React app mirrors the backend EJS views and talks to the Node API under `/api` via a Vite dev proxy.

## Develop

1. Ensure the backend is running on `http://localhost:3002` (`PORT=3002` in `.env`).
2. Start the frontend dev server:

```powershell
# from frontend/
npm install
npm run dev
```

- Open the shown URL (default `http://localhost:5173`).
- All API calls go to `/api` which is proxied to `http://localhost:3002` in `vite.config.js`.

## Build

```powershell
npm run build
npm run preview
```

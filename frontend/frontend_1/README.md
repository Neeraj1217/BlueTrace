# Blue Trace Dashboard

Maritime spill investigation dashboard — data-driven UI for ranking vessel association with detected spills.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Data

The dashboard loads from `/sample_api_response.json` by default. Override with:

```bash
VITE_API_URL=https://your-api/investigation.json npm run dev
```

See `DASHBOARD_SPEC.md` for the full API contract.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run preview` — preview production build

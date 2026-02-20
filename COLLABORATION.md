# AR Peak Finder — Collaboration Guide

## The "Shared Contract" Rule

All data structures are defined in **`src/types/index.ts`**. This is the single source of truth.

| Want to …                        | Do this first                                               |
| -------------------------------- | ----------------------------------------------------------- |
| Add a new field to a type        | Open a PR that **only** touches `src/types/index.ts`        |
| Rename or remove a field         | Discuss in an issue → agree → PR to `src/types/index.ts`    |
| Add a brand-new interface        | Same as above — types file first, implementation after      |

> [!IMPORTANT]
> Never add ad-hoc inline types for data that crosses a boundary (hook → component, worker → main thread). Extend the shared contracts instead.

---

## Component Purity

```
┌──────────────┐     ┌──────────┐     ┌────────────────┐
│  Hooks       │────▶│  Store   │────▶│  Components    │
│  (sensors)   │     │ (Zustand)│     │  (UI / AR)     │
└──────────────┘     └──────────┘     └────────────────┘
       ▲                                       │
       │           ┌──────────┐                │
       └───────────│  Worker  │◀───────────────┘
                   │  (math)  │
                   └──────────┘
```

- **Components** (`src/components/`) read from hooks or the store. They **never** contain geospatial math.
- **Hooks** (`src/hooks/`) manage browser APIs and push data into the Zustand store.
- **Utils** (`src/utils/`) are pure functions — no side-effects, no React imports.
- **Worker** (`src/workers/`) runs heavy computation off-thread, communicating via `WorkerRequest` / `WorkerResponse`.

---

## Review Process

Because each layer has clearly typed inputs and outputs:

1. **Pick a file** — look at its imports to know what types it consumes.
2. **Check the contract** — verify inputs/outputs match `src/types/index.ts`.
3. **Ignore internals** — the implementation can change freely as long as the contract holds.

This means **either developer** can review any PR by focusing on the typed boundary, regardless of who wrote it.

---

## Formatting & Linting

Formatting is enforced by **Prettier** (`.prettierrc`) and **ESLint** (`eslint.config.js`).

```bash
# Format all files
npx prettier --write .

# Lint
npx eslint src/

# Type-check (no emit)
npx tsc --noEmit
```

Run these before every commit to prevent merge conflicts caused by style differences.

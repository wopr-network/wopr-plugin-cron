# wopr-plugin-cron

Cron scheduling plugin for WOPR — recurring and one-time message injection with optional script execution.

## Build

```bash
npm run build        # tsc
npm run check        # biome check + tsc --noEmit
npm run lint         # biome check
npm run lint:fix     # biome check --fix
npm run format       # biome format --write
npm run test         # vitest run
```

## Architecture

- `src/index.ts` — Plugin entry (default export, init/shutdown lifecycle)
- `src/cron-schema.ts` — PluginSchema + Zod types for cron_jobs and cron_runs tables
- `src/cron-repository.ts` — Async CRUD via `Repository<T>` from plugin-types
- `src/cron.ts` — Pure functions: cron parsing, time spec parsing, script execution
- `src/cron-tick.ts` — 30s tick loop that evaluates and fires due cron jobs
- `src/cron-a2a-tools.ts` — A2A tool definitions (schedule, once, list, cancel, history)
- `src/cron-commands.ts` — CLI subcommand handler (talks to daemon via HTTP client)
- `src/cron-client.ts` — HTTP client for daemon API

## Contract

This plugin imports ONLY from `@wopr-network/plugin-types`. It never imports from wopr core directly.

## Issue Tracking

Linear: WOP project, label `wopr-plugin-cron`

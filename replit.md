# Armani Duty Free

An elevated airport duty-free storefront with RFID-assisted self-checkout, travel eligibility, and collection reservations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/armani-duty-free/src/App.tsx` — customer storefront, basket, checkout, and reservation routes
- `artifacts/armani-duty-free/src/index.css` — Armani Duty Free visual language and responsive styles
- `artifacts/api-server/src/data/catalog.ts` — catalog, RFID tags, and store context
- `artifacts/api-server/src/routes/storefront.ts` — catalog, quote, RFID, checkout, and status APIs
- `artifacts/api-server/src/routes/graphql.ts` — lightweight GraphQL storefront query endpoint
- `lib/api-spec/openapi.yaml` — source of truth for generated REST hooks and schemas

## Architecture decisions

- The storefront is a deployable React/Vite artifact at `/`; the shared API server owns `/api` routes.
- Basket state is persisted locally for a fast airport-terminal flow; checkout returns a reservation for gate collection.
- RFID supports Web Serial readers when available and manual tag entry as a browser-safe fallback.
- GraphQL is exposed at `/api/graphql` for catalog and store-status queries alongside the generated REST surface.

## Product

Customers can browse a curated Armani catalog, search and filter by category, build a basket, see duty-free savings, add items by RFID tag, provide destination and flight details, and reserve a completed order for collection after security.

## User preferences

- Build the experience as a complete hostable website for an Armani duty-free self-checkout store.

## Gotchas

- Keep Terminal 3 copy aligned with the live store status returned by the API.
- Regenerate API hooks after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

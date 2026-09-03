# Deploy Armani Duty Free to Vercel

This repository is configured to deploy the storefront and its API from one
Vercel project.

## Deploy from the Vercel dashboard

1. Download the project as a ZIP from Replit, or push the repository to GitHub.
2. In Vercel, choose **Add New Project** and import the repository.
3. Keep the repository root as the Vercel **Root Directory**.
4. Vercel will use the settings in `vercel.json`:
   - Install: `pnpm install --frozen-lockfile`
   - Build: `pnpm --filter @workspace/armani-duty-free run build`
   - Output: `artifacts/armani-duty-free/dist/public`
5. Add these environment variables in the Vercel project before deploying:
   - `CLERK_PUBLISHABLE_KEY` — the server-side Clerk publishable key
   - `CLERK_SECRET_KEY` — the server-side Clerk secret key
   - `VITE_CLERK_PUBLISHABLE_KEY` — the same Clerk publishable key exposed to the Vite build
   - `DATABASE_URL` — the PostgreSQL connection string used by the customer account table
6. Click **Deploy**.

Never commit these values to the repository or paste them into client-side code.

## Deploy with the Vercel CLI

From the repository root:

```bash
pnpm dlx vercel
```

For a production deployment:

```bash
pnpm dlx vercel --prod
```

## Routes after deployment

- Storefront: `/`
- Registration: `/sign-up`
- Sign in: `/sign-in`
- Customer account: `/account`
- Checkout: `/checkout`
- Order confirmation: `/order/:id`
- REST API: `/api/catalog`, `/api/cart/quote`, `/api/rfid/scan`, `/api/checkout`
- GraphQL API: `/api/graphql`

The `api/` directory exposes the existing Express API as Vercel serverless
functions. The frontend's generated API client already calls `/api`, so no
frontend URL changes are needed.

## Production notes

Customer authentication is handled by Clerk. The account table is keyed by
the authenticated Clerk user ID, so a typed customer ID can never unlock
another customer's store credit. Quotes apply available credit, and checkout
deducts it with an atomic balance guard.

The catalog and reservation response are still demo data held in server
memory, while the basket is stored in the shopper's browser. Add a durable
orders table and payment provider before using this as a live retail checkout.
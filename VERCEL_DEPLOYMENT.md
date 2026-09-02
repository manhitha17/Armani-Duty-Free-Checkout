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
5. Click **Deploy**.

No environment variables are required for the demo version.

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
- Checkout: `/checkout`
- Order confirmation: `/order/:id`
- REST API: `/api/catalog`, `/api/cart/quote`, `/api/rfid/scan`, `/api/checkout`
- GraphQL API: `/api/graphql`

The `api/` directory exposes the existing Express API as Vercel serverless
functions. The frontend's generated API client already calls `/api`, so no
frontend URL changes are needed.

## Production notes

The current catalog and order reservations are demo data held in server
memory, while the basket is stored in the shopper's browser. Add a database
and payment provider before using this as a live retail checkout.
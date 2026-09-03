import { Router, type IRouter } from "express";
import {
  CompleteCheckoutBody,
  CompleteCheckoutResponse,
  GetFeaturedProductsResponse,
  GetStoreStatusResponse,
  ListCatalogQueryParams,
  ListCatalogResponse,
  QuoteCartBody,
  QuoteCartResponse,
  ScanRfidBody,
  ScanRfidResponse,
} from "@workspace/api-zod";
import { catalog, findProduct, findProductByTag, storeStatus } from "../data/catalog.js";
import { requireCustomer } from "../middlewares/requireCustomer.js";
import { db, customerAccountsTable } from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";

const router: IRouter = Router();

function quoteItems(
  items: Array<{ productId?: string; quantity?: number }>,
) {
  return items.flatMap((item) => {
    if (!item.productId || item.quantity === undefined) return [];
    const product = findProduct(item.productId);
    if (!product) return [];
    return [
      {
        product,
        quantity: item.quantity,
        lineTotal: Number((product.price * item.quantity).toFixed(2)),
      },
    ];
  });
}

router.get("/catalog", (req, res) => {
  const filters = ListCatalogQueryParams.parse(req.query);
  const search = filters.search?.trim().toLowerCase();
  const products = catalog.filter((product) => {
    const categoryMatch =
      !filters.category ||
      filters.category === "All" ||
      product.category.toLowerCase() === filters.category.toLowerCase();
    const searchMatch =
      !search ||
      `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(search);
    return categoryMatch && searchMatch;
  });
  res.json(ListCatalogResponse.parse(products));
});

router.get("/catalog/featured", (_req, res) => {
  res.json(
    GetFeaturedProductsResponse.parse(
      catalog.filter((product) =>
        ["Bestseller", "Iconic", "New", "Airport exclusive"].includes(
          product.badge,
        ),
      ),
    ),
  );
});

router.post("/cart/quote", requireCustomer, async (req, res) => {
  const input = QuoteCartBody.parse(req.body);
  const items = quoteItems(input.items);
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
  );
  const compareTotal = items.reduce(
    (sum, item) => sum + item.product.compareAtPrice * item.quantity,
    0,
  );
  const savings = Number(Math.max(compareTotal - subtotal, 0).toFixed(2));
  const duties = 0;
  const eligible = Boolean(input.destination && input.flightTime);
  const [account] = req.customerId
    ? await db.select().from(customerAccountsTable).where(eq(customerAccountsTable.clerkUserId, req.customerId)).limit(1)
    : [];
  const storeCreditCents = account?.storeCreditCents ?? 0;
  const subtotalCents = Math.round((subtotal + duties) * 100);
  const creditAppliedCents = Math.min(storeCreditCents, subtotalCents);
  const total = Number(((subtotalCents - creditAppliedCents) / 100).toFixed(2));
  res.json(
    QuoteCartResponse.parse({
      items,
      subtotal,
      savings,
      duties,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      eligible,
       storeCreditCents,
       creditAppliedCents,
      message: eligible
        ? "You're all set for collection before boarding."
        : "Add your destination and flight time to confirm collection.",
    }),
  );
});

router.post("/rfid/scan", requireCustomer, (req, res) => {
  const input = ScanRfidBody.parse(req.body);
  const product = findProductByTag(input.tagId) ?? null;
  res.json(
    ScanRfidResponse.parse({
      tagId: input.tagId,
      found: Boolean(product),
      product,
      message: product
        ? `${product.name} recognized and ready to add.`
        : "We couldn't recognize that tag. Try scanning again or search by name.",
    }),
  );
});

router.post("/checkout", requireCustomer, async (req, res) => {
  const input = CompleteCheckoutBody.parse(req.body);
  if (req.customerEmail && input.email.trim().toLowerCase() !== req.customerEmail.trim().toLowerCase()) {
    res.status(400).json({
      error: "Receipt email must match the signed-in account",
      message: "Use the verified email address on your Armani account.",
    });
    return;
  }
  const items = quoteItems(input.items);
  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const subtotalCents = Math.round(subtotal * 100);
  let storeCreditCents = 0;
  if (req.customerId) {
    const [account] = await db
      .select()
      .from(customerAccountsTable)
      .where(eq(customerAccountsTable.clerkUserId, req.customerId))
      .limit(1);
    storeCreditCents = account?.storeCreditCents ?? 0;
    const creditAppliedCents = Math.min(storeCreditCents, subtotalCents);
    if (creditAppliedCents > 0) {
      const [updated] = await db
        .update(customerAccountsTable)
        .set({
          storeCreditCents: sql`${customerAccountsTable.storeCreditCents} - ${creditAppliedCents}`,
        })
        .where(and(
          eq(customerAccountsTable.clerkUserId, req.customerId),
          gte(customerAccountsTable.storeCreditCents, creditAppliedCents),
        ))
        .returning({ storeCreditCents: customerAccountsTable.storeCreditCents });
      if (!updated) {
        res.status(409).json({
          error: "Store credit changed",
          message: "Your store credit changed in another session. Refresh and try again.",
        });
        return;
      }
      storeCreditCents = creditAppliedCents;
    } else {
      storeCreditCents = 0;
    }
  }
  const total = Number(((subtotalCents - storeCreditCents) / 100).toFixed(2));
  const orderId = `ARM-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const result = {
    orderId,
    total,
    collectionPoint: storeStatus.collectionPoint,
    collectionWindow: "Ready 45 minutes before departure · until boarding",
    message: `Thank you. Your order is reserved for ${input.flightNumber.toUpperCase()}.`,
  };
  req.log.info(
    { orderId, itemCount: items.length, total, destination: input.destination },
    "Self-checkout completed",
  );
  res.json(CompleteCheckoutResponse.parse(result));
});

router.get("/store/status", (_req, res) => {
  res.json(GetStoreStatusResponse.parse(storeStatus));
});

export default router;

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
import { catalog, findProduct, findProductByTag, storeStatus } from "../data/catalog";

const router: IRouter = Router();

function quoteItems(items: Array<{ productId: string; quantity: number }>) {
  return items.flatMap((item) => {
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

router.post("/cart/quote", (req, res) => {
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
  const total = Number((subtotal + duties).toFixed(2));
  res.json(
    QuoteCartResponse.parse({
      items,
      subtotal,
      savings,
      duties,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      eligible,
      message: eligible
        ? "You're all set for collection before boarding."
        : "Add your destination and flight time to confirm collection.",
    }),
  );
});

router.post("/rfid/scan", (req, res) => {
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

router.post("/checkout", (req, res) => {
  const input = CompleteCheckoutBody.parse(req.body);
  const items = quoteItems(input.items);
  const total = Number(
    items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
  );
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

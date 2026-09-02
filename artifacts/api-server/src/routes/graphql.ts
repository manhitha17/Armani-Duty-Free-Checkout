import { Router, type IRouter } from "express";
import { catalog, findProduct, storeStatus } from "../data/catalog";

const router: IRouter = Router();

function projectProduct(product: (typeof catalog)[number], selection: string) {
  const fields = selection.match(/\{([\s\S]*)\}/)?.[1] ?? "";
  const requested = fields.match(/[A-Za-z][A-Za-z0-9]*/g) ?? [];
  const safeFields = requested.filter((field) =>
    [
      "id",
      "name",
      "brand",
      "category",
      "price",
      "compareAtPrice",
      "image",
      "description",
      "size",
      "badge",
      "rfidTag",
    ].includes(field),
  );
  return Object.fromEntries(
    (safeFields.length
      ? safeFields
      : ["id", "name", "brand", "category", "price", "image", "badge"]
    ).map((field) => [field, product[field as keyof typeof product]]),
  );
}

router.post("/graphql", (req, res) => {
  const query =
    typeof req.body?.query === "string" ? req.body.query : "";
  if (!query) {
    res.status(400).json({
      data: null,
      errors: [{ message: "A GraphQL query is required." }],
    });
    return;
  }

  try {
    const data: Record<string, unknown> = {};
    if (query.includes("featuredProducts")) {
      const selection =
        query.match(/featuredProducts\s*(\{[\s\S]*?\})/)?.[1] ?? "";
      data.featuredProducts = catalog
        .filter((product) =>
          ["Bestseller", "Iconic", "New", "Airport exclusive"].includes(
            product.badge,
          ),
        )
        .map((product) => projectProduct(product, selection));
    }
    if (query.includes("products")) {
      const selection = query.match(/products\s*(\{[\s\S]*?\})/)?.[1] ?? "";
      data.products = catalog.map((product) =>
        projectProduct(product, selection),
      );
    }
    if (query.includes("storeStatus")) {
      data.storeStatus = storeStatus;
    }
    const productId = query.match(/product\s*\(\s*id\s*:\s*"([^"]+)"/)?.[1];
    if (productId) {
      const product = findProduct(productId);
      const selection = query.match(/product\s*\([\s\S]*?\)\s*(\{[\s\S]*?\})/)?.[1] ?? "";
      data.product = product ? projectProduct(product, selection) : null;
    }
    res.json({ data });
  } catch (error) {
    req.log.warn({ error }, "GraphQL request could not be resolved");
    res.status(400).json({
      data: null,
      errors: [{ message: "We couldn't process that GraphQL request." }],
    });
  }
});

export default router;

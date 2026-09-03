import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storefrontRouter from "./storefront";
import graphqlRouter from "./graphql";
import { requireCustomer } from "../middlewares/requireCustomer";
import { db, customerAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetCustomerAccountResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storefrontRouter);
router.use(graphqlRouter);
router.use("/account", requireCustomer, async (req, res) => {
  if (!req.customerId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const [existing] = await db
    .select()
    .from(customerAccountsTable)
    .where(eq(customerAccountsTable.clerkUserId, req.customerId))
    .limit(1);
  const account = existing ?? (
    await db
      .insert(customerAccountsTable)
      .values({ clerkUserId: req.customerId })
      .onConflictDoNothing()
      .returning()
  )[0];
  if (!account) {
    res.status(500).json({ error: "Could not load customer account" });
    return;
  }
  res.json(GetCustomerAccountResponse.parse({
    userId: req.customerId,
    storeCreditCents: account.storeCreditCents,
  }));
});

export default router;

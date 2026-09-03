import { Router, type Request, type Response } from "express";
import healthRouter from "./health.js";
import storefrontRouter from "./storefront.js";
import graphqlRouter from "./graphql.js";
import { requireCustomer } from "../middlewares/requireCustomer.js";
import { db, customerAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetCustomerAccountResponse } from "@workspace/api-zod";

const router = Router();

router.use(healthRouter);
router.use(storefrontRouter);
router.use(graphqlRouter);

router.use(
  "/account",
  requireCustomer,
  async (req: Request, res: Response) => {
    if (!req.customerId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const [existing] = await db
      .select()
      .from(customerAccountsTable)
      .where(eq(customerAccountsTable.clerkUserId, req.customerId))
      .limit(1);

    const account =
      existing ??
      (
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

    res.json(
      GetCustomerAccountResponse.parse({
        userId: req.customerId,
        storeCreditCents: account.storeCreditCents,
      }),
    );
  },
);

export default router;

import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      customerId?: string;
      customerEmail?: string;
    }
  }
}

export const requireCustomer: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  const customerId = auth.userId;
  if (!customerId) {
    res.status(401).json({
      error: "Authentication required",
      message: "Sign in or create an account before continuing.",
    });
    return;
  }

  req.customerId = customerId;
  const claims = auth.sessionClaims as Record<string, unknown> | null | undefined;
  const email = claims?.email ?? claims?.email_address;
  if (typeof email === "string") req.customerEmail = email;
  next();
};
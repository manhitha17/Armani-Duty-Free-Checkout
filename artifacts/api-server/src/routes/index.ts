import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storefrontRouter from "./storefront";
import graphqlRouter from "./graphql";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storefrontRouter);
router.use(graphqlRouter);

export default router;

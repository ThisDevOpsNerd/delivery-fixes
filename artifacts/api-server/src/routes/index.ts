import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deliveryIssuesRouter from "./delivery-issues";
import shopifyWebhooksRouter from "./shopify-webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deliveryIssuesRouter);
router.use(shopifyWebhooksRouter);

export default router;

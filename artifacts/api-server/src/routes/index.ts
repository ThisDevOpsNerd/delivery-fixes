import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deliveryRouter from "./delivery";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deliveryRouter);
router.use(settingsRouter);

export default router;

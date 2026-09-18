import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foundationRouter from "./foundation";
import partiesRouter from "./parties";
import storageRouter from "./storage";
import catalogRouter from "./catalog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(foundationRouter);
router.use(catalogRouter);
router.use(partiesRouter);
router.use(storageRouter);

export default router;

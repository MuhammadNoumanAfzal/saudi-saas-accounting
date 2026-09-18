import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foundationRouter from "./foundation";
import partiesRouter from "./parties";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(foundationRouter);
router.use(partiesRouter);
router.use(storageRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foundationRouter from "./foundation";
import partiesRouter from "./parties";
import storageRouter from "./storage";
import catalogRouter from "./catalog";
import quotationsRouter from "./quotations";
import invoicesRouter from "./invoices";
import purchasesRouter from "./purchases";
import accountingRouter from "./accounting";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import auditLogsRouter from "./auditLogs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(foundationRouter);
router.use(catalogRouter);
router.use(partiesRouter);
router.use(quotationsRouter);
router.use(invoicesRouter);
router.use(purchasesRouter);
router.use(accountingRouter);
router.use(reportsRouter);
router.use(dashboardRouter);
router.use(auditLogsRouter);
router.use(storageRouter);



export default router;

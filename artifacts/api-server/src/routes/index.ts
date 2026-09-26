import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foundationRouter from "./foundation";
import settingsAdminRouter from "./settingsAdmin";
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
import zatcaRouter from "./zatca";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsAdminRouter);
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
router.use(zatcaRouter);
router.use(storageRouter);



export default router;

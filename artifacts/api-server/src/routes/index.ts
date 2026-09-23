import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspaceRouter from "./workspace";
import supportRouter from "./support";
import adminRouter from "./admin";
import fleetuRouter from "./fleetu";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/workspace", workspaceRouter);
router.use("/support", supportRouter);
router.use("/admin", adminRouter);
router.use("/fleetu", fleetuRouter);

export default router;

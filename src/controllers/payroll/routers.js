import { Router } from "express";
import { verifyUser } from "../../middlewares/index.js";
import * as PayrollControllers from "./index.js";

const router = Router();

router.get("/", verifyUser, PayrollControllers.getPayrollData);

export default router;

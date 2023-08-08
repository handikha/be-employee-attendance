import { Router } from "express";
import { verifyAdmin } from "../../middlewares/index.js";

import * as RoleContollers from "./index.js";

const router = Router();

router.get("/", RoleContollers.getAllRoles);

export default router;

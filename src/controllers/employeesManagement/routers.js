import { Router } from "express";
import { verifyAdmin } from "../../middlewares/index.js";
import { createProfileUploader } from "../../helpers/uploader.js";
import path from "path";

import * as EmployeeManagementControllers from "./index.js";

const uploader = createProfileUploader(
  path.join(process.cwd(), "public", "images", "profiles")
);

const router = Router();

router.post(
  "/employees",
  verifyAdmin,
  uploader.fields([{ name: "data" }, { name: "file" }]),
  EmployeeManagementControllers.registerEmployee
);
router.get("/employees", verifyAdmin, EmployeeManagementControllers.getUsers);

export default router;

import { Router } from "express";
import { verifyUser } from "../../middlewares/index.js";

import * as AuthControllers from "./index.js";

const router = Router();

router.post("/login", AuthControllers.login);
router.get("/keep-login", verifyUser, AuthControllers.keepLogin);
router.patch("/change-password", verifyUser, AuthControllers.changePassword);
router.post("/forgot-password", AuthControllers.forgotPassword);
router.patch("/verify/:token", AuthControllers.verifyAccount);
router.patch("/reset-password/:token", AuthControllers.resetPassword);

export default router;

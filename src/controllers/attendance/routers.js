import { Router } from "express";
import { verifyUser } from "../../middlewares/index.js";
import * as AttendanceControllers from "./index.js";

const router = Router();

router.get("/", verifyUser, AttendanceControllers.getUserAttendance);
router.post("/clock-in", verifyUser, AttendanceControllers.clockIn);
router.post("/clock-out", verifyUser, AttendanceControllers.clockOut);

export default router;

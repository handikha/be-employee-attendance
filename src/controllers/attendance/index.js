import { Attendance, Salary, User } from "../../models/relation.js";
import db from "../../models/index.js";
import { Op } from "sequelize";

export const getUserAttendance = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const role = req.user?.role;

    let data = [];

    if (role !== 1) {
      const attendanceData = await Attendance.findAll({
        where: { userId },
      });

      data = attendanceData;
    }

    if (role === 1) {
      const attendanceData = await Attendance.findAll({
        include: {
          model: User,
          attributes: ["fullName"],
        },
      });

      data = attendanceData;
    }

    const formattedData = data.map((attendance) => {
      const clockInTime = attendance.clockIn
        ? new Date(attendance.clockIn).toLocaleTimeString("en-US")
        : "--:--:--";
      const clockOutTime = attendance.clockOut
        ? new Date(attendance.clockOut).toLocaleTimeString("en-US")
        : "--:--:--";

      return {
        id: attendance.id,
        userId: attendance.userId,
        fullName: attendance.user?.fullName,
        date: new Date(attendance.clockIn).toLocaleDateString(),
        clockIn: clockInTime,
        clockOut: clockOutTime,
      };
    });

    return res.status(200).json({
      message: "Your attendance data retrieved successfully.",
      data: formattedData,
    });
  } catch (error) {
    return next(error);
  }
};

export const clockIn = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    // const now = new Date();
    const now = new Date("2023-08-08 07:45:32");

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      where: {
        userId,
        clockIn: {
          [Op.gte]: todayStart,
        },
      },
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ message: "You have already clocked in today." });
    }

    const newAttendance = await Attendance.create({
      userId,
      clockIn: now,
    });

    return res
      .status(201)
      .json({ message: "Clock in successful.", data: newAttendance });
  } catch (error) {
    return next(error);
  }
};

export const clockOut = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const userId = req.user?.id;
    // const now = new Date();
    const now = new Date("2023-08-08 17:05:32");

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      where: {
        userId,
        clockIn: {
          [Op.gte]: todayStart,
        },
        clockOut: null,
      },
    });

    if (!attendance) {
      return res.status(400).json({ message: "You have already clocked out." });
    }

    attendance.clockOut = now;
    await attendance.save();

    await transaction.commit();

    return res.status(200).json({
      message: "Clock out successful. Salary calculated and updated.",
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

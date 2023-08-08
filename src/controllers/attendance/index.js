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

    const now = new Date();
    // const now = new Date("2023-08-09 07:45:32");

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

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const countWorkingDays = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);

      if (!isWeekend(currentDate)) {
        workingDays++;
      }
    }

    return workingDays;
  };

  const year = new Date().getFullYear();
  const month = new Date().getMonth();

  console.log(countWorkingDays(year, month));
  try {
    const userId = req.user?.id;
    const now = new Date();
    // const now = new Date("2023-08-09 17:05:32");

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

    const workedHours =
      (now - attendance.clockIn - 1 * 1000 * 3600) / (1000 * 3600);

    const salary = await Salary.findOne({ where: { userId } });

    if (!salary) {
      return res.status(400).json({ message: "Salary data not found." });
    }

    const hourlyRate = salary.baseSalary / countWorkingDays(year, month) / 8;
    const totalSalary = hourlyRate * (workedHours > 8 ? 8 : workedHours);

    salary.currentSalary += totalSalary;
    await salary.save();

    await transaction.commit();

    return res.status(200).json({
      message: "Clock out successful. Salary calculated and updated.",
      workedHours: +workedHours.toFixed(),
      totalSalary: +totalSalary.toFixed(),
    });
  } catch (error) {
    await transaction.rollback();
    return next(error);
  }
};

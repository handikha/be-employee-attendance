import { Salary, User, Attendance } from "../../models/relation.js";
import { Op } from "sequelize";
import moment from "moment";

export const getPayrollData = async (req, res, next) => {
  try {
    const { startDate, endDate, sort } = req.query;

    let formattedStartDate, formattedEndDate;

    if (startDate && endDate) {
      formattedStartDate = moment(startDate).startOf("day").toDate();
      formattedEndDate = moment(endDate).endOf("day").toDate();
    } else {
      // use current month
      const currentMonth = moment().startOf("month");
      formattedStartDate = currentMonth.toDate();
      formattedEndDate = moment(currentMonth).endOf("month").toDate();
    }

    const userId = req.user.id;

    const sortOptions = ["asc", "desc"];

    let order = ["clockIn", sortOptions.includes(sort) ? sort : "asc"];

    const attendances = await Attendance.findAll({
      where: {
        userId,
        clockIn: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
      order: [order],
    });

    const workingDays = 22;
    const user = await User.findOne({
      where: { id: userId },
      include: Salary,
    });

    const baseSalary = user.salary.baseSalary;

    let totalSalary = 0;
    let totalClockOutDays = 0;
    let totalDeduction = 0;

    const payrollData = attendances.map((attendance) => {
      const date = moment(attendance.clockIn).format("YYYY-MM-DD");
      const clockIn = moment(attendance.clockIn).format("HH:mm:ss");
      const clockOut = attendance.clockOut
        ? moment(attendance.clockOut).format("HH:mm:ss")
        : null;

      if (attendance.clockOut) {
        totalClockOutDays++;
        totalSalary += baseSalary / workingDays;
      } else {
        totalSalary += baseSalary / workingDays / 2;
        totalDeduction += baseSalary / workingDays / 2;
      }

      return {
        date,
        clockIn,
        clockOut,
      };
    });

    const hasIncompleteDays = totalClockOutDays < workingDays;

    return res.status(200).json({
      message: "Payroll data retrieved successfully.",
      data: {
        period: {
          startDate: moment(formattedStartDate).format("YYYY-MM-DD"),
          endDate: moment(formattedEndDate).format("YYYY-MM-DD"),
        },
        userId,
        fullName: user.fullName,
        workingDays,
        totalWorkingDays: payrollData.length,
        baseSalary,
        dailySalary: Math.round(baseSalary / workingDays),
        totalSalary: hasIncompleteDays
          ? Math.round(totalSalary)
          : Math.round(baseSalary),
        totalDeduction: hasIncompleteDays ? Math.round(totalDeduction) : 0,
        attendances: payrollData,
      },
    });
  } catch (error) {
    return next(error);
  }
};

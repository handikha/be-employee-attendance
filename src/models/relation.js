import User from "./users.js";
import Role from "./roles.js";
import Salary from "./salaries.js";
import Attendance from "./attendances.js";

// Definisikan relasi di sini
User.belongsTo(Role, { foreignKey: "roleId" });
User.hasOne(Salary, { foreignKey: "userId" });
User.hasMany(Attendance, { foreignKey: "userId" });

Attendance.belongsTo(User, { foreignKey: "userId" });

export { User, Role, Salary, Attendance }; // Export semua model dan relasinya

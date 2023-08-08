import Attendance from "./attendances.js";
import db from "./index.js";
import Role from "./roles.js";
import Salary from "./salaries.js";

//@define user models
const User = db.sequelize.define("users", {
  id: {
    type: db.Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  username: {
    type: db.Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  fullName: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  birthdate: {
    type: db.Sequelize.DATE,
    allowNull: false,
  },
  joinDate: {
    type: db.Sequelize.DATE,
    allowNull: false,
  },
  roleId: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 3,
  },
  status: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  image: {
    type: db.Sequelize.INTEGER,
  },
});
User.belongsTo(Role, { foreignKey: "roleId" });
User.hasOne(Salary, { foreignKey: "userId" });
User.hasMany(Attendance, { foreignKey: "userId" });

export default User;

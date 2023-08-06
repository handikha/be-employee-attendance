import db from "./index.js";

const Salary = db.sequelize.define(
  "salaries",
  {
    id: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
    baseSalary: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: false }
);

export default Salary;

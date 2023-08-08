import db from "./index.js";

const Attendance = db.sequelize.define(
  "attendances",
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
    clockIn: {
      type: db.Sequelize.DATE,
      allowNull: false,
    },
    clockOut: {
      type: db.Sequelize.DATE,
    },
  },
  { timestamps: false }
);

export default Attendance;

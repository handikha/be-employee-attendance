import db from "./index.js";

const Role = db.sequelize.define(
  "roles",
  {
    id: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
  },
  { timestamps: false }
);

export default Role;

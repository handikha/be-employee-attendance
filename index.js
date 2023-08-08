import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import * as middleware from "./src/middlewares/index.js";
// @use router
import AuthRouters from "./src/controllers/authentication/routers.js";
import EmployeesManagement from "./src/controllers/employeesManagement/routers.js";
import Attendance from "./src/controllers/attendance/routers.js";
import Role from "./src/controllers/roles/routers.js";
import Payroll from "./src/controllers/payroll/routers.js";
// @sync database
import db from "./src/models/index.js";

// @config dotenv
dotenv.config();

// @create express app
const app = express();

// @use body-parser
app.use(bodyParser.json());
app.use(middleware.requestLogger);
app.use(cors({ exposedHeaders: "Authorization" }));

//@exposed public folder
app.use("/public", express.static("public"));

// @root route
app.get("/", (req, res) => {
  res.status(200).send("<h1>Wellcome to Selection Test REST-API</h1>");
});

app.use("/api/v1/auth", AuthRouters);
app.use("/api/v1", EmployeesManagement);
app.use("/api/v1/attendance", Attendance);
app.use("/api/v1/roles", Role);
app.use("/api/v1/payroll", Payroll);
// app.use("/api/v1", Transaction);

//@global errorHandler
app.use(middleware.errorHandler);

// @listen to port
const PORT = process.env.PORT;

db.sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database Synced");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => console.log("Connection error: ", error));

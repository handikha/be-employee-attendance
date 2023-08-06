import User from "../../models/users.js";
import Salary from "../../models/salaries.js";
import Roles from "../../models/roles.js";
import * as helpers from "../../helpers/index.js";
import * as Validation from "./validation.js";
import * as config from "../../config/index.js";
import { ValidationError } from "yup";
import * as error from "../../middlewares/error.handler.js";
import db from "../../models/index.js";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";

export const registerEmployee = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  let thumbnail = null;

  try {
    const { data } = req.body;
    const body = JSON.parse(data);

    if (req?.files?.["file"] && Array.isArray(req?.files?.["file"])) {
      thumbnail = req.files["file"][0]?.filename;
    }

    const defaultPassword = helpers.generateDefaultPassword();
    const encryptedPassword = helpers.hashPassword(defaultPassword);

    const userData = {
      username: body?.username,
      email: body?.email,
      password: encryptedPassword,
      fullName: body?.fullName,
      birthdate: body?.birthdate,
      joinDate: body?.joinDate,
      roleId: +body?.roleId,
      image: thumbnail ? thumbnail : null,
    };

    await Validation.RegisterValidationSchema.validate(userData);

    const userExists = await User.findOne({
      where: {
        username: body.username,
        email: body.email,
        // status: { [Op.not]: 2 },
      },
    });

    if (userExists) {
      throw new Error("User already exists");
    }

    const user = await User.create(userData);

    await Salary.create({
      userId: user?.dataValues?.id,
      baseSalary: +body?.salary,
    });

    delete user?.dataValues?.password;

    const timestamp = new Date().getTime();
    const accessToken = helpers.createToken({
      id: user?.dataValues?.id,
      role: user?.dataValues?.roleId,
      timestamp,
    });

    //@Send verification link via email
    const template = fs.readFileSync(
      path.join(process.cwd(), "templates", "registerEmployee.html"),
      "utf8"
    );

    const message = handlebars.compile(template)({
      fullName: body.fullName,
      username: body.username,
      defaultPassword,
      link: config.REDIRECT_URL + `/auth/verify/${accessToken}`,
    });

    const mailOptions = {
      from: config.GMAIL,
      to: body.email,
      subject: "Welcome to Corpe",
      html: message,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });

    res.status(200).json({ message: "User Added Successfully", data: user });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }

    if (thumbnail) {
      fs.unlink(
        path.join(process.cwd(), "public", "images", "thumbnails", thumbnail),
        (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully");
          }
        }
      );
    }
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { roleId: { [Op.not]: 1 } },
      include: Roles,
    });

    for (const user of users) {
      delete user?.dataValues?.password;
      delete user?.dataValues?.roleId;

      const salary = await Salary.findOne({
        where: { userId: user.dataValues?.id },
      });

      user.setDataValue("salary", salary.baseSalary);
    }

    res.status(200).json({ message: "Users Fetched", data: users });
  } catch (error) {
    next(error);
  }
};

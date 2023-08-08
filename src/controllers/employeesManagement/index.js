import User from "../../models/users.js";
import Salary from "../../models/salaries.js";
import * as helpers from "../../helpers/index.js";
import * as Validation from "./validation.js";
import * as config from "../../config/index.js";
import { ValidationError } from "yup";
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
      // password: helpers.hashPassword(body?.password),
      fullName: body?.fullName,
      birthdate: body?.birthdate,
      joinDate: body?.joinDate,
      roleId: +body?.roleId,
      baseSalary: +body?.baseSalary,
      image: thumbnail ? thumbnail : null,
    };

    await Validation.inputUserValidationSchema.validate(userData);

    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ username: userData.username }, { email: userData.email }],
      },
    });

    if (userExists) {
      if (userExists.username === userData.username) {
        throw new Error("Username already exists");
      } else if (userExists.email === userData.email) {
        throw new Error("Email already exists");
      }
    }

    const user = await User.create(userData);

    await Salary.create({
      userId: user?.dataValues?.id,
      baseSalary: userData.baseSalary,
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
      fullName: userData.fullName,
      username: userData.username,
      defaultPassword,
      link: config.REDIRECT_URL + `/auth/verify/${accessToken}`,
    });

    const mailOptions = {
      from: config.GMAIL,
      to: body.email,
      subject: "Welcome to Atten",
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
        path.join(process.cwd(), "public", "images", "profiles", thumbnail),
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

export const getEmployees = async (req, res, next) => {
  try {
    const id = req.params?.id;

    const users = await User.findAll({
      where: id ? { id, roleId: { [Op.not]: 1 } } : { roleId: { [Op.not]: 1 } },
      include: Salary,
    });

    for (const user of users) {
      delete user?.dataValues?.password;

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

export const updateEmployee = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { data } = req.body;
    const body = JSON.parse(data);

    const user = await User.findOne({ where: { id }, include: Salary });
    const salary = await Salary.findOne({ where: { userId: id } });
    if (!user) {
      throw new Error("User not found");
    }

    if (req.files && req.files.file) {
      if (user.image) {
        const oldImagePath = path.join(
          process.cwd(),
          "public",
          "images",
          "profiles",
          user.image
        );
        fs.unlink(oldImagePath, (error) => {
          if (error) {
            console.error("Error deleting file:", error);
          } else {
            console.log("Old file deleted successfully");
          }
        });
      }
      const thumbnail = req.files.file[0].filename;
      user.image = thumbnail;
    } else {
      user.image = user.image;
    }
    const userData = {
      username: body.username || user.username,
      email: body.email || user.email,
      fullName: body.fullName || user.fullName,
      birthdate: body.birthdate || user.birthdate,
      joinDate: body.joinDate || user.joinDate,
      roleId: +body.roleId || user.roleId,
      baseSalary: +body.baseSalary || +user.salary.dataValues?.baseSalary,
    };

    await Validation.updateUserValidationSchema.validate(userData);

    user.username = userData.username;
    user.email = userData.email;
    user.fullName = userData.fullName;
    user.birthdate = userData.birthdate;
    user.joinDate = userData.joinDate;
    user.roleId = userData.roleId;
    user.status = +body.status;

    await user.save();

    await salary.update({ baseSalary: userData.baseSalary });

    user.setDataValue("salary", userData.baseSalary);

    delete user?.dataValues?.password;

    await transaction.commit();
    res
      .status(200)
      .json({ message: "Employee updated successfully", data: user });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }

    if (req.files && req.files.file) {
      fs.unlink(
        path.join(
          process.cwd(),
          "public",
          "images",
          "profiles",
          req.files.file[0].filename
        ),
        (error) => {
          if (error) {
            console.error("Error deleting file:", error);
          } else {
            console.log("File deleted successfully");
          }
        }
      );
    }

    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const employeeExists = await User.findOne({ where: { id } });

    if (!employeeExists) {
      throw new Error("Employee not found");
    }

    await employeeExists.update({ status: 2 });

    // fs.unlink(
    //   path.join(
    //     process.cwd(),
    //     "public",
    //     "images",
    //     "profiles",
    //     employeeExists.image
    //   ),
    //   (error) => {
    //     if (error) {
    //       console.error("Error deleting file:", error);
    //     } else {
    //       console.log("File deleted successfully");
    //     }
    //   }
    // );

    res.status(200).json({ message: "Employe deleted successfully" });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

import User from "../../models/users.js";
import Roles from "../../models/roles.js";
import * as helpers from "../../helpers/index.js";
import * as error from "../../middlewares/error.handler.js";
import * as Validation from "./validation.js";
import * as config from "../../config/index.js";
import { ValidationError } from "yup";
import db from "../../models/index.js";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    await Validation.LoginValidationSchema.validate(req.body);

    // check user
    const userExists = await User?.findOne({
      where: { username },
      include: Roles,
    });
    if (!userExists) throw { status: 400, message: error.USER_DOES_NOT_EXISTS };

    console.log(userExists);
    // check password
    const isPasswordCorrect = helpers.comparePassword(
      password,
      userExists?.dataValues?.password
    );

    if (!isPasswordCorrect)
      throw { status: 400, message: error.INVALID_CREDENTIALS };

    // generate access token
    const accessToken = helpers.createToken({
      id: userExists?.dataValues?.id,
      role: userExists?.dataValues?.roleId,
    });

    // delete password before sending response
    delete userExists?.dataValues?.password;

    // send response
    res
      .header("Authorization", `Bearer ${accessToken}`)
      .status(200)
      .json({ message: "Login Successfull", data: userExists });
  } catch (error) {
    // check if error from validation
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

export const keepLogin = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User?.findOne({
      where: { id },
      include: Roles,
    });

    //delete password before sending response
    delete user?.dataValues?.password;

    //send response
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const verifyAccount = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { currentPassword, password, confirmPassword } = req.body;
    const decodedToken = helpers.verifyToken(token);

    const tokenTimeStamp = new Date(decodedToken.timestamp).toLocaleString();

    const user = await User.findOne({ where: { id: decodedToken?.id } });

    await Validation.ChangePasswordValidationSchema.validate(req.body);

    const isPasswordCorrect = helpers.comparePassword(
      currentPassword,
      user?.dataValues?.password
    );

    if (!isPasswordCorrect) throw { status: 400, message: "Invalid Password" };

    if (tokenTimeStamp < user.dataValues?.updatedAt.toLocaleString())
      throw { status: 400, message: "Token has expired" };

    await user?.update(
      { password: helpers.hashPassword(password), status: 1 },
      { where: { id: decodedToken?.id } }
    );

    res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const user = await User?.findOne({ where: { id: req.user.id } });

    if (user.status === 0)
      throw { status: 400, message: error.USER_NOT_VERIFIED };

    const { currentPassword, password, confirmPassword } = req.body;
    await Validation.ChangePasswordValidationSchema.validate(req.body);

    // @check if password is correct
    const isPasswordCorrect = helpers.comparePassword(
      currentPassword,
      user?.dataValues?.password
    );
    if (!isPasswordCorrect) throw { status: 400, message: "Invalid Password" };

    await user?.update({ password: helpers.hashPassword(password) });

    // @return response
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { token } = req.params;

    const { password } = req.body;
    await Validation.ResetPasswordValidationSchema.validate(req.body);

    const decodedToken = helpers.verifyToken(token);

    const encryptedPassword = helpers.hashPassword(password);

    await User?.update(
      { password: encryptedPassword },
      { where: { id: decodedToken?.id } }
    );

    res
      .header("Authorization", `Bearer ${token}`)
      .status(200)
      .json({ message: "Password resset successfully" });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationError) {
      return next({ status: 400, message: error?.errors?.[0] });
    }
    next(error);
  }
};

export const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await Validation.EmailValidationSchema.validate(req.body);

    const user = await User?.findOne({ where: { email } });

    if (!user) throw { status: 400, message: error.EMAIL_DOES_NOT_EXISTS };

    //@generate access token
    const accessToken = helpers.createToken({
      id: user.id,
      role: user.role,
    });

    //@Send verification link to new email
    const template = fs.readFileSync(
      path.join(process.cwd(), "templates", "resetPassword.html"),
      "utf8"
    );
    const message = handlebars.compile(template)({
      fullName: user?.dataValues?.fullName,
      link: config.REDIRECT_URL + `/auth/reset-password/${accessToken}`,
    });
    const mailOptions = {
      from: config.GMAIL,
      to: email,
      subject: "Reset Password",
      html: message,
    };

    helpers.transporter.sendMail(mailOptions, (error, info) => {
      if (error) throw error;
      console.log(`Email sent : ${info.response}`);
    });

    //@send response
    res.status(200).json({
      message:
        "Reset password successfully! Please check your email to reset your password",
    });
  } catch (error) {
    next(error);
  }
};

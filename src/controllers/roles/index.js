import Role from "../../models/roles.js";
import { Op } from "sequelize";

export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({ where: { id: { [Op.not]: 1 } } });

    res.status(200).json({
      message: "Roles fetched",
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

import * as Yup from "yup";

export const inputUserValidationSchema = Yup.object({
  username: Yup.string()
    .matches(
      /^[a-zA-Z0-9_.]+$/,
      "Username can only contain letters, numbers, and character _ or ."
    )
    .required("Username is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  fullName: Yup.string().required("Name is required"),
  birthdate: Yup.string().required("Birthdate is required"),
  roleId: Yup.string().required("Role is required"),
  baseSalary: Yup.string()
    .matches(/^[0-9]+$/, "Salary must contain only numbers")
    .required("Salary is required"),
  joinDate: Yup.string().required("Join date is required"),
  image: Yup.string().required("Image is required"),
});

export const updateUserValidationSchema = Yup.object({
  username: Yup.string()
    .matches(
      /^[a-zA-Z0-9_.]+$/,
      "Username can only contain letters, numbers, and character _ or ."
    )
    .required("Username is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  fullName: Yup.string().required("Name is required"),
  birthdate: Yup.string().required("Birthdate is required"),
  joinDate: Yup.string().required("Join date is required"),
  roleId: Yup.string().required("Role is required"),
  baseSalary: Yup.string()
    .matches(/^[0-9]+$/, "Salary must contain only numbers")
    .required("Salary is required"),
  image: Yup.mixed()
    .nullable()
    .test("fileSize", "File size is too large", (value) => {
      if (!value) return true;
      const maxSize = 1 * 1024 * 1024;
      return value.size <= maxSize;
    }),
});

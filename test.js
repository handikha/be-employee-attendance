import * as helpers from "./src/helpers/index.js";

const password = "admin123";
const encryptedPassword = helpers.hashPassword(password);
console.log(encryptedPassword);

const comparedPassword = helpers.comparePassword("admin123", encryptedPassword);
console.log(comparedPassword);

import * as helpers from "./src/helpers/index.js";

const password = "admin123";
const encryptedPassword = helpers.hashPassword(password);
console.log(encryptedPassword);

const comparedPassword = helpers.comparePassword("admin123", encryptedPassword);
console.log(comparedPassword);

const clockIn = new Date("2023-08-09 07:55:32");
const clockOut = new Date("2023-08-09 17:05:32");

const workedHours = (clockOut - clockIn) / (1000 * 3600);
// (clockOut - clockIn - 1 * 1000 * 60 * 60) / (1000 * 60 * 60);

console.log(workedHours);

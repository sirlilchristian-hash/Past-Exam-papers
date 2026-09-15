const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "default-dev-jwt-secret-do-not-use-in-prod";
const token = jwt.sign(
  { account_id: "admin", role: "super_admin", iat: Math.floor(Date.now() / 1000) },
  JWT_SECRET,
  { expiresIn: "8h" }
);
console.log(token);

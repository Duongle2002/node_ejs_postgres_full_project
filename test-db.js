require("dotenv").config();
const pool = require("./db");

pool.query("SELECT NOW()")
  .then(res => console.log(res.rows))
  .catch(err => console.error("ERROR:", err));

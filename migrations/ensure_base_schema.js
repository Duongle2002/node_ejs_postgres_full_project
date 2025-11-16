const fs = require('fs');
const path = require('path');
const pool = require('../db');

module.exports = async function ensureBaseSchema(){
  const sqlPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  // Run the schema which uses CREATE TABLE IF NOT EXISTS ... (idempotent)
  await pool.query(sql);
};

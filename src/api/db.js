const sql = require("mssql");

const config = {
  server: "DESKTOP-FOKGJSF\\SQLEXPRESS",
  database: "AMANSOFTS_PLUS", // عدّل لو مختلف
  options: {
    trustServerCertificate: true
  },
  authentication: {
    type: "default"
  }
};

async function getConnection() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("SQL CONNECTION ERROR:", err);
    throw err;
  }
}

module.exports = {
  sql,
  getConnection
};
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const sql = require("mssql/msnodesqlv8");

const app = express();
const PORT = 4015;

app.use(cors());
app.use(express.json());

const EXPORTS_DIR = path.join(__dirname, "..", "..", "exports");
const SUMMARY_FILE = path.join(EXPORTS_DIR, "smart-pharmacy-summary.json");

// =========================
// SQL CONFIG - Windows Auth
// =========================
const sqlConfig = {
  connectionString:
    "Driver={SQL Server Native Client 11.0};Server=DESKTOP-FOKGJSF\\SQLEXPRESS;Database=AMANSOFTS_PLUS;Trusted_Connection=Yes;",
  driver: "msnodesqlv8"
};

async function getSqlPool() {
  return sql.connect(sqlConfig);
}

function safeReadSummary() {
  try {
    if (!fs.existsSync(SUMMARY_FILE)) {
      return {
        ok: false,
        error: "Summary file not found",
        data: null
      };
    }

    const raw = fs.readFileSync(SUMMARY_FILE, "utf8");
    const json = JSON.parse(raw);

    return {
      ok: true,
      data: json
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      data: null
    };
  }
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

// =========================
// BASIC TEST
// =========================
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "PING_OK",
    port: PORT
  });
});

// =========================
// HEALTH
// =========================
app.get("/api/health", async (req, res) => {
  const summary = safeReadSummary();

  let sqlLive = false;
  let sqlError = null;

  try {
    const pool = await getSqlPool();
    await pool.request().query("SELECT 1 AS ok");
    sqlLive = true;
  } catch (err) {
    sqlError = err.message;
  }

  res.json({
    ok: true,
    status: "online",
    jsonSummaryAvailable: summary.ok,
    sqlLive,
    sqlError
  });
});

// =========================
// SQL TEST
// =========================
app.get("/api/sql-test", async (req, res) => {
  try {
    const pool = await getSqlPool();

    const result = await pool.request().query(`
      SELECT TOP 10 *
      FROM Items
    `);

    return res.json({
      ok: true,
      source: "sql-live",
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    console.error("SQL TEST ERROR:", err);
    return res.status(500).json({
      ok: false,
      source: "sql-live",
      error: err.message
    });
  }
});

// =========================
// SMART SUMMARY
// مؤقتًا fallback من JSON
// مع التحقق أن SQL متصل
// =========================
app.get("/api/smart-summary", async (req, res) => {
  let sqlConnected = false;

  try {
    const pool = await getSqlPool();
    await pool.request().query("SELECT 1 AS ok");
    sqlConnected = true;
  } catch (sqlErr) {
    console.warn("SMART SUMMARY SQL CHECK FAILED:", sqlErr.message);
  }

  try {
    const summary = safeReadSummary();

    if (!summary.ok || !summary.data) {
      return res.status(404).json({
        ok: false,
        source: "json-fallback",
        sqlConnected,
        error: summary.error || "Summary file not found"
      });
    }

    const json = summary.data;
    const dashboard = json.dashboard?.[0] || {};

    return res.json({
      ok: true,
      source: sqlConnected ? "json-fallback-with-sql-live" : "json-fallback",
      sqlConnected,
      totalSales: toNumber(dashboard.total_sales_value, 0),
      estimatedProfit: toNumber(dashboard.estimated_total_profit, 0),
      deadStock: toNumber(dashboard.dead_stock_count, 0),
      lowStock: toNumber(dashboard.low_stock_risk_count, 0),
      totalOrders: toNumber(dashboard.selling_products_count, 0),
      topSelling: arrayOrEmpty(json.topSelling)
    });
  } catch (err) {
    console.error("SMART SUMMARY ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  }
});

// =========================
// START
// =========================
app.listen(PORT, () => {
  console.log("===================================");
  console.log(`SMART PHARMACY API RUNNING ON ${PORT}`);
  console.log(`SUMMARY_FILE: ${SUMMARY_FILE}`);
  console.log("SQL SERVER  : DESKTOP-FOKGJSF\\SQLEXPRESS");
  console.log("DATABASE    : AMANSOFTS_PLUS");
  console.log("AUTH        : Windows Integrated");
  console.log("===================================");
});
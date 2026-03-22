@'
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

app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "PING_OK",
    port: PORT
  });
});

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

app.get("/api/sql-test", async (req, res) => {
  try {
    const pool = await getSqlPool();

    const result = await pool.request().query(`
      SELECT TOP 200
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
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

app.get("/api/smart-summary", async (req, res) => {
  try {
    const pool = await getSqlPool();

    const summaryResult = await pool.request().query(`
      SELECT 
        SUM(d.TOTAL) AS total_sales,
        SUM(d.PROFIT) AS total_profit
      FROM SAL_POINT_DTL d
    `);

    const summary = summaryResult.recordset[0] || {};

    const topResult = await pool.request().query(`
      SELECT TOP 10
        d.CLS_ID AS product_id,
        c.NAME AS product_name_ar,
        SUM(d.QTY) AS total_sold_qty,
        SUM(d.TOTAL) AS total_sales_value,
        SUM(d.PROFIT) AS estimated_profit
      FROM SAL_POINT_DTL d
      LEFT JOIN CLS c ON c.CLS_ID = d.CLS_ID
      GROUP BY d.CLS_ID, c.NAME
      ORDER BY SUM(d.QTY) DESC
    `);

    return res.json({
      ok: true,
      source: "sql-live",
      totalSales: Number(summary.total_sales || 0),
      estimatedProfit: Number(summary.total_profit || 0),
      deadStock: 0,
      lowStock: 0,
      totalOrders: 0,
      topSelling: topResult.recordset
    });
  } catch (sqlErr) {
    console.warn("SMART SUMMARY SQL ERROR:", sqlErr.message);

    try {
      const summary = safeReadSummary();

      if (!summary.ok || !summary.data) {
        return res.status(404).json({
          ok: false,
          source: "json-fallback",
          error: summary.error || "Summary file not found"
        });
      }

      const json = summary.data;
      const dashboard = json.dashboard?.[0] || {};

      return res.json({
        ok: true,
        source: "json-fallback",
        totalSales: toNumber(dashboard.total_sales_value, 0),
        estimatedProfit: toNumber(dashboard.estimated_total_profit, 0),
        deadStock: toNumber(dashboard.dead_stock_count, 0),
        lowStock: toNumber(dashboard.low_stock_risk_count, 0),
        totalOrders: toNumber(dashboard.selling_products_count, 0),
        topSelling: arrayOrEmpty(json.topSelling)
      });
    } catch (err) {
      console.error("SMART SUMMARY FALLBACK ERROR:", err);
      return res.status(500).json({
        ok: false,
        error: err.message
      });
    }
  }
});

app.listen(PORT, () => {
  console.log("===================================");
  console.log(`SMART PHARMACY API RUNNING ON ${PORT}`);
  console.log(`SUMMARY_FILE: ${SUMMARY_FILE}`);
  console.log("SQL SERVER  : DESKTOP-FOKGJSF\\SQLEXPRESS");
  console.log("DATABASE    : AMANSOFTS_PLUS");
  console.log("AUTH        : Windows Integrated");
  console.log("===================================");
});
'@ | Set-Content "D:\iPharmEGY_RUNTIME\pos\src\api\smart-pharmacy-api.js" -Encoding UTF8
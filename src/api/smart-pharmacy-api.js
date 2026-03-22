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
// SQL CONFIG - LIVE DB
// =========================
const sqlConfig = {
  connectionString:
    "Driver={SQL Server Native Client 11.0};Server=DESKTOP-FOKGJSF\\SQLEXPRESS;Database=D:\\DB_SPOIN\\AMANSOFTS_20_10_2025.MDF;Trusted_Connection=Yes;",
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

async function tableExists(pool, tableName) {
  const result = await pool
    .request()
    .input("tableName", sql.NVarChar, tableName)
    .query(`
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME = @tableName
    `);

  return (result.recordset?.[0]?.cnt || 0) > 0;
}

async function firstExistingTable(pool, candidates) {
  for (const tableName of candidates) {
    if (await tableExists(pool, tableName)) {
      return tableName;
    }
  }
  return null;
}

async function getColumns(pool, tableName) {
  const result = await pool
    .request()
    .input("tableName", sql.NVarChar, tableName)
    .query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `);

  return result.recordset.map((r) => r.COLUMN_NAME);
}

function firstExistingColumn(columns, candidates) {
  const normalized = new Set(columns.map((c) => c.toUpperCase()));
  for (const candidate of candidates) {
    if (normalized.has(candidate.toUpperCase())) {
      return candidate;
    }
  }
  return null;
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
// SQL TEST - LIST TABLES
// =========================
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

// =========================
// SQL COLUMNS INSPECTOR
// مثال:
// /api/sql-columns/SAL_POINT_INV
// =========================
app.get("/api/sql-columns/:table", async (req, res) => {
  try {
    const pool = await getSqlPool();
    const tableName = req.params.table;
    const columns = await getColumns(pool, tableName);

    return res.json({
      ok: true,
      table: tableName,
      count: columns.length,
      columns
    });
  } catch (err) {
    console.error("SQL COLUMNS ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

// =========================
// SMART SUMMARY
// 1) SQL LIVE
// 2) JSON FALLBACK
// =========================
app.get("/api/smart-summary", async (req, res) => {
  try {
    const pool = await getSqlPool();

    // ---------
    // Resolve actual tables
    // ---------
    const headerTable = await firstExistingTable(pool, [
      "SAL_POINT_INV",
      "SAL_POINT",
      "SALE_INV",
      "BILLS"
    ]);

    const detailTable = await firstExistingTable(pool, [
      "SAL_POINT_INV_DET",
      "SAL_POINT_DTL",
      "SAL_POINT_DETAIL_CLASS"
    ]);

    const classesTable = await firstExistingTable(pool, [
      "CLASSES",
      "CLS",
      "ITEMS"
    ]);

    if (!headerTable) {
      throw new Error("Could not detect sales header table.");
    }

    const headerCols = await getColumns(pool, headerTable);
    const detailCols = detailTable ? await getColumns(pool, detailTable) : [];
    const classCols = classesTable ? await getColumns(pool, classesTable) : [];

    // ---------
    // Detect header columns
    // ---------
    const headerIdCol = firstExistingColumn(headerCols, [
      "SP_S_ID",
      "INV_ID",
      "ID"
    ]);

    const headerDateCol = firstExistingColumn(headerCols, [
      "SP_S_DATE",
      "INV_DATE",
      "DATE",
      "DOC_DATE"
    ]);

    const headerSalesCol = firstExistingColumn(headerCols, [
      "SP_S_TOT_FORIGNVALUE",
      "TOTAL",
      "TOTAL_VALUE",
      "NET_TOTAL"
    ]);

    const headerProfitCol = firstExistingColumn(headerCols, [
      "SP_S_REBH",
      "PROFIT",
      "TOTAL_PROFIT"
    ]);

    if (!headerIdCol || !headerDateCol || !headerSalesCol) {
      throw new Error(
        `Header columns not detected correctly. headerIdCol=${headerIdCol}, headerDateCol=${headerDateCol}, headerSalesCol=${headerSalesCol}`
      );
    }

    // ---------
    // Summary from header
    // ---------
    const summarySql = `
      SELECT
        COUNT(*) AS total_orders,
        SUM(ISNULL([${headerSalesCol}], 0)) AS total_sales,
        SUM(ISNULL([${headerProfitCol || headerSalesCol}], 0)) AS total_profit,
        MAX([${headerDateCol}]) AS last_sale_date
      FROM [${headerTable}]
    `;

    const summaryResult = await pool.request().query(summarySql);
    const summary = summaryResult.recordset[0] || {};

    // ---------
    // Top selling from detail + classes if possible
    // ---------
    let topSelling = [];

    if (detailTable && classesTable) {
      const detailProductCol = firstExistingColumn(detailCols, [
        "CLS_ID",
        "CLASS_ID",
        "ITEM_ID",
        "PRODUCT_ID"
      ]);

      const detailQtyCol = firstExistingColumn(detailCols, [
        "QTY",
        "SP_QTY",
        "QTY1",
        "ITEM_QTY",
        "QUANTITY"
      ]);

      const detailSalesCol = firstExistingColumn(detailCols, [
        "TOTAL",
        "SP_TOTAL",
        "TOTAL_VALUE",
        "NET_VALUE",
        "FORIGNVALUE",
        "TOT_FORIGNVALUE"
      ]);

      const detailProfitCol = firstExistingColumn(detailCols, [
        "PROFIT",
        "SP_PROFIT",
        "REBH"
      ]);

      const detailHeaderIdCol = firstExistingColumn(detailCols, [
        "SP_S_ID",
        "INV_ID",
        "ID_H",
        "HEADER_ID"
      ]);

      const classIdCol = firstExistingColumn(classCols, [
        "CLS_ID",
        "CLASS_ID",
        "ITEM_ID",
        "PRODUCT_ID"
      ]);

      const classNameCol = firstExistingColumn(classCols, [
        "NAME",
        "CLS_DESC",
        "ITEMNAME",
        "ITEM_NAME",
        "CLASS_NAME"
      ]);

      if (
        detailProductCol &&
        detailQtyCol &&
        detailSalesCol &&
        detailHeaderIdCol &&
        classIdCol &&
        classNameCol &&
        headerIdCol
      ) {
        const topSql = `
  SELECT TOP 10
    d.CLS_ID AS product_id,
    c.CLS_ARNAME AS product_name_ar,
    SUM(ISNULL(d.SP_SD_QTY, 0)) AS total_sold_qty,
    SUM(ISNULL(d.SP_SD_TOT_FORIGNVALUE, 0)) AS total_sales_value,
    SUM(ISNULL(d.SP_SD_INC_REBH, 0)) AS estimated_profit
  FROM SAL_POINT_INV_DET d
  LEFT JOIN SAL_POINT_INV h
    ON h.SP_S_ID = d.SP_S_ID
  LEFT JOIN CLASSES c
    ON c.CLS_ID = d.CLS_ID
  GROUP BY d.CLS_ID, c.CLS_ARNAME
  ORDER BY SUM(ISNULL(d.SP_SD_QTY, 0)) DESC
`;

        const topResult = await pool.request().query(topSql);
        topSelling = topResult.recordset || [];
      }
    }

    // ---------
    // Inventory signals (best effort)
    // ---------
    let deadStock = 0;
    let lowStock = 0;

    const inventoryTable = await firstExistingTable(pool, [
      "INVENTORY",
      "INVENTORY_ITEMS",
      "STOCK"
    ]);

    if (inventoryTable) {
      const invCols = await getColumns(pool, inventoryTable);

      const invQtyCol = firstExistingColumn(invCols, [
        "QTY",
        "BALANCE",
        "CURRENT_QTY",
        "ITEM_QTY",
        "QUANTITY"
      ]);

      const minQtyCol = firstExistingColumn(invCols, [
        "MIN_QTY",
        "MINIMUM_QTY",
        "REORDER_QTY"
      ]);

      if (invQtyCol) {
        const deadSql = `
          SELECT COUNT(*) AS cnt
          FROM [${inventoryTable}]
          WHERE ISNULL([${invQtyCol}], 0) > 0
        `;

        const deadResult = await pool.request().query(deadSql);
        deadStock = toNumber(deadResult.recordset?.[0]?.cnt, 0);
      }

      if (invQtyCol && minQtyCol) {
        const lowSql = `
          SELECT COUNT(*) AS cnt
          FROM [${inventoryTable}]
          WHERE ISNULL([${invQtyCol}], 0) > 0
            AND ISNULL([${invQtyCol}], 0) <= ISNULL([${minQtyCol}], 0)
        `;

        const lowResult = await pool.request().query(lowSql);
        lowStock = toNumber(lowResult.recordset?.[0]?.cnt, 0);
      }
    }

    return res.json({
      ok: true,
      source: "sql-live",
      sqlConnected: true,
      tables: {
        headerTable,
        detailTable,
        classesTable,
        inventoryTable
      },
      totalSales: toNumber(summary.total_sales, 0),
      estimatedProfit: toNumber(summary.total_profit, 0),
      deadStock,
      lowStock,
      totalOrders: toNumber(summary.total_orders, 0),
      lastSaleDate: summary.last_sale_date || null,
      topSelling
    });
  } catch (sqlErr) {
    console.error("SMART SUMMARY SQL ERROR FULL:", sqlErr);

    try {
      const summary = safeReadSummary();

      if (!summary.ok || !summary.data) {
        return res.status(404).json({
          ok: false,
          source: "json-fallback",
          sqlConnected: false,
          error: summary.error || "Summary file not found"
        });
      }

      const json = summary.data;
      const dashboard = json.dashboard?.[0] || {};

      return res.json({
        ok: true,
        source: "json-fallback",
        sqlConnected: false,
        totalSales: toNumber(dashboard.total_sales_value, 0),
        estimatedProfit: toNumber(dashboard.estimated_total_profit, 0),
        deadStock: toNumber(dashboard.dead_stock_count, 0),
        lowStock: toNumber(dashboard.low_stock_risk_count, 0),
        totalOrders: toNumber(dashboard.selling_products_count, 0),
        lastSaleDate: json.generatedAt || null,
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
  console.log("DATABASE    : D:\\DB_SPOIN\\AMANSOFTS_20_10_2025.MDF");
  console.log("AUTH        : Windows Integrated");
  console.log("===================================");
});
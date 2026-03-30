const express = require("express");
const cors = require("cors");
const sql = require("mssql/msnodesqlv8");

const app = express();
const PORT = 4015;

app.use(cors());
app.use(express.json());

const sqlConfig = {
  connectionString:
    "Driver={SQL Server Native Client 11.0};Server=DESKTOP-FOKGJSF\\SQLEXPRESS;Database=D:\\DB_SPOIN\\AMANSOFTS_20_10_2025.MDF;Trusted_Connection=Yes;",
  driver: "msnodesqlv8"
};

async function getPool() {
  return sql.connect(sqlConfig);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "INVENTORY_API_OK",
    port: PORT
  });
});

app.get("/api/inventory-summary", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        COUNT(*) AS total_rows,
        COUNT(DISTINCT q.CLS_ID) AS total_items,
        COUNT(DISTINCT q.ST_ID) AS total_stores,
        SUM(ISNULL(q.STO_QTY, 0)) AS total_stock_qty,
        SUM(ISNULL(q.STO_VAL, 0)) AS total_stock_value,
        SUM(CASE WHEN ISNULL(q.STO_QTY, 0) <= 0 THEN 1 ELSE 0 END) AS zero_or_negative_rows
      FROM STORAG_QTY q
    `);

    const row = result.recordset[0] || {};

    res.json({
      ok: true,
      source: "sql-live",
      data: {
        totalRows: toNumber(row.total_rows),
        totalItems: toNumber(row.total_items),
        totalStores: toNumber(row.total_stores),
        totalStockQty: toNumber(row.total_stock_qty),
        totalStockValue: toNumber(row.total_stock_value),
        zeroOrNegativeRows: toNumber(row.zero_or_negative_rows)
      }
    });
  } catch (err) {
    console.error("INVENTORY SUMMARY ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/api/inventory-items", async (req, res) => {
  try {
    const pool = await getPool();
    const top = Math.max(1, Math.min(parseInt(req.query.top || "100", 10), 500));

    const result = await pool.request().query(`
      SELECT TOP (${top})
        q.ST_ID AS store_id,
        q.ST_ARNAME AS store_name_ar,
        q.CLS_ID AS item_id,
        c.CLS_ARNAME AS item_name_ar,
        ISNULL(q.STO_QTY, 0) AS stock_qty,
        ISNULL(q.STO_VAL, 0) AS stock_value
      FROM STORAG_QTY q
      LEFT JOIN CLASSES c
        ON c.CLS_ID = q.CLS_ID
      ORDER BY ISNULL(q.STO_QTY, 0) DESC, q.CLS_ID ASC
    `);

    res.json({
      ok: true,
      source: "sql-live",
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    console.error("INVENTORY ITEMS ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/api/inventory-low-stock", async (req, res) => {
  try {
    const pool = await getPool();
    const maxQty = Math.max(0, Math.min(parseInt(req.query.maxQty || "5", 10), 100));
    const top = Math.max(1, Math.min(parseInt(req.query.top || "100", 10), 500));

    const result = await pool.request().query(`
      SELECT TOP (${top})
        q.ST_ID AS store_id,
        q.ST_ARNAME AS store_name_ar,
        q.CLS_ID AS item_id,
        c.CLS_ARNAME AS item_name_ar,
        ISNULL(q.STO_QTY, 0) AS stock_qty,
        ISNULL(q.STO_VAL, 0) AS stock_value
      FROM STORAG_QTY q
      LEFT JOIN CLASSES c
        ON c.CLS_ID = q.CLS_ID
      WHERE ISNULL(q.STO_QTY, 0) > 0
        AND ISNULL(q.STO_QTY, 0) <= ${maxQty}
      ORDER BY ISNULL(q.STO_QTY, 0) ASC, q.CLS_ID ASC
    `);

    res.json({
      ok: true,
      source: "sql-live",
      maxQty,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    console.error("INVENTORY LOW STOCK ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`INVENTORY API RUNNING ON ${PORT}`);
  console.log("SQL SERVER  : DESKTOP-FOKGJSF\\SQLEXPRESS");
  console.log("DATABASE    : D:\\DB_SPOIN\\AMANSOFTS_20_10_2025.MDF");
});

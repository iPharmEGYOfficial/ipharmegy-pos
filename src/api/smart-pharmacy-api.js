const express = require("express");
const cors = require("cors");
const sql = require("mssql/msnodesqlv8");

const app = express();
const PORT = 4010;

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

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

function normalizeDateInput(value) {
  if (!value) return null;
  const s = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function buildDateFilterSql(dateCol, from, to, alias = "") {
  const p = alias ? `${alias}.` : "";
  const parts = [];

  if (from) {
    parts.push(`${p}[${dateCol}] >= '${escapeSqlString(from)}'`);
  }

  if (to) {
    parts.push(`${p}[${dateCol}] < DATEADD(DAY, 1, '${escapeSqlString(to)}')`);
  }

  return parts.length ? `WHERE ${parts.join(" AND ")}` : "";
}

app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    message: "POS_API_OK",
    port: PORT
  });
});

app.get("/api/pos-summary", async (req, res) => {
  try {
    const pool = await getPool();

    const from = normalizeDateInput(req.query.from);
    const to = normalizeDateInput(req.query.to);

    const whereSql = buildDateFilterSql("SP_S_DATE", from, to);

    const result = await pool.request().query(`
      SELECT
        COUNT(*) AS total_orders,
        SUM(ISNULL(SP_S_TOT_FORIGNVALUE, 0)) AS total_sales,
        SUM(ISNULL(SP_S_REBH, 0)) AS estimated_profit,
        MAX(SP_S_DATE) AS last_sale_date
      FROM SAL_POINT_INV
      ${whereSql}
    `);

    const row = result.recordset[0] || {};

    res.json({
      ok: true,
      source: "sql-live",
      filters: { from, to },
      data: {
        totalOrders: toNumber(row.total_orders),
        totalSales: toNumber(row.total_sales),
        estimatedProfit: toNumber(row.estimated_profit),
        lastSaleDate: row.last_sale_date || null
      }
    });
  } catch (err) {
    console.error("POS SUMMARY ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/api/pos-daily-sales", async (req, res) => {
  try {
    const pool = await getPool();

    const from = normalizeDateInput(req.query.from);
    const to = normalizeDateInput(req.query.to);

    const whereSql = buildDateFilterSql("SP_S_DATE", from, to);

    const result = await pool.request().query(`
      SELECT
        CONVERT(date, SP_S_DATE) AS sale_date,
        COUNT(*) AS orders_count,
        SUM(ISNULL(SP_S_TOT_FORIGNVALUE, 0)) AS total_sales,
        SUM(ISNULL(SP_S_REBH, 0)) AS total_profit
      FROM SAL_POINT_INV
      ${whereSql}
      GROUP BY CONVERT(date, SP_S_DATE)
      ORDER BY CONVERT(date, SP_S_DATE) ASC
    `);

    res.json({
      ok: true,
      source: "sql-live",
      filters: { from, to },
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    console.error("POS DAILY SALES ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/api/pos-top-selling", async (req, res) => {
  try {
    const pool = await getPool();

    const from = normalizeDateInput(req.query.from);
    const to = normalizeDateInput(req.query.to);
    const top = Math.max(1, Math.min(parseInt(req.query.top || "10", 10), 100));

    const whereSql = buildDateFilterSql("SP_S_DATE", from, to, "h");

    const result = await pool.request().query(`
      SELECT TOP (${top})
        d.CLS_ID AS item_id,
        c.CLS_ARNAME AS item_name_ar,
        SUM(ISNULL(d.SP_SD_QLT, 0)) AS qty_sold,
        SUM(ISNULL(d.SP_SD_TOT_FORIGNVALUE, 0)) AS sales_value,
        SUM(
          ISNULL(d.SP_SD_TOT_FORIGNVALUE, 0) -
          (ISNULL(d.SP_SD_PRICE_COST, 0) * ISNULL(d.SP_SD_QLT, 0))
        ) AS calculated_profit
      FROM SAL_POINT_INV_DET d
      INNER JOIN SAL_POINT_INV h
        ON h.SP_S_ID = d.SP_S_ID
      LEFT JOIN CLASSES c
        ON c.CLS_ID = d.CLS_ID
      ${whereSql}
      GROUP BY d.CLS_ID, c.CLS_ARNAME
      ORDER BY SUM(ISNULL(d.SP_SD_QLT, 0)) DESC, d.CLS_ID ASC
    `);

    res.json({
      ok: true,
      source: "sql-live",
      filters: { from, to, top },
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (err) {
    console.error("POS TOP SELLING ERROR:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`SMART PHARMACY API RUNNING ON ${PORT}`);
  console.log("SQL SERVER  : DESKTOP-FOKGJSF\\SQLEXPRESS");
  console.log("DATABASE    : D:\\DB_SPOIN\\AMANSOFTS_20_10_2025.MDF");
});

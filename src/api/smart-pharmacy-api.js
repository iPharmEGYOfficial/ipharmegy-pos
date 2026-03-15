const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4015;

const EXPORTS_DIR = path.join(__dirname, "..", "..", "exports");
const SUMMARY_FILE = path.join(EXPORTS_DIR, "smart-pharmacy-summary.json");

app.use(cors());
app.use(express.json());

function safeReadSummary() {
  try {
    if (!fs.existsSync(SUMMARY_FILE)) {
      return {
        ok: false,
        source: "missing-file",
        file: SUMMARY_FILE,
        generatedAt: null,
        data: null
      };
    }

    const raw = fs.readFileSync(SUMMARY_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return {
      ok: true,
      source: "json-export",
      file: SUMMARY_FILE,
      generatedAt: parsed.generatedAt || null,
      data: parsed
    };
  } catch (error) {
    return {
      ok: false,
      source: "read-error",
      file: SUMMARY_FILE,
      generatedAt: null,
      error: error.message,
      data: null
    };
  }
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function firstObject(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : {};
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pickNumber(obj, keys, fallback = 0) {
  if (!obj || typeof obj !== "object") return fallback;

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return toNumber(obj[key]);
    }
  }

  return fallback;
}

function sumByKeys(items, keys) {
  return arrayOrEmpty(items).reduce((sum, item) => {
    return sum + pickNumber(item, keys, 0);
  }, 0);
}

function buildDashboardPayload(summaryData) {
  const dashboardRow = firstObject(summaryData.dashboard || []);

  const sellingProductsCount =
    pickNumber(
      dashboardRow,
      ["selling_products_count", "selling_products", "products_count"],
      0
    ) || arrayOrEmpty(summaryData.topSelling).length;

  const deadStockCount =
    pickNumber(
      dashboardRow,
      ["dead_stock_count", "dead_stock", "dead_stock_products_count"],
      0
    ) || arrayOrEmpty(summaryData.deadStock).length;

  const lowStockRiskCount =
    pickNumber(
      dashboardRow,
      ["low_stock_risk_count", "low_stock_risk", "low_stock_count"],
      0
    ) || arrayOrEmpty(summaryData.lowStockRisk).length;

  const totalSalesValue =
    pickNumber(
      dashboardRow,
      ["total_sales_value", "total_sales", "sales_value"],
      0
    ) ||
    sumByKeys(summaryData.dailySales, [
      "total_sales_value",
      "total",
      "sales_value"
    ]);

  const estimatedTotalProfit =
    pickNumber(
      dashboardRow,
      ["estimated_total_profit", "estimated_profit", "profit"],
      0
    ) ||
    sumByKeys(summaryData.profitability, [
      "estimated_profit",
      "profit"
    ]);

  return {
    selling_products_count: sellingProductsCount,
    dead_stock_count: deadStockCount,
    low_stock_risk_count: lowStockRiskCount,
    total_sales_value: totalSalesValue,
    estimated_total_profit: estimatedTotalProfit
  };
}

function okListResponse(tenantCode, summary, data) {
  return {
    ok: true,
    tenantCode,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  };
}

function emptyListResponse(tenantCode, summary) {
  return {
    ok: true,
    tenantCode,
    count: 0,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data: []
  };
}

app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    app: "iPharmEGY POS Smart Pharmacy API",
    port: PORT,
    status: "running",
    sourceFile: SUMMARY_FILE
  });
});

app.get("/api/health", (req, res) => {
  const summary = safeReadSummary();

  res.status(200).json({
    ok: true,
    app: "iPharmEGY POS Smart Pharmacy API",
    status: "online",
    summaryAvailable: summary.ok,
    source: summary.source,
    generatedAt: summary.generatedAt
  });
});

app.get("/api/intelligence/dashboard/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: [
        {
          selling_products_count: 0,
          dead_stock_count: 0,
          low_stock_risk_count: 0,
          total_sales_value: 0,
          estimated_total_profit: 0
        }
      ]
    });
  }

  const dashboardData = buildDashboardPayload(summary.data);

  return res.status(200).json({
    ok: true,
    tenantCode,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data: [dashboardData]
  });
});

app.get("/api/intelligence/top-selling/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "20", 10);
  const data = arrayOrEmpty(summary.data.topSelling).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.get("/api/intelligence/dead-stock/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "20", 10);
  const data = arrayOrEmpty(summary.data.deadStock).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.get("/api/intelligence/low-stock/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "20", 10);
  const data = arrayOrEmpty(summary.data.lowStockRisk).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.get("/api/intelligence/profitability/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "20", 10);
  const data = arrayOrEmpty(summary.data.profitability).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.get("/api/intelligence/daily-sales/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "30", 10);
  const data = arrayOrEmpty(summary.data.dailySales).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.get("/api/intelligence/expiry-risk/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "20", 10);
  const data = arrayOrEmpty(summary.data.expiryRisk).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.get("/api/intelligence/slow-moving/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "20", 10);
  const data = arrayOrEmpty(summary.data.slowMoving).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.get("/api/intelligence/smart-reorder/taif-main", (req, res) => {
  const tenantCode = "taif-main";
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json(emptyListResponse(tenantCode, summary));
  }

  const limit = parseInt(req.query.limit || "20", 10);
  const data = arrayOrEmpty(summary.data.smartReorder).slice(0, limit);

  return res.status(200).json(okListResponse(tenantCode, summary, data));
});

app.listen(PORT, () => {
  console.log("===================================");
  console.log("SMART PHARMACY API RUNNING");
  console.log(`http://127.0.0.1:${PORT}`);
  console.log(`Summary file: ${SUMMARY_FILE}`);
  console.log("===================================");
});
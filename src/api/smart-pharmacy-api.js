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
        data: null,
      };
    }

    const raw = fs.readFileSync(SUMMARY_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return {
      ok: true,
      source: "json-export",
      file: SUMMARY_FILE,
      generatedAt: parsed.generatedAt || null,
      data: parsed,
    };
  } catch (error) {
    return {
      ok: false,
      source: "read-error",
      file: SUMMARY_FILE,
      generatedAt: null,
      error: error.message,
      data: null,
    };
  }
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function firstObject(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : {};
}

function parseLimit(value, fallback = 20) {
  const n = parseInt(value || `${fallback}`, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function buildMockCatalog(summaryData) {
  const catalog = {};

  const topSelling = arrayOrEmpty(summaryData?.topSelling);
  const smartReorder = arrayOrEmpty(summaryData?.smartReorder);
  const slowMoving = arrayOrEmpty(summaryData?.slowMoving);

  topSelling.forEach((item) => {
    const productId = String(item.product_id ?? "");
    if (!productId) return;

    const totalQty = Number(item.total_sold_qty || 0);
    const totalSales = Number(item.total_sales_value || 0);
    const unitPrice = totalQty > 0 ? totalSales / totalQty : 0;

    catalog[productId] = {
      barcode: productId,
      product_id: item.product_id,
      name: item.product_name_ar || `Product ${productId}`,
      price: Number(unitPrice.toFixed(2)),
      source: "topSelling",
    };
  });

  smartReorder.forEach((item) => {
    const productId = String(item.product_id ?? "");
    if (!productId || catalog[productId]) return;

    catalog[productId] = {
      barcode: productId,
      product_id: item.product_id,
      name: item.product_name_ar || `Product ${productId}`,
      price: 10,
      source: "smartReorder",
    };
  });

  slowMoving.forEach((item) => {
    const productId = String(item.product_id ?? "");
    if (!productId || catalog[productId]) return;

    catalog[productId] = {
      barcode: productId,
      product_id: item.product_id,
      name: item.product_name_ar || `Product ${productId}`,
      price: 10,
      source: "slowMoving",
    };
  });

  // Mock barcodes for easy manual testing
  if (!catalog["123"]) {
    catalog["123"] = {
      barcode: "123",
      product_id: 123,
      name: "Panadol",
      price: 5,
      source: "mock",
    };
  }

  if (!catalog["456"]) {
    catalog["456"] = {
      barcode: "456",
      product_id: 456,
      name: "Cetaphil",
      price: 20,
      source: "mock",
    };
  }

  if (!catalog["789"]) {
    catalog["789"] = {
      barcode: "789",
      product_id: 789,
      name: "Biomil Milk",
      price: 35,
      source: "mock",
    };
  }

  return catalog;
}

app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    app: "iPharmEGY POS Smart Pharmacy API",
    port: PORT,
    status: "running",
    sourceFile: SUMMARY_FILE,
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
    generatedAt: summary.generatedAt,
  });
});

app.get("/api/intelligence/dashboard/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: "taif-main",
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary,
    });
  }

  const data = firstObject(summary.data.dashboard || []);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/top-selling/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: "taif-main",
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary,
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.topSelling).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/dead-stock/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: "taif-main",
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary,
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.deadStock).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/low-stock/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: "taif-main",
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary,
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.lowStockRisk).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/profitability/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: "taif-main",
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary,
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.profitability).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/daily-sales/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: "taif-main",
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary,
    });
  }

  const limit = parseLimit(req.query.limit, 30);
  const data = arrayOrEmpty(summary.data.dailySales).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/expiry-risk/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode: "taif-main",
      count: 0,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: [],
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.expiryRisk).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/slow-moving/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode: "taif-main",
      count: 0,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: [],
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.slowMoving).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

app.get("/api/intelligence/smart-reorder/taif-main", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode: "taif-main",
      count: 0,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: [],
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.smartReorder).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: "taif-main",
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data,
  });
});

// ========================================
// ITEM LOOKUP FOR POS
// ========================================
app.get("/api/item/:barcode", (req, res) => {
  const { barcode } = req.params;
  const summary = safeReadSummary();

  const catalog = buildMockCatalog(summary.data || {});
  const item = catalog[String(barcode)];

  if (!item) {
    return res.status(404).json({
      ok: false,
      message: "Item not found",
      barcode,
    });
  }

  return res.status(200).json({
    ok: true,
    ...item,
  });
});

// ========================================
// SAVE SALE (demo / v1 local persistence)
// ========================================
app.post("/api/sale", (req, res) => {
  try {
    const sale = req.body || {};
    const saleId = Date.now();

    const salesDir = path.join(EXPORTS_DIR, "sales");
    if (!fs.existsSync(salesDir)) {
      fs.mkdirSync(salesDir, { recursive: true });
    }

    const filePath = path.join(salesDir, `sale-${saleId}.json`);
    const payload = {
      saleId,
      createdAt: new Date().toISOString(),
      ...sale,
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");

    console.log("===================================");
    console.log("NEW SALE SAVED");
    console.log(filePath);
    console.log(JSON.stringify(payload, null, 2));
    console.log("===================================");

    return res.status(200).json({
      ok: true,
      success: true,
      message: "Sale saved successfully",
      saleId,
      filePath,
    });
  } catch (error) {
    console.error("SALE SAVE ERROR:", error);
    return res.status(500).json({
      ok: false,
      success: false,
      message: "Failed to save sale",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log("===================================");
  console.log("SMART PHARMACY API RUNNING");
  console.log(`http://127.0.0.1:${PORT}`);
  console.log(`Summary file: ${SUMMARY_FILE}`);
  console.log("===================================");
});
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4015;

const EXPORTS_DIR = path.join(__dirname, "..", "..", "exports");
const SUMMARY_FILE = path.join(EXPORTS_DIR, "smart-pharmacy-summary.json");
const SALES_DIR = path.join(EXPORTS_DIR, "sales");
const TENANT_CODE = "taif-main";

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

function parseLimit(value, fallback = 20) {
  const n = parseInt(value || `${fallback}`, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildMockCatalog(summaryData) {
  const catalog = {};

  const topSelling = arrayOrEmpty(summaryData?.topSelling);
  const smartReorder = arrayOrEmpty(summaryData?.smartReorder);
  const slowMoving = arrayOrEmpty(summaryData?.slowMoving);

  topSelling.forEach((item) => {
    const productId = String(item.product_id ?? item.CLS_ID ?? "");
    if (!productId) return;

    const totalQty = toNumber(item.total_sold_qty ?? item.TotalQty, 0);
    const totalSales = toNumber(item.total_sales_value ?? item.TotalSales, 0);
    const unitPrice = totalQty > 0 ? totalSales / totalQty : 0;

    catalog[productId] = {
      barcode: productId,
      product_id: item.product_id ?? item.CLS_ID ?? productId,
      name: item.product_name_ar || item.ItemNameAr || `Product ${productId}`,
      price: Number(unitPrice.toFixed(2)),
      source: "topSelling"
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
      source: "smartReorder"
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
      source: "slowMoving"
    };
  });

  if (!catalog["123"]) {
    catalog["123"] = {
      barcode: "123",
      product_id: 123,
      name: "Panadol",
      price: 5,
      source: "mock"
    };
  }

  if (!catalog["456"]) {
    catalog["456"] = {
      barcode: "456",
      product_id: 456,
      name: "Cetaphil",
      price: 20,
      source: "mock"
    };
  }

  if (!catalog["789"]) {
    catalog["789"] = {
      barcode: "789",
      product_id: 789,
      name: "Biomil Milk",
      price: 35,
      source: "mock"
    };
  }

  return catalog;
}

function getDashboardSummary(summaryData) {
  const dashboard = firstObject(summaryData?.dashboard || []);

  if (Object.keys(dashboard).length > 0) {
    return {
      totalOrders: toNumber(
        dashboard.total_orders ??
        dashboard.totalOrders ??
        dashboard.orders ??
        0
      ),
      totalSales: toNumber(
        dashboard.total_sales_value ??
        dashboard.totalSales ??
        dashboard.sales ??
        0
      ),
      estimatedProfit: toNumber(
        dashboard.estimated_total_profit ??
        dashboard.estimatedProfit ??
        dashboard.profit ??
        0
      ),
      deadStock: toNumber(
        dashboard.dead_stock_count ??
        dashboard.deadStock ??
        0
      ),
      lowStock: toNumber(
        dashboard.low_stock_risk_count ??
        dashboard.lowStock ??
        0
      )
    };
  }

  const topSelling = arrayOrEmpty(summaryData?.topSelling);

  const totalOrders = topSelling.reduce(
    (sum, item) => sum + toNumber(item.total_sold_qty ?? item.TotalQty, 0),
    0
  );

  const totalSales = topSelling.reduce(
    (sum, item) => sum + toNumber(item.total_sales_value ?? item.TotalSales, 0),
    0
  );

  return {
    totalOrders,
    totalSales,
    estimatedProfit: 0,
    deadStock: arrayOrEmpty(summaryData?.deadStock).length,
    lowStock: arrayOrEmpty(summaryData?.lowStockRisk).length
  };
}

function readSavedSales(limit = 20) {
  try {
    if (!fs.existsSync(SALES_DIR)) {
      return [];
    }

    const files = fs
      .readdirSync(SALES_DIR)
      .filter((name) => name.toLowerCase().endsWith(".json"))
      .map((name) => path.join(SALES_DIR, name));

    const items = files
      .map((filePath) => {
        try {
          const raw = fs.readFileSync(filePath, "utf8");
          const sale = JSON.parse(raw);

          const cart = Array.isArray(sale.cart) ? sale.cart : [];
          const totalSales =
            toNumber(sale.total) ||
            cart.reduce((sum, item) => {
              const itemTotal =
                item.total ??
                toNumber(item.price, 0) * toNumber(item.qty, 0);
              return sum + toNumber(itemTotal, 0);
            }, 0);

          return {
            invoiceId: sale.saleId || path.basename(filePath, ".json"),
            saleDate: sale.createdAt || null,
            customerName: sale.customerName || null,
            totalSales,
            estimatedProfit: toNumber(sale.estimatedProfit, 0),
            source: "saved-sale"
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        const da = new Date(a.saleDate || 0).getTime();
        const db = new Date(b.saleDate || 0).getTime();
        return db - da;
      });

    return items.slice(0, limit);
  } catch {
    return [];
  }
}

function buildFallbackRecentSales(summaryData, limit = 5) {
  const dailySales = arrayOrEmpty(summaryData?.dailySales);

  if (dailySales.length > 0) {
    return dailySales.slice(0, limit).map((item, i) => ({
      invoiceId: item.invoiceId || item.day || item.date || `DS-${i + 1}`,
      saleDate: item.date || item.day || null,
      customerName: null,
      totalSales: toNumber(
        item.total_sales_value ?? item.totalSales ?? item.sales,
        0
      ),
      estimatedProfit: toNumber(
        item.estimated_profit ?? item.estimatedProfit ?? item.profit,
        0
      ),
      source: "dailySales"
    }));
  }

  const topSelling = arrayOrEmpty(summaryData?.topSelling);

  return topSelling.slice(0, limit).map((item, i) => ({
    invoiceId: 1000 + i,
    saleDate: null,
    customerName: null,
    totalSales: toNumber(item.total_sales_value ?? item.TotalSales, 0),
    estimatedProfit: 0,
    source: "topSelling-fallback"
  }));
}

function getRecentSalesData(summaryData, limit = 20) {
  const savedSales = readSavedSales(limit);
  if (savedSales.length > 0) {
    return savedSales.slice(0, limit);
  }
  return buildFallbackRecentSales(summaryData, limit);
}

app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    app: "iPharmEGY POS Smart Pharmacy API",
    tenantCode: TENANT_CODE,
    port: PORT,
    status: "running",
    sourceFile: SUMMARY_FILE,
    salesDir: SALES_DIR
  });
});

app.get("/api/health", (req, res) => {
  const summary = safeReadSummary();

  res.status(200).json({
    ok: true,
    app: "iPharmEGY POS Smart Pharmacy API",
    tenantCode: TENANT_CODE,
    status: "online",
    summaryAvailable: summary.ok,
    source: summary.source,
    generatedAt: summary.generatedAt
  });
});

app.get("/api/smart-summary", (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      status: "ERROR",
      message: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary
    });
  }

  const base = getDashboardSummary(summary.data);
  const topSelling = arrayOrEmpty(summary.data.topSelling).slice(0, 10);

  return res.status(200).json({
    ok: true,
    status: "OK",
    source: summary.source,
    generatedAt: summary.generatedAt,
    totalOrders: base.totalOrders,
    totalSales: base.totalSales,
    estimatedProfit: base.estimatedProfit,
    deadStock: base.deadStock,
    lowStock: base.lowStock,
    topSelling
  });
});

app.get(`/api/intelligence/dashboard/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: TENANT_CODE,
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary
    });
  }

  const data = firstObject(summary.data.dashboard || []);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/top-selling/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: TENANT_CODE,
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.topSelling).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/recent-sales/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode: TENANT_CODE,
      count: 0,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: []
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = getRecentSalesData(summary.data, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: data.length > 0 ? data[0].source : summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/dead-stock/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: TENANT_CODE,
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.deadStock).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/low-stock/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: TENANT_CODE,
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.lowStockRisk).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/profitability/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: TENANT_CODE,
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.profitability).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/daily-sales/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(500).json({
      ok: false,
      tenantCode: TENANT_CODE,
      error: "smart-pharmacy-summary.json is missing or unreadable",
      details: summary
    });
  }

  const limit = parseLimit(req.query.limit, 30);
  const data = arrayOrEmpty(summary.data.dailySales).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/expiry-risk/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode: TENANT_CODE,
      count: 0,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: []
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.expiryRisk).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/slow-moving/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode: TENANT_CODE,
      count: 0,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: []
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.slowMoving).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get(`/api/intelligence/smart-reorder/${TENANT_CODE}`, (req, res) => {
  const summary = safeReadSummary();

  if (!summary.ok || !summary.data) {
    return res.status(200).json({
      ok: true,
      tenantCode: TENANT_CODE,
      count: 0,
      source: summary.source,
      generatedAt: summary.generatedAt,
      data: []
    });
  }

  const limit = parseLimit(req.query.limit, 20);
  const data = arrayOrEmpty(summary.data.smartReorder).slice(0, limit);

  return res.status(200).json({
    ok: true,
    tenantCode: TENANT_CODE,
    count: data.length,
    source: summary.source,
    generatedAt: summary.generatedAt,
    data
  });
});

app.get("/api/item/:barcode", (req, res) => {
  const { barcode } = req.params;
  const summary = safeReadSummary();

  const catalog = buildMockCatalog(summary.data || {});
  const item = catalog[String(barcode)];

  if (!item) {
    return res.status(404).json({
      ok: false,
      message: "Item not found",
      barcode
    });
  }

  return res.status(200).json({
    ok: true,
    ...item
  });
});

app.post("/api/sale", (req, res) => {
  try {
    const sale = req.body || {};
    const saleId = Date.now();

    if (!fs.existsSync(SALES_DIR)) {
      fs.mkdirSync(SALES_DIR, { recursive: true });
    }

    const filePath = path.join(SALES_DIR, `sale-${saleId}.json`);
    const payload = {
      saleId,
      createdAt: new Date().toISOString(),
      ...sale
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
      filePath
    });
  } catch (error) {
    console.error("SALE SAVE ERROR:", error);
    return res.status(500).json({
      ok: false,
      success: false,
      message: "Failed to save sale",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log("===================================");
  console.log("SMART PHARMACY API RUNNING");
  console.log(`http://127.0.0.1:${PORT}`);
  console.log(`Tenant code: ${TENANT_CODE}`);
  console.log(`Summary file: ${SUMMARY_FILE}`);
  console.log(`Sales dir: ${SALES_DIR}`);
  console.log("===================================");
});
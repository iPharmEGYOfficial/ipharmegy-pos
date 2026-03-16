const fs = require("fs");
const path = require("path");

const EXPORT_DIR = path.join(__dirname, "..", "..", "exports");
const OUTPUT_FILE = path.join(EXPORT_DIR, "smart-pharmacy-summary.json");

function createTopSellingData() {
  return [
    {
      product_id: 1001,
      product_name_ar: "PANADOL EXTRA TAB",
      total_sold_qty: 522,
      total_sales_value: 5426.2,
      estimated_profit: 1180.0
    },
    {
      product_id: 1002,
      product_name_ar: "CETAPHIL MOIST 550 ML",
      total_sold_qty: 280,
      total_sales_value: 5670.14,
      estimated_profit: 1435.0
    },
    {
      product_id: 1003,
      product_name_ar: "BIOMIL PLUS 1 MILK 400 GM",
      total_sold_qty: 239,
      total_sales_value: 5730.0,
      estimated_profit: 960.0
    },
    {
      product_id: 1004,
      product_name_ar: "MENTEX 125ML SYRUP",
      total_sold_qty: 141,
      total_sales_value: 1980.0,
      estimated_profit: 440.0
    },
    {
      product_id: 1005,
      product_name_ar: "MARVELON 21 TAB",
      total_sold_qty: 118,
      total_sales_value: 1125.9,
      estimated_profit: 210.0
    },
    {
      product_id: 1006,
      product_name_ar: "BABY WELL 2 / 900",
      total_sold_qty: 109,
      total_sales_value: 5817.0,
      estimated_profit: 820.0
    },
    {
      product_id: 1007,
      product_name_ar: "مناديل بدون عطر 300",
      total_sold_qty: 91,
      total_sales_value: 1586.0,
      estimated_profit: 305.0
    },
    {
      product_id: 1008,
      product_name_ar: "QV MOISTURIZING CREAM 500 GM",
      total_sold_qty: 84,
      total_sales_value: 1907.0,
      estimated_profit: 696.17
    },
    {
      product_id: 1009,
      product_name_ar: "VIDROP ORAL DROP 15 ML",
      total_sold_qty: 82,
      total_sales_value: 1340.0,
      estimated_profit: 280.0
    },
    {
      product_id: 1010,
      product_name_ar: "ROYAL JUNIOR SYRUP",
      total_sold_qty: 81,
      total_sales_value: 820.0,
      estimated_profit: 150.0
    },
    {
      product_id: 1011,
      product_name_ar: "KAFOSED SYRUP",
      total_sold_qty: 78,
      total_sales_value: 1560.0,
      estimated_profit: 325.0
    },
    {
      product_id: 1012,
      product_name_ar: "ADOL 500MG 24 CAPLETS",
      total_sold_qty: 74,
      total_sales_value: 999.0,
      estimated_profit: 180.0
    },
    {
      product_id: 1013,
      product_name_ar: "YAZ PLUS 28 TAB",
      total_sold_qty: 71,
      total_sales_value: 1485.0,
      estimated_profit: 310.0
    },
    {
      product_id: 1014,
      product_name_ar: "SIMILAC 3 GOLD MILK 800 GM",
      total_sold_qty: 70,
      total_sales_value: 4909.0,
      estimated_profit: 735.0
    },
    {
      product_id: 1015,
      product_name_ar: "BABYJOY 5 XL 66 PCS",
      total_sold_qty: 67,
      total_sales_value: 1648.0,
      estimated_profit: 409.2
    }
  ];
}

function createDeadStockData() {
  return [
    { product_id: 2001, product_name_ar: "Q.V BABY BARRIER CREAM", balance_qty: 15 },
    { product_id: 2002, product_name_ar: "REFRESH LIQIGEL 15ML DROPS", balance_qty: 12 },
    { product_id: 2003, product_name_ar: "FUCIDIN H CREAM 30GM", balance_qty: 12 },
    { product_id: 2004, product_name_ar: "CENTRUM SILVER 30 TAB", balance_qty: 12 },
    { product_id: 2005, product_name_ar: "OMOFORMIN 500MG 20 TAB", balance_qty: 12 },
    { product_id: 2006, product_name_ar: "PANADOL BABY SUSP", balance_qty: 12 },
    { product_id: 2007, product_name_ar: "SALINOSE NASAL SPRAY 30 ML", balance_qty: 20 },
    { product_id: 2008, product_name_ar: "NEVOLEEN 4MG", balance_qty: 20 },
    { product_id: 2009, product_name_ar: "GLUCOPHAGE XR 750 MG", balance_qty: 15 },
    { product_id: 2010, product_name_ar: "CIALIS 20 MG 4 TAB", balance_qty: 19 },
    { product_id: 2011, product_name_ar: "DIFLUCAN 150MG 1 CAPS", balance_qty: 18 },
    { product_id: 2012, product_name_ar: "TELFAST 180MG 15 TAB", balance_qty: 18 },
    { product_id: 2013, product_name_ar: "PRIMOLUT-N 30 TAB", balance_qty: 18 },
    { product_id: 2014, product_name_ar: "PANADOL NIGHT 20 CAPLETS", balance_qty: 18 },
    { product_id: 2015, product_name_ar: "AVALON AVOGAIN 5% SPRAY", balance_qty: 15 }
  ];
}

function createLowStockRiskData() {
  return [
    { product_id: 3001, product_name_ar: "PANADOL EXTRA TAB", balance_qty: 4 },
    { product_id: 3002, product_name_ar: "MARVELON 21 TAB", balance_qty: 3 },
    { product_id: 3003, product_name_ar: "BIOMIL PLUS 1 MILK 400 GM", balance_qty: 2 },
    { product_id: 3004, product_name_ar: "CETAPHIL MOIST 550 ML", balance_qty: 3 },
    { product_id: 3005, product_name_ar: "MENTEX 125ML SYRUP", balance_qty: 1 },
    { product_id: 3006, product_name_ar: "BABY WELL 2 / 900", balance_qty: 2 },
    { product_id: 3007, product_name_ar: "SIMILAC 3 GOLD MILK 800 GM", balance_qty: 2 },
    { product_id: 3008, product_name_ar: "VIDROP ORAL DROP 15 ML", balance_qty: 4 },
    { product_id: 3009, product_name_ar: "ROYAL JUNIOR SYRUP", balance_qty: 2 },
    { product_id: 3010, product_name_ar: "KAFOSED SYRUP", balance_qty: 3 }
  ];
}

function createSmartReorderData() {
  return [
    {
      product_id: 4001,
      product_name_ar: "PANADOL EXTRA TAB",
      balance_qty: 4,
      sold_last_90_days: 118,
      recommendation: "URGENT ORDER"
    },
    {
      product_id: 4002,
      product_name_ar: "MENTEX 125ML SYRUP",
      balance_qty: 1,
      sold_last_90_days: 141,
      recommendation: "URGENT ORDER"
    },
    {
      product_id: 4003,
      product_name_ar: "BABY WELL 2 / 900",
      balance_qty: 2,
      sold_last_90_days: 91,
      recommendation: "REORDER"
    },
    {
      product_id: 4004,
      product_name_ar: "SIMILAC 3 GOLD MILK 800 GM",
      balance_qty: 2,
      sold_last_90_days: 70,
      recommendation: "REORDER"
    },
    {
      product_id: 4005,
      product_name_ar: "CETAPHIL MOIST 550 ML",
      balance_qty: 3,
      sold_last_90_days: 280,
      recommendation: "URGENT ORDER"
    }
  ];
}

function createSlowMovingData() {
  return [
    {
      product_id: 5001,
      product_name_ar: "Q.V BABY BARRIER CREAM",
      balance_qty: 15,
      sold_last_90_days: 0,
      movement_status: "DEAD"
    },
    {
      product_id: 5002,
      product_name_ar: "REFRESH LIQIGEL 15ML DROPS",
      balance_qty: 12,
      sold_last_90_days: 1,
      movement_status: "SLOW"
    },
    {
      product_id: 5003,
      product_name_ar: "FUCIDIN H CREAM 30GM",
      balance_qty: 12,
      sold_last_90_days: 1,
      movement_status: "SLOW"
    },
    {
      product_id: 5004,
      product_name_ar: "CENTRUM SILVER 30 TAB",
      balance_qty: 12,
      sold_last_90_days: 0,
      movement_status: "DEAD"
    },
    {
      product_id: 5005,
      product_name_ar: "SALINOSE NASAL SPRAY 30 ML",
      balance_qty: 20,
      sold_last_90_days: 2,
      movement_status: "SLOW"
    }
  ];
}

function createExpiryRiskData() {
  return [
    {
      product_id: 6001,
      product_name_ar: "MENTEX 125ML SYRUP",
      batch_no: "B2401",
      expiry_date: "2026-05-10",
      expiry_risk: "HIGH",
      batch_balance_qty: 3
    },
    {
      product_id: 6002,
      product_name_ar: "KAFOSED SYRUP",
      batch_no: "K8832",
      expiry_date: "2026-06-18",
      expiry_risk: "MEDIUM",
      batch_balance_qty: 5
    },
    {
      product_id: 6003,
      product_name_ar: "VIDROP ORAL DROP 15 ML",
      batch_no: "V1190",
      expiry_date: "2026-04-28",
      expiry_risk: "HIGH",
      batch_balance_qty: 4
    },
    {
      product_id: 6004,
      product_name_ar: "ROYAL JUNIOR SYRUP",
      batch_no: "R5521",
      expiry_date: "2026-07-02",
      expiry_risk: "LOW",
      batch_balance_qty: 6
    },
    {
      product_id: 6005,
      product_name_ar: "PANADOL BABY SUSP",
      batch_no: "P3348",
      expiry_date: "2026-05-22",
      expiry_risk: "MEDIUM",
      batch_balance_qty: 3
    }
  ];
}

function createDailySalesData() {
  return [
    { sales_date: "2026-03-01", total_sales_value: 14200 },
    { sales_date: "2026-03-02", total_sales_value: 15340 },
    { sales_date: "2026-03-03", total_sales_value: 16120 },
    { sales_date: "2026-03-04", total_sales_value: 14880 },
    { sales_date: "2026-03-05", total_sales_value: 17250 },
    { sales_date: "2026-03-06", total_sales_value: 16940 },
    { sales_date: "2026-03-07", total_sales_value: 15860 },
    { sales_date: "2026-03-08", total_sales_value: 17610 },
    { sales_date: "2026-03-09", total_sales_value: 18120 },
    { sales_date: "2026-03-10", total_sales_value: 17440 },
    { sales_date: "2026-03-11", total_sales_value: 16690 },
    { sales_date: "2026-03-12", total_sales_value: 15830 },
    { sales_date: "2026-03-13", total_sales_value: 16210 },
    { sales_date: "2026-03-14", total_sales_value: 17150 },
    { sales_date: "2026-03-15", total_sales_value: 17588 }
  ];
}

function createProfitabilityData(topSelling) {
  return topSelling.map((item) => ({
    product_id: item.product_id,
    product_name_ar: item.product_name_ar,
    estimated_profit: item.estimated_profit
  }));
}

function generateData() {
  const topSelling = createTopSellingData();
  const deadStock = createDeadStockData();
  const lowStockRisk = createLowStockRiskData();
  const smartReorder = createSmartReorderData();
  const slowMoving = createSlowMovingData();
  const expiryRisk = createExpiryRiskData();
  const dailySales = createDailySalesData();
  const profitability = createProfitabilityData(topSelling);

  const dashboard = [
    {
      selling_products_count: topSelling.length,
      dead_stock_count: deadStock.length,
      low_stock_risk_count: lowStockRisk.length,
      total_sales_value: dailySales.reduce(
        (sum, item) => sum + Number(item.total_sales_value || 0),
        0
      ),
      estimated_total_profit: profitability.reduce(
        (sum, item) => sum + Number(item.estimated_profit || 0),
        0
      )
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    dashboard,
    topSelling,
    deadStock,
    lowStockRisk,
    smartReorder,
    slowMoving,
    expiryRisk,
    dailySales,
    profitability
  };
}

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const data = generateData();

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), "utf8");

console.log("SMART PHARMACY ENGINE");
console.log("Summary generated:");
console.log(OUTPUT_FILE);
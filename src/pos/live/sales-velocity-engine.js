const { loadLiveSales } = require("./sales-live-engine");

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function classifyVelocity(avgDailyQty) {
  if (avgDailyQty >= 3) return "FAST";
  if (avgDailyQty >= 1) return "NORMAL";
  if (avgDailyQty > 0) return "SLOW";
  return "DEAD";
}

async function buildSalesVelocity(daysWindow = 60) {
  const live = await loadLiveSales();
  const rows = live.salesView;

  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  fromDate.setDate(fromDate.getDate() - daysWindow);

  const filtered = rows.filter(r => {
    const d = toDateOnly(r.saleDate);
    return d && d >= fromDate;
  });

  const map = new Map();

  for (const r of filtered) {
    const itemId = r.itemId;
    const qty = safeNumber(r.qty);
    const value = safeNumber(r.lineTotal);
    const saleDate = toDateOnly(r.saleDate);
    const saleDayKey = saleDate ? saleDate.toISOString().slice(0, 10) : null;

    if (!map.has(itemId)) {
      map.set(itemId, {
        itemId,
        totalQty: 0,
        totalValue: 0,
        salesDays: new Set()
      });
    }

    const x = map.get(itemId);
    x.totalQty += qty;
    x.totalValue += value;
    if (saleDayKey) x.salesDays.add(saleDayKey);
  }

  const velocity = Array.from(map.values()).map(x => {
    const avgDailyQty = x.totalQty / daysWindow;
    return {
      itemId: x.itemId,
      totalQty60: x.totalQty,
      totalValue60: x.totalValue,
      activeSalesDays: x.salesDays.size,
      avgDailyQty,
      velocityClass: classifyVelocity(avgDailyQty)
    };
  });

  const topFast = velocity
    .slice()
    .sort((a, b) => b.avgDailyQty - a.avgDailyQty)
    .slice(0, 20);

  const slowItems = velocity
    .filter(x => x.velocityClass === "SLOW")
    .sort((a, b) => a.avgDailyQty - b.avgDailyQty)
    .slice(0, 20);

  const deadItems = velocity
    .filter(x => x.velocityClass === "DEAD")
    .slice(0, 20);

  return {
    mode: "SALES_VELOCITY_ENGINE",
    safeMode: "READ_ONLY",
    sourceDatabase: "AMANSOFTS_PLUS",
    windowDays: daysWindow,
    totals: {
      salesRowsInWindow: filtered.length,
      distinctItems: velocity.length,
      totalQty60: velocity.reduce((s, x) => s + x.totalQty60, 0),
      totalValue60: velocity.reduce((s, x) => s + x.totalValue60, 0)
    },
    counts: {
      fast: velocity.filter(x => x.velocityClass === "FAST").length,
      normal: velocity.filter(x => x.velocityClass === "NORMAL").length,
      slow: velocity.filter(x => x.velocityClass === "SLOW").length,
      dead: velocity.filter(x => x.velocityClass === "DEAD").length
    },
    topFast,
    slowItems,
    deadItems
  };
}

module.exports = {
  buildSalesVelocity
};

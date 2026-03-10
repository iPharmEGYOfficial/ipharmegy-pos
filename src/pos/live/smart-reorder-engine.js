const path = require("path");

const { buildSalesVelocity } = require("./sales-velocity-engine");
const coreData = path.resolve(__dirname, "../../../../ipharmegy-core/data");

const ItemRepository = require(path.join(coreData, "repositories/ItemRepository"));
const StockRepository = require(path.join(coreData, "repositories/StockRepository"));
const memoryStore = require(path.join(coreData, "repositories/memory-store"));

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function roundUp(qty) {
  return Math.ceil(safeNumber(qty));
}

function priorityFromGap(currentQty, targetQty) {
  if (currentQty <= 0 && targetQty > 0) return "CRITICAL";
  if (currentQty < targetQty * 0.25) return "HIGH";
  if (currentQty < targetQty * 0.6) return "MEDIUM";
  return "LOW";
}

async function buildSmartReorder(daysTarget = 21) {
  const velocity = await buildSalesVelocity(60);

  const velocityMap = new Map(
    velocity.topFast
      .concat(velocity.slowItems)
      .concat(velocity.deadItems)
      .map(x => [x.itemId, x])
  );

  // safer: rebuild from all available stock + items already loaded in core memory
  const items = Array.from(memoryStore.items.values());
  const stocks = Array.from(memoryStore.stocks.values());

  const stockByItem = new Map();

  for (const s of stocks) {
    const itemId = s.itemId;
    const qty = safeNumber(s.qty);

    if (!stockByItem.has(itemId)) stockByItem.set(itemId, 0);
    stockByItem.set(itemId, stockByItem.get(itemId) + qty);
  }

  const candidates = [];

  for (const item of items) {
    const currentQty = safeNumber(stockByItem.get(item.itemId) || 0);
    const v = velocityMap.get(item.itemId);

    const avgDailyQty = v ? safeNumber(v.avgDailyQty) : 0;
    const expected21 = avgDailyQty * daysTarget;
    const targetQty = roundUp(expected21);
    const shortage = Math.max(0, targetQty - currentQty);

    if (shortage <= 0) continue;

    candidates.push({
      itemId: item.itemId,
      itemCode: item.itemCode,
      itemNameAr: item.itemNameAr,
      currentQty,
      avgDailyQty,
      targetDays: daysTarget,
      targetQty,
      shortage,
      suggestedOrderQty: roundUp(shortage),
      priority: priorityFromGap(currentQty, targetQty)
    });
  }

  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  candidates.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 9;
    const pb = priorityOrder[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    if (b.avgDailyQty !== a.avgDailyQty) return b.avgDailyQty - a.avgDailyQty;
    return a.itemId - b.itemId;
  });

  return {
    mode: "SMART_REORDER_ENGINE",
    safeMode: "READ_ONLY",
    sourceDatabase: "AMANSOFTS_PLUS",
    targetDays: daysTarget,
    reorderCount: candidates.length,
    criticalCount: candidates.filter(x => x.priority === "CRITICAL").length,
    highCount: candidates.filter(x => x.priority === "HIGH").length,
    mediumCount: candidates.filter(x => x.priority === "MEDIUM").length,
    lowCount: candidates.filter(x => x.priority === "LOW").length,
    candidates
  };
}

module.exports = {
  buildSmartReorder
};

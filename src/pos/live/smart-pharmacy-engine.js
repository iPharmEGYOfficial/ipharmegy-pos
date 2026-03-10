const { buildSalesIntelligence } = require("./sales-intelligence-engine");
const { buildSalesVelocity } = require("./sales-velocity-engine");
const { buildSmartReorder } = require("./smart-reorder-engine");
const { buildExpiryIntelligence } = require("./expiry-intelligence-engine");

async function buildSmartPharmacyEngine() {
  const sales = await buildSalesIntelligence();
  const velocity = await buildSalesVelocity(180);
  const reorder = await buildSmartReorder(21);
  const expiry = await buildExpiryIntelligence();

  return {
    mode: "SMART_PHARMACY_ENGINE",
    safeMode: "READ_ONLY",
    sourceDatabase: "AMANSOFTS_PLUS",

    sales: {
      totals: sales.totals,
      topByQty: sales.topByQty.slice(0, 5),
      topByValue: sales.topByValue.slice(0, 5),
      topByProfit: sales.topByProfit.slice(0, 5)
    },

    velocity: {
      windowDays: velocity.windowDays,
      totals: velocity.totals,
      counts: velocity.counts,
      topFast: velocity.topFast.slice(0, 5),
      slowItems: velocity.slowItems.slice(0, 5)
    },

    reorder: {
      targetDays: reorder.targetDays,
      reorderCount: reorder.reorderCount,
      criticalCount: reorder.criticalCount,
      highCount: reorder.highCount,
      mediumCount: reorder.mediumCount,
      lowCount: reorder.lowCount,
      topCandidates: reorder.candidates.slice(0, 5)
    },

    expiry: {
      totals: expiry.totals,
      expired: expiry.expired.slice(0, 5),
      expiringSoon: expiry.expiringSoon.slice(0, 5)
    }
  };
}

module.exports = {
  buildSmartPharmacyEngine
};

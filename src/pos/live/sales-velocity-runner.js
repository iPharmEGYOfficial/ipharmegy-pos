const { buildSalesVelocity } = require("./sales-velocity-engine");

async function run() {
  try {
    const result = await buildSalesVelocity(60);

    console.log(JSON.stringify({
      mode: result.mode,
      safeMode: result.safeMode,
      sourceDatabase: result.sourceDatabase,
      windowDays: result.windowDays,
      totals: result.totals,
      counts: result.counts,
      topFast: result.topFast.slice(0, 5),
      slowItems: result.slowItems.slice(0, 5),
      deadItems: result.deadItems.slice(0, 5)
    }, null, 2));
  } catch (err) {
    console.error("SALES VELOCITY FAILED");
    console.error(err);
    process.exitCode = 1;
  }
}

run();

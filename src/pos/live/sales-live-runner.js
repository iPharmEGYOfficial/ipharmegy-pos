const { loadLiveSales } = require("./sales-live-engine");

async function run() {
  try {
    const result = await loadLiveSales();

    console.log(JSON.stringify({
      mode: result.mode,
      safeMode: result.safeMode,
      sourceDatabase: result.sourceDatabase,
      extracted: result.extracted,
      salesRows: result.salesView.length,
      firstSalesRow: result.salesView[0] || null
    }, null, 2));
  } catch (err) {
    console.error("LIVE SALES ENGINE FAILED");
    console.error(err);
    process.exitCode = 1;
  }
}

run();

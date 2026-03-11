const { buildSmartPharmacyEngine } = require("./smart-pharmacy-engine");
const { exportSmartSummary } = require("./smart-pharmacy-exporter");

async function run() {
  try {
    const result = await buildSmartPharmacyEngine();

    exportSmartSummary(result);

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("SMART PHARMACY ENGINE FAILED");
    console.error(err);
    process.exitCode = 1;
  }
}

run();

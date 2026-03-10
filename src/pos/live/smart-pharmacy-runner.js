const { buildSmartPharmacyEngine } = require("./smart-pharmacy-engine");

async function run() {
  try {
    const result = await buildSmartPharmacyEngine();

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("SMART PHARMACY ENGINE FAILED");
    console.error(err);
    process.exitCode = 1;
  }
}

run();

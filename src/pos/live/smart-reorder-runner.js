const { buildSmartReorder } = require("./smart-reorder-engine");

async function run() {
  try {
    const result = await buildSmartReorder(21);

    console.log(JSON.stringify({
      mode: result.mode,
      safeMode: result.safeMode,
      sourceDatabase: result.sourceDatabase,
      targetDays: result.targetDays,
      reorderCount: result.reorderCount,
      criticalCount: result.criticalCount,
      highCount: result.highCount,
      mediumCount: result.mediumCount,
      lowCount: result.lowCount,
      topCandidates: result.candidates.slice(0, 20)
    }, null, 2));
  } catch (err) {
    console.error("SMART REORDER FAILED");
    console.error(err);
    process.exitCode = 1;
  }
}

run();

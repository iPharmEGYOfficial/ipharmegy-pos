const { buildSalesIntelligence } = require("./sales-intelligence-engine");

async function run(){

  try{

    const result = await buildSalesIntelligence();

    console.log(JSON.stringify({

      mode:result.mode,
      safeMode:result.safeMode,
      sourceDatabase:result.sourceDatabase,
      totals:result.totals,
      topByQty:result.topByQty.slice(0,5),
      topByValue:result.topByValue.slice(0,5),
      topByProfit:result.topByProfit.slice(0,5)

    },null,2));

  }catch(err){

    console.error("SALES INTELLIGENCE FAILED");
    console.error(err);
    process.exitCode = 1;

  }

}

run();

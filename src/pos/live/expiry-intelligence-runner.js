const { buildExpiryIntelligence } = require("./expiry-intelligence-engine");

async function run(){

  try{

    const result = await buildExpiryIntelligence();

    console.log(JSON.stringify({

      mode:result.mode,

      safeMode:result.safeMode,

      sourceDatabase:result.sourceDatabase,

      totals:result.totals,

      expired:result.expired.slice(0,5),

      expiringSoon:result.expiringSoon.slice(0,5)

    },null,2));

  }
  catch(err){

    console.error("EXPIRY ENGINE FAILED");
    console.error(err);
    process.exitCode = 1;

  }

}

run();

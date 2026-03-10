import fs from "fs"
import path from "path"

export function exportSmartSummary(engineOutput){

  const summary = {

    sales:{
      total: engineOutput.sales.totals.sales,
      profit: engineOutput.sales.totals.profit,
      rows: engineOutput.sales.totals.rows
    },

    expiry:{
      expired: engineOutput.expiry.totals.expired,
      expiring30: engineOutput.expiry.totals.expiring30,
      expiring90: engineOutput.expiry.totals.expiring90
    },

    reorder:{
      count: engineOutput.reorder.reorderCount
    },

    velocity:{
      items: engineOutput.velocity.totals.distinctItems,
      fast: engineOutput.velocity.counts.fast,
      normal: engineOutput.velocity.counts.normal,
      slow: engineOutput.velocity.counts.slow
    }

  }

  const exportDir = "D:/ipharmegy_repos/ipharmegy-pos/exports"

  if(!fs.existsSync(exportDir)){
    fs.mkdirSync(exportDir,{recursive:true})
  }

  fs.writeFileSync(
    path.join(exportDir,"smart-pharmacy-summary.json"),
    JSON.stringify(summary,null,2)
  )

  console.log("EXPORT WRITTEN  smart-pharmacy-summary.json")

}

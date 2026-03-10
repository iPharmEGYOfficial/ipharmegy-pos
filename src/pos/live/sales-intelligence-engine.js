const { loadLiveSales } = require("./sales-live-engine");

function safeNumber(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function aggregateByItem(rows){

  const map = new Map();

  for(const r of rows){

    const id = r.itemId;

    if(!map.has(id)){
      map.set(id,{
        itemId:id,
        totalQty:0,
        totalValue:0,
        totalCost:0,
        totalProfit:0
      });
    }

    const x = map.get(id);

    const qty = safeNumber(r.qty);
    const val = safeNumber(r.lineTotal);
    const cost = safeNumber(r.costPrice);

    x.totalQty += qty;
    x.totalValue += val;
    x.totalCost += cost;
    x.totalProfit += (val - cost);
  }

  return Array.from(map.values());
}

async function buildSalesIntelligence(){

  const live = await loadLiveSales();

  const rows = live.salesView;

  let totalSales = 0;
  let totalProfit = 0;
  let totalQty = 0;

  for(const r of rows){

    const val = safeNumber(r.lineTotal);
    const cost = safeNumber(r.costPrice);
    const qty = safeNumber(r.qty);

    totalSales += val;
    totalProfit += (val - cost);
    totalQty += qty;
  }

  const byItem = aggregateByItem(rows);

  const topByQty =
    [...byItem]
    .sort((a,b)=>b.totalQty-a.totalQty)
    .slice(0,20);

  const topByValue =
    [...byItem]
    .sort((a,b)=>b.totalValue-a.totalValue)
    .slice(0,20);

  const topByProfit =
    [...byItem]
    .sort((a,b)=>b.totalProfit-a.totalProfit)
    .slice(0,20);

  return {

    mode:"SALES_INTELLIGENCE_ENGINE",

    safeMode:"READ_ONLY",

    sourceDatabase:"AMANSOFTS_PLUS",

    totals:{
      sales:totalSales,
      profit:totalProfit,
      qty:totalQty,
      rows:rows.length
    },

    topByQty,
    topByValue,
    topByProfit
  };
}

module.exports = {
  buildSalesIntelligence
};

const { loadLiveSales } = require("./sales-live-engine");

function safeDate(v){
  if(!v) return null;
  const d = new Date(v);
  if(Number.isNaN(d.getTime())) return null;
  return d;
}

function classifyExpiry(days){

  if(days < 0) return "EXPIRED";
  if(days <= 30) return "EXPIRING_30";
  if(days <= 90) return "EXPIRING_90";
  if(days <= 180) return "EXPIRING_180";

  return "SAFE";
}

async function buildExpiryIntelligence(){

  const live = await loadLiveSales();
  const rows = live.salesView;

  const today = new Date();

  const expiryMap = new Map();

  for(const r of rows){

    const expiry = safeDate(r.expiryDate);

    if(!expiry) continue;

    const diffDays =
      Math.floor((expiry - today) / (1000*60*60*24));

    const state = classifyExpiry(diffDays);

    const key = r.itemId + "_" + expiry.toISOString();

    if(!expiryMap.has(key)){

      expiryMap.set(key,{
        itemId:r.itemId,
        expiryDate:expiry,
        daysLeft:diffDays,
        status:state,
        qty:0
      });
    }

    const x = expiryMap.get(key);

    x.qty += Number(r.qty || 0);
  }

  const list = Array.from(expiryMap.values());

  const expired =
    list.filter(x=>x.status==="EXPIRED");

  const exp30 =
    list.filter(x=>x.status==="EXPIRING_30");

  const exp90 =
    list.filter(x=>x.status==="EXPIRING_90");

  const exp180 =
    list.filter(x=>x.status==="EXPIRING_180");

  return{

    mode:"EXPIRY_INTELLIGENCE_ENGINE",

    safeMode:"READ_ONLY",

    sourceDatabase:"AMANSOFTS_PLUS",

    totals:{
      trackedBatches:list.length,
      expired:expired.length,
      expiring30:exp30.length,
      expiring90:exp90.length,
      expiring180:exp180.length
    },

    expired:expired.slice(0,20),

    expiringSoon:
      exp30.concat(exp90).slice(0,20)
  };

}

module.exports = {
  buildExpiryIntelligence
};

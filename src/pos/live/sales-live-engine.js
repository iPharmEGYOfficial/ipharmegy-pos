const path = require("path");

const coreData = path.resolve(__dirname, "../../../../ipharmegy-core/data");

const client = require(path.join(coreData, "sql/client"));
const queries = require(path.join(coreData, "sql/queries"));

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function loadHeadersBatch(batchSize = 1000) {
  let offset = 0;
  let rows = [];

  while (true) {
    const batch = await client.query(
      queries.salesHeadersBatch(offset, batchSize)
    );

    if (batch.length === 0) break;

    rows = rows.concat(batch);
    offset += batchSize;

    console.log("Loaded sales headers:", rows.length);
  }

  return rows;
}

async function loadDetailsBatch(batchSize = 2000) {
  let offset = 0;
  let rows = [];

  while (true) {
    const batch = await client.query(
      queries.salesDetailsBatch(offset, batchSize)
    );

    if (batch.length === 0) break;

    rows = rows.concat(batch);
    offset += batchSize;

    console.log("Loaded sales details:", rows.length);
  }

  return rows;
}

function buildHeaderIndex(headers) {
  return headers.reduce((acc, row) => {
    acc[row.SP_S_ID] = row;
    return acc;
  }, {});
}

function buildSalesView(headers, details) {
  const headerIndex = buildHeaderIndex(headers);

  return details.map(detail => {
    const header = headerIndex[detail.SP_S_ID] || null;

    return {
      saleDetailId: detail.SP_SD_ID,
      saleId: detail.SP_S_ID,
      itemId: detail.CLS_ID,
      qty: safeNumber(detail.SP_SD_QLT),
      freeQty: safeNumber(detail.SP_SD_QLT_FREE),
      price: safeNumber(detail.SP_SD_PRICE),
      lineTotal: safeNumber(detail.SP_SD_TOT_FORIGNVALUE),
      costPrice: safeNumber(detail.SP_SD_PRICE_COST),
      barcode: detail.SP_SD_CLS_BARCODE,
      expiryDate: detail.SP_SD_DATE_EX,
      salesTax: safeNumber(detail.SP_SD_SALES_TAX),
      tax: safeNumber(detail.SP_SD_TAX),
      saleDate: header ? header.SP_S_DATE : null,
      customerId: header ? header.CUS_ID : null,
      customerNameAr: header ? header.CUS_ARNAME : null,
      invoiceTotal: header ? safeNumber(header.SP_S_TOT_FORIGNVALUE) : 0,
      invoiceCost: header ? safeNumber(header.SP_S_COST) : 0,
      invoiceProfit: header ? safeNumber(header.SP_S_REBH) : 0,
      invoiceTax: header ? safeNumber(header.SP_S_TAX) : 0,
      itemCountInInvoice: header ? safeNumber(header.SP_S_COUNT) : 0,
      prescriptionNo: header ? header.PRESCRIPTIONNO : null,
      returnNo: header ? header.SP_S_RET_NO : null,
      returnDate: header ? header.SP_S_RET_DATE : null
    };
  });
}

async function loadLiveSales() {
  const headers = await loadHeadersBatch(1000);
  const details = await loadDetailsBatch(2000);
  const salesView = buildSalesView(headers, details);

  return {
    mode: "LIVE_SALES_ENGINE",
    safeMode: "READ_ONLY",
    sourceDatabase: "AMANSOFTS_PLUS",
    extracted: {
      salesHeaders: headers.length,
      salesDetails: details.length
    },
    salesView
  };
}

module.exports = {
  loadLiveSales
};

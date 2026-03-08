const fieldMap = require("./shamel-pos-field-map");

module.exports = {
  entity: "SaleInvoice",
  tables: ["SALES_HEADER", "SALES_DETAILS"],
  map: fieldMap.filter(x => x.targetEntity === "SaleInvoice" || x.targetEntity === "SaleInvoiceLine")
};

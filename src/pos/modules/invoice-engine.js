module.exports = {
  name: "Invoice Engine",
  entities: ["SaleInvoice", "Receipt"],
  sourceTables: ["SALES_HEADER", "DOC_DESIGN"],
  mode: "transactional"
};

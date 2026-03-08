module.exports = {
  name: "Sales Engine",
  entities: ["SaleInvoice", "SaleInvoiceLine"],
  sourceTables: ["SALES_HEADER", "SALES_DETAILS"],
  mode: "transactional"
};

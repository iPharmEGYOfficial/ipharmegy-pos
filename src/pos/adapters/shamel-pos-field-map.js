module.exports = [
  { sourceTable: "SALES_HEADER", sourceColumn: "BILL_NO", targetEntity: "SaleInvoice", targetField: "invoiceNo" },
  { sourceTable: "SALES_HEADER", sourceColumn: "BILL_DATE", targetEntity: "SaleInvoice", targetField: "invoiceDate" },
  { sourceTable: "SALES_DETAILS", sourceColumn: "CLS_ID", targetEntity: "SaleInvoiceLine", targetField: "itemId" },
  { sourceTable: "SALES_DETAILS", sourceColumn: "QTY", targetEntity: "SaleInvoiceLine", targetField: "qty" },
  { sourceTable: "CUSTOMERS", sourceColumn: "CUS_NO", targetEntity: "Customer", targetField: "customerId" },
  { sourceTable: "CUSTOMERS", sourceColumn: "CUS_NAME", targetEntity: "Customer", targetField: "customerName" }
];

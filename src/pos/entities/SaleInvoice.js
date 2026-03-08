function SaleInvoice(props = {}) {
  return {
    type: "SaleInvoice",
    invoiceId: props.invoiceId || null,
    invoiceNo: props.invoiceNo || "",
    invoiceDate: props.invoiceDate || null,
    customerId: props.customerId || null,
    total: props.total || 0,
    source: props.source || "ipharmegy"
  };
}
module.exports = SaleInvoice;

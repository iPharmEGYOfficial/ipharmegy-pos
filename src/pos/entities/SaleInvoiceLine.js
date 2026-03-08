function SaleInvoiceLine(props = {}) {
  return {
    type: "SaleInvoiceLine",
    invoiceId: props.invoiceId || null,
    itemId: props.itemId || null,
    qty: props.qty || 0,
    price: props.price || 0,
    total: props.total || 0,
    source: props.source || "ipharmegy"
  };
}
module.exports = SaleInvoiceLine;

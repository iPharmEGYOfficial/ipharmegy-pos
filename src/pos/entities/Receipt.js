function Receipt(props = {}) {
  return {
    type: "Receipt",
    receiptId: props.receiptId || null,
    invoiceId: props.invoiceId || null,
    printMode: props.printMode || "standard",
    copies: props.copies || 1,
    source: props.source || "ipharmegy"
  };
}
module.exports = Receipt;

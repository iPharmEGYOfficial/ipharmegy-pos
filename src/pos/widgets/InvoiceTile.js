function InvoiceTile(props = {}) {
  return { type: "InvoiceTile", title: props.title || "Invoice", value: props.value || "" };
}
module.exports = InvoiceTile;

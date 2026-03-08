function ReceiptTile(props = {}) {
  return { type: "ReceiptTile", title: props.title || "Receipt", value: props.value || "" };
}
module.exports = ReceiptTile;

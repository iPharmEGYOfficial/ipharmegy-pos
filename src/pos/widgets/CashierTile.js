function CashierTile(props = {}) {
  return { type: "CashierTile", title: props.title || "Cashier", value: props.value || "" };
}
module.exports = CashierTile;

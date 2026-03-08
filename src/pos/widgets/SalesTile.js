function SalesTile(props = {}) {
  return { type: "SalesTile", title: props.title || "Sales", value: props.value || "" };
}
module.exports = SalesTile;

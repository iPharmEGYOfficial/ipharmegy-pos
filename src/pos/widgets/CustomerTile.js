function CustomerTile(props = {}) {
  return { type: "CustomerTile", title: props.title || "Customer", value: props.value || "" };
}
module.exports = CustomerTile;

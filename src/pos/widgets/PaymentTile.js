function PaymentTile(props = {}) {
  return { type: "PaymentTile", title: props.title || "Payment", value: props.value || "" };
}
module.exports = PaymentTile;

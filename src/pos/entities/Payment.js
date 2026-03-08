function Payment(props = {}) {
  return {
    type: "Payment",
    paymentId: props.paymentId || null,
    invoiceId: props.invoiceId || null,
    method: props.method || "",
    amount: props.amount || 0,
    source: props.source || "ipharmegy"
  };
}
module.exports = Payment;

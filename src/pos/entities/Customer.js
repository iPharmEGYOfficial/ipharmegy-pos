function Customer(props = {}) {
  return {
    type: "Customer",
    customerId: props.customerId || null,
    customerCode: props.customerCode || "",
    customerName: props.customerName || "",
    source: props.source || "ipharmegy"
  };
}
module.exports = Customer;

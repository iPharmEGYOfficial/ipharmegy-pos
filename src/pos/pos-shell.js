function PosShell() {
  return {
    type: "PosShell",
    module: "pos",
    name: "iPharmEGY POS Engine",
    sections: [
      "Sales",
      "Invoices",
      "Cashier",
      "Payments",
      "Customers",
      "Receipts",
      "Shamel Import",
      "Compliance Mapping",
      "Simulation Layer"
    ]
  };
}

module.exports = PosShell;

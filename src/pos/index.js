module.exports = {
  shell: require("./pos-shell"),
  map: require("./pos-map"),
  routes: require("./pos-routes"),
  status: require("./pos-status"),
  context: require("./pos-context"),
  modules: {
    salesEngine: require("./modules/sales-engine"),
    invoiceEngine: require("./modules/invoice-engine"),
    cashierEngine: require("./modules/cashier-engine"),
    paymentEngine: require("./modules/payment-engine"),
    customerEngine: require("./modules/customer-engine"),
    receiptEngine: require("./modules/receipt-engine"),
    shamelBridgeEngine: require("./modules/shamel-bridge-engine"),
    complianceEngine: require("./modules/compliance-engine"),
    simulationEngine: require("./modules/simulation-engine")
  },
  adapters: {
    tables: require("./adapters/shamel-pos-tables"),
    fieldMap: require("./adapters/shamel-pos-field-map"),
    policy: require("./adapters/shamel-pos-import-policy"),
    salesAdapter: require("./adapters/shamel-sales-adapter"),
    customerAdapter: require("./adapters/shamel-customer-adapter"),
    receiptAdapter: require("./adapters/shamel-receipt-adapter")
  },
  services: {
    salesService: require("./services/sales-service"),
    invoiceService: require("./services/invoice-service"),
    cashierService: require("./services/cashier-service"),
    paymentService: require("./services/payment-service"),
    customerService: require("./services/customer-service"),
    receiptService: require("./services/receipt-service"),
    importService: require("./services/import-service")
  },
  compliance: require("./compliance/compliance-rules"),
  simulation: require("./simulation/simulation-scenarios"),
  pages: {
    SalesPage: require("./pages/SalesPage"),
    InvoicesPage: require("./pages/InvoicesPage"),
    CashierPage: require("./pages/CashierPage"),
    PaymentsPage: require("./pages/PaymentsPage"),
    CustomersPage: require("./pages/CustomersPage"),
    ReceiptsPage: require("./pages/ReceiptsPage"),
    ShamelImportPage: require("./pages/ShamelImportPage"),
    CompliancePage: require("./pages/CompliancePage"),
    SimulationPage: require("./pages/SimulationPage")
  },
  widgets: {
    SalesTile: require("./widgets/SalesTile"),
    InvoiceTile: require("./widgets/InvoiceTile"),
    CashierTile: require("./widgets/CashierTile"),
    PaymentTile: require("./widgets/PaymentTile"),
    CustomerTile: require("./widgets/CustomerTile"),
    ReceiptTile: require("./widgets/ReceiptTile")
  }
};

module.exports = {
  name: "Payment Engine",
  entities: ["Payment"],
  sourceTables: ["VISA_CARD", "COIN_TABLE", "BANKS"],
  mode: "operational"
};

const fieldMap = require("./shamel-pos-field-map");

module.exports = {
  entity: "Customer",
  tables: ["CUSTOMERS", "GROUP_CUS", "DISCOUNT_CUS"],
  map: fieldMap.filter(x => x.targetEntity === "Customer")
};

function PosComplianceMap(props = {}) {
  return {
    type: "PosComplianceMap",
    sourceTable: props.sourceTable || "",
    sourceColumn: props.sourceColumn || "",
    targetEntity: props.targetEntity || "",
    targetField: props.targetField || "",
    mode: "mapping-only"
  };
}
module.exports = PosComplianceMap;

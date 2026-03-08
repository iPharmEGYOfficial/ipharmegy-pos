function ShamelPosImportBatch(props = {}) {
  return {
    type: "ShamelPosImportBatch",
    importId: props.importId || null,
    importDate: props.importDate || null,
    sourceSystem: "shamel-plus",
    mode: "import-only",
    status: props.status || "pending"
  };
}
module.exports = ShamelPosImportBatch;

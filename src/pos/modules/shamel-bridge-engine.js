module.exports = {
  name: "Shamel Bridge Engine",
  source: "shamel-plus",
  mode: "import-only",
  restrictions: [
    "No direct update to Shamel",
    "No write-back to production database",
    "No disruption to live pharmacy workflow"
  ]
};

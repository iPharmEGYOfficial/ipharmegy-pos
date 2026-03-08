function CashierSession(props = {}) {
  return {
    type: "CashierSession",
    sessionId: props.sessionId || null,
    userId: props.userId || null,
    openTime: props.openTime || null,
    closeTime: props.closeTime || null,
    source: props.source || "ipharmegy"
  };
}
module.exports = CashierSession;

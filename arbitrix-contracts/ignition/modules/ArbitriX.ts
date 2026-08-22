import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ArbitriXModule = buildModule("ArbitriXModule", (m) => {
  const registry = m.contract("ArbitriXRegistry");
  const marketplace = m.contract("ArbitriXMarketplace", [registry]);
  const reviews = m.contract("ArbitriXReviews", [marketplace]);
  const auditLog = m.contract("ArbitriXAuditLog");
  return { registry, marketplace, reviews, auditLog };
});

export default ArbitriXModule;

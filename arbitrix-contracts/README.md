# ArbitriX Blockchain

Blockchain layer for the ArbitriX AI Marketplace.

Handles model registration, ownership, subscriptions, payments, creator withdrawals, verified reviews and audit hashes. Large model files, inference, API keys and analytics remain off-chain.

## Contracts
- ArbitriXRegistry.sol
- ArbitriXMarketplace.sol
- ArbitriXReviews.sol
- ArbitriXAuditLog.sol

## Deploy
```bash
npm install
npx hardhat compile
```

This is a hackathon starting point and has not been professionally audited. Do not use with real funds until reviewed.

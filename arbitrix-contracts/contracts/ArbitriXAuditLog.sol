// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArbitriXAuditLog {
    address public owner;
    mapping(address => bool) public authorizedReporters;
    struct UsageRecord { uint256 modelId; address user; uint256 tokens; bytes32 usageHash; uint256 timestamp; }
    UsageRecord[] private _usageRecords;
    event ModelDeploymentLogged(uint256 indexed modelId, address indexed creator, bytes32 deploymentHash, uint256 timestamp);
    event SubscriptionLogged(uint256 indexed modelId, address indexed subscriber, uint256 amount, bytes32 subscriptionHash, uint256 timestamp);
    event UsageLogged(uint256 indexed modelId, address indexed user, uint256 tokens, bytes32 usageHash, uint256 timestamp);
    event ReviewLogged(uint256 indexed modelId, address indexed reviewer, bytes32 reviewHash, uint256 timestamp);
    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyReporter() { require(authorizedReporters[msg.sender], "Not authorized reporter"); _; }
    constructor() { owner = msg.sender; authorizedReporters[msg.sender] = true; }
    function setReporter(address reporter, bool authorized) external onlyOwner { authorizedReporters[reporter] = authorized; }
    function logDeployment(uint256 modelId, address creator, bytes32 deploymentHash) external onlyReporter { emit ModelDeploymentLogged(modelId, creator, deploymentHash, block.timestamp); }
    function logSubscription(uint256 modelId, address subscriber, uint256 amount, bytes32 subscriptionHash) external onlyReporter { emit SubscriptionLogged(modelId, subscriber, amount, subscriptionHash, block.timestamp); }
    function logUsage(uint256 modelId, address user, uint256 tokens, bytes32 usageHash) external onlyReporter { _usageRecords.push(UsageRecord(modelId,user,tokens,usageHash,block.timestamp)); emit UsageLogged(modelId,user,tokens,usageHash,block.timestamp); }
    function logReview(uint256 modelId, address reviewer, bytes32 reviewHash) external onlyReporter { emit ReviewLogged(modelId, reviewer, reviewHash, block.timestamp); }
    function getUsageCount() external view returns (uint256) { return _usageRecords.length; }
    function getUsage(uint256 index) external view returns (UsageRecord memory) { require(index < _usageRecords.length, "Invalid index"); return _usageRecords[index]; }
}

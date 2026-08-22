// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IArbitriXRegistry { function getModel(uint256 modelId) external view returns (uint256,address,string memory,string memory,bytes32,bytes32,uint256,bool); }

contract ArbitriXMarketplace {
    enum BillingPeriod { Monthly, Yearly }
    struct Pricing { uint256 monthlyPrice; uint256 yearlyPrice; }
    struct Subscription { address subscriber; uint256 modelId; BillingPeriod period; uint256 amountPaid; uint256 startedAt; uint256 expiresAt; bool active; }
    IArbitriXRegistry public immutable registry;
    address public owner;
    uint256 public platformFeeBps = 500;
    uint256 private _nextSubscriptionId = 1;
    mapping(uint256 => Pricing) public pricing;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) private _subscriberSubscriptions;
    mapping(address => uint256) public creatorBalance;
    event PricingUpdated(uint256 indexed modelId, uint256 monthlyPrice, uint256 yearlyPrice);
    event SubscriptionCreated(uint256 indexed subscriptionId, uint256 indexed modelId, address indexed subscriber, BillingPeriod period, uint256 amount, uint256 expiresAt);
    event CreatorWithdrawal(address indexed creator, uint256 amount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    constructor(address registryAddress) { require(registryAddress != address(0), "Invalid registry"); registry = IArbitriXRegistry(registryAddress); owner = msg.sender; }
    function setPricing(uint256 modelId, uint256 monthlyPrice, uint256 yearlyPrice) external {
        (,address creator,,,,,,bool active) = registry.getModel(modelId);
        require(creator == msg.sender, "Not model creator"); require(active, "Model inactive"); require(monthlyPrice > 0 || yearlyPrice > 0, "Invalid pricing");
        pricing[modelId] = Pricing(monthlyPrice, yearlyPrice); emit PricingUpdated(modelId, monthlyPrice, yearlyPrice);
    }
    function subscribe(uint256 modelId, BillingPeriod period) external payable returns (uint256 subscriptionId) {
        (,address creator,,,,,,bool active) = registry.getModel(modelId);
        require(active && creator != address(0), "Invalid model");
        Pricing memory p = pricing[modelId]; uint256 price = period == BillingPeriod.Monthly ? p.monthlyPrice : p.yearlyPrice;
        require(price > 0, "Pricing not configured"); require(msg.value == price, "Incorrect payment");
        uint256 platformFee = (msg.value * platformFeeBps) / 10000; creatorBalance[creator] += msg.value - platformFee;
        uint256 duration = period == BillingPeriod.Monthly ? 30 days : 365 days; subscriptionId = _nextSubscriptionId++;
        subscriptions[subscriptionId] = Subscription(msg.sender, modelId, period, msg.value, block.timestamp, block.timestamp + duration, true);
        _subscriberSubscriptions[msg.sender].push(subscriptionId);
        emit SubscriptionCreated(subscriptionId, modelId, msg.sender, period, msg.value, block.timestamp + duration);
    }
    function isSubscribed(address user, uint256 modelId) external view returns (bool) {
        uint256[] memory ids = _subscriberSubscriptions[user];
        for (uint256 i=0; i<ids.length; i++) { Subscription memory s = subscriptions[ids[i]]; if (s.modelId == modelId && s.active && s.expiresAt > block.timestamp) return true; }
        return false;
    }
    function getUserSubscriptions(address user) external view returns (uint256[] memory) { return _subscriberSubscriptions[user]; }
    function withdrawCreatorEarnings() external { uint256 amount = creatorBalance[msg.sender]; require(amount > 0, "Nothing to withdraw"); creatorBalance[msg.sender] = 0; (bool ok,) = payable(msg.sender).call{value: amount}(""); require(ok, "Transfer failed"); emit CreatorWithdrawal(msg.sender, amount); }
    function setPlatformFee(uint256 newFeeBps) external onlyOwner { require(newFeeBps <= 2000, "Fee too high"); uint256 old = platformFeeBps; platformFeeBps = newFeeBps; emit PlatformFeeUpdated(old, newFeeBps); }
    function transferOwnership(address newOwner) external onlyOwner { require(newOwner != address(0), "Invalid owner"); owner = newOwner; }
}

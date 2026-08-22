// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IArbitriXSubscriptionChecker { function isSubscribed(address user, uint256 modelId) external view returns (bool); }
contract ArbitriXReviews {
    struct Review { address reviewer; uint256 modelId; uint8 rating; bytes32 reviewHash; uint256 timestamp; }
    IArbitriXSubscriptionChecker public immutable marketplace;
    mapping(uint256 => Review[]) private _modelReviews;
    mapping(address => mapping(uint256 => bool)) public hasReviewed;
    event ReviewSubmitted(uint256 indexed modelId, address indexed reviewer, uint8 rating, bytes32 reviewHash);
    constructor(address marketplaceAddress) { require(marketplaceAddress != address(0), "Invalid marketplace"); marketplace = IArbitriXSubscriptionChecker(marketplaceAddress); }
    function submitReview(uint256 modelId, uint8 rating, bytes32 reviewHash) external {
        require(rating >= 1 && rating <= 5, "Rating must be 1-5"); require(marketplace.isSubscribed(msg.sender, modelId), "Not a subscriber"); require(!hasReviewed[msg.sender][modelId], "Already reviewed");
        _modelReviews[modelId].push(Review(msg.sender, modelId, rating, reviewHash, block.timestamp)); hasReviewed[msg.sender][modelId] = true;
        emit ReviewSubmitted(modelId, msg.sender, rating, reviewHash);
    }
    function getReviews(uint256 modelId) external view returns (Review[] memory) { return _modelReviews[modelId]; }
}

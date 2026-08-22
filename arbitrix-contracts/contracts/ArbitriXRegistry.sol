// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ArbitriXRegistry {
    struct Model { uint256 id; address creator; string name; string metadataURI; bytes32 modelHash; bytes32 endpointHash; uint256 createdAt; bool active; }
    uint256 private _nextModelId = 1;
    mapping(uint256 => Model) private _models;
    mapping(address => uint256[]) private _creatorModels;
    event ModelRegistered(uint256 indexed modelId, address indexed creator, string name, bytes32 modelHash, bytes32 endpointHash, string metadataURI);
    event ModelStatusChanged(uint256 indexed modelId, bool active);
    modifier onlyCreator(uint256 modelId) { require(_models[modelId].creator == msg.sender, "Not model creator"); _; }
    function registerModel(string calldata name, string calldata metadataURI, bytes32 modelHash, bytes32 endpointHash) external returns (uint256 modelId) {
        require(bytes(name).length > 0, "Model name required");
        modelId = _nextModelId++;
        _models[modelId] = Model(modelId, msg.sender, name, metadataURI, modelHash, endpointHash, block.timestamp, true);
        _creatorModels[msg.sender].push(modelId);
        emit ModelRegistered(modelId, msg.sender, name, modelHash, endpointHash, metadataURI);
    }
    function deactivateModel(uint256 modelId) external onlyCreator(modelId) { _models[modelId].active = false; emit ModelStatusChanged(modelId, false); }
    function activateModel(uint256 modelId) external onlyCreator(modelId) { _models[modelId].active = true; emit ModelStatusChanged(modelId, true); }
    function getModel(uint256 modelId) external view returns (Model memory) { require(_models[modelId].creator != address(0), "Model does not exist"); return _models[modelId]; }
    function getCreatorModels(address creator) external view returns (uint256[] memory) { return _creatorModels[creator]; }
    function isModelActive(uint256 modelId) external view returns (bool) { return _models[modelId].active; }
}

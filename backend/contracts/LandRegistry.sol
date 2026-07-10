// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LandRegistry
/// @notice On-chain registry for land parcels: registration, government-verifier
///         attestation, and peer-to-peer ownership transfer. Document contents
///         (deeds, surveys, ID proofs) live off-chain on IPFS; only the content
///         hash is stored here, giving each record a tamper-proof fingerprint.
contract LandRegistry is Ownable, ReentrancyGuard {
    enum Status {
        Pending, // registered, awaiting verifier attestation
        Verified, // attested by an approved verifier
        Rejected // rejected by a verifier (can be re-submitted)
    }

    struct Property {
        uint256 id;
        string propertyCode; // human-readable id, e.g. "LC-2984-KB"
        address owner;
        string location;
        uint256 areaSqFt;
        string documentHash; // IPFS CID of the deed/survey bundle
        Status status;
        uint256 registeredAt;
        uint256 verifiedAt;
        address verifiedBy;
    }

    uint256 private _nextId = 1;

    mapping(uint256 => Property) private _properties;
    mapping(address => uint256[]) private _ownedProperties;
    mapping(address => bool) public isVerifier;

    event VerifierUpdated(address indexed account, bool approved);

    event PropertyRegistered(
        uint256 indexed id,
        address indexed owner,
        string propertyCode,
        string documentHash
    );

    event PropertyVerified(uint256 indexed id, address indexed verifier);
    event PropertyRejected(uint256 indexed id, address indexed verifier, string reason);

    event PropertyOwnershipTransferred(
        uint256 indexed id,
        address indexed previousOwner,
        address indexed newOwner
    );

    event DocumentUpdated(uint256 indexed id, string newDocumentHash);

    modifier onlyVerifier() {
        require(isVerifier[msg.sender], "LandRegistry: caller is not an approved verifier");
        _;
    }

    modifier onlyPropertyOwner(uint256 id) {
        require(_properties[id].owner == msg.sender, "LandRegistry: caller does not own this property");
        _;
    }

    modifier propertyExists(uint256 id) {
        require(_properties[id].id != 0, "LandRegistry: property does not exist");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        isVerifier[initialOwner] = true;
        emit VerifierUpdated(initialOwner, true);
    }

    // ---------------------------------------------------------------
    // Verifier management (contract owner = registry authority, e.g.
    // a government land-records department multisig)
    // ---------------------------------------------------------------

    function setVerifier(address account, bool approved) external onlyOwner {
        isVerifier[account] = approved;
        emit VerifierUpdated(account, approved);
    }

    // ---------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------

    function registerProperty(
        string calldata propertyCode,
        string calldata location,
        uint256 areaSqFt,
        string calldata documentHash
    ) external nonReentrant returns (uint256 id) {
        require(bytes(propertyCode).length > 0, "LandRegistry: propertyCode required");
        require(bytes(documentHash).length > 0, "LandRegistry: documentHash required");
        require(areaSqFt > 0, "LandRegistry: areaSqFt must be positive");

        id = _nextId++;

        _properties[id] = Property({
            id: id,
            propertyCode: propertyCode,
            owner: msg.sender,
            location: location,
            areaSqFt: areaSqFt,
            documentHash: documentHash,
            status: Status.Pending,
            registeredAt: block.timestamp,
            verifiedAt: 0,
            verifiedBy: address(0)
        });

        _ownedProperties[msg.sender].push(id);

        emit PropertyRegistered(id, msg.sender, propertyCode, documentHash);
    }

    // ---------------------------------------------------------------
    // Verification
    // ---------------------------------------------------------------

    function verifyProperty(uint256 id) external onlyVerifier propertyExists(id) {
        Property storage prop = _properties[id];
        require(prop.status != Status.Verified, "LandRegistry: already verified");

        prop.status = Status.Verified;
        prop.verifiedAt = block.timestamp;
        prop.verifiedBy = msg.sender;

        emit PropertyVerified(id, msg.sender);
    }

    function rejectProperty(uint256 id, string calldata reason)
        external
        onlyVerifier
        propertyExists(id)
    {
        Property storage prop = _properties[id];
        prop.status = Status.Rejected;
        emit PropertyRejected(id, msg.sender, reason);
    }

    // ---------------------------------------------------------------
    // Document updates (e.g. re-submitting after rejection)
    // ---------------------------------------------------------------

    function updateDocumentHash(uint256 id, string calldata newDocumentHash)
        external
        propertyExists(id)
        onlyPropertyOwner(id)
    {
        require(bytes(newDocumentHash).length > 0, "LandRegistry: documentHash required");
        Property storage prop = _properties[id];
        prop.documentHash = newDocumentHash;
        prop.status = Status.Pending; // any document change resets verification
        emit DocumentUpdated(id, newDocumentHash);
    }

    // ---------------------------------------------------------------
    // Transfer
    // ---------------------------------------------------------------

    function transferProperty(uint256 id, address newOwner)
        external
        nonReentrant
        propertyExists(id)
        onlyPropertyOwner(id)
    {
        require(newOwner != address(0), "LandRegistry: invalid new owner");
        require(newOwner != msg.sender, "LandRegistry: already the owner");

        Property storage prop = _properties[id];
        address previousOwner = prop.owner;

        prop.owner = newOwner;
        // A transfer moves the record back to Pending until the new
        // owner's title is re-attested by a verifier.
        prop.status = Status.Pending;

        _removeFromOwnerList(previousOwner, id);
        _ownedProperties[newOwner].push(id);

        emit PropertyOwnershipTransferred(id, previousOwner, newOwner);
    }

    function _removeFromOwnerList(address owner, uint256 id) private {
        uint256[] storage list = _ownedProperties[owner];
        uint256 len = list.length;
        for (uint256 i = 0; i < len; i++) {
            if (list[i] == id) {
                list[i] = list[len - 1];
                list.pop();
                break;
            }
        }
    }

    // ---------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------

    function getProperty(uint256 id)
        external
        view
        propertyExists(id)
        returns (Property memory)
    {
        return _properties[id];
    }

    function getPropertiesByOwner(address owner) external view returns (uint256[] memory) {
        return _ownedProperties[owner];
    }

    function totalProperties() external view returns (uint256) {
        return _nextId - 1;
    }
}

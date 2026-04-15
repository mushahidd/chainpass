// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error TicketIsSoulbound();
error TicketAlreadyUsed();
error NotAuthorizedScanner();
error MatchNotActive();
error WalletLimitReached();
error InvalidPersonCount();
error IncorrectPayment();
error MatchSoldOut();
error InvalidEnclosureConfig();
error DuplicateEnclosure();
error EnclosureNotFound();
error EnclosureSoldOut();

/**
 * @title ChainPass PSL
 * @dev STRICT MATCH HIERARCHY, CNIC IDENTITY BINDING, AND DOUBLE-BOOKING PREVENTION
 */
contract ChainPass is ERC721URIStorage, Ownable {
    uint256 public nextMatchId;
    uint256 private _nextTokenId;
    uint8 public constant MAX_TICKETS_PER_WALLET = 5;

    struct Match {
        string category;
        string teams;
        string stadium;
        uint256 matchTime;
        uint256 maxCapacity;
        uint256 currentMinted;
        bool isActive;
    }

    struct Enclosure {
        uint256 price;
        uint256 capacity;
        uint256 currentMinted;
        bool exists;
    }

    struct Ticket {
        uint256 matchId;
        string enclosure;
        uint256 personCount;
        uint256 paidPrice;
        bytes32 cnicHash;
        bool isUsed;
    }

    // --- State Mappings ---
    mapping(uint256 => Match) public matches;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => string[]) private _matchEnclosureNames;
    mapping(uint256 => mapping(bytes32 => Enclosure)) private _matchEnclosures;

    // matchId -> wallet -> family headcount for the single NFT pass
    mapping(uint256 => mapping(address => uint8)) public matchWalletMintCount;

    mapping(address => bool) public scanners;

    event MatchCreated(uint256 indexed matchId, string category, string teams, string stadium, uint256 matchTime, uint256 totalCapacity);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed matchId, address owner, bytes32 cnicHash);
    event TicketScanned(uint256 indexed tokenId, address indexed scanner);

    constructor() ERC721("ChainPass PSL", "CPPSL") Ownable(msg.sender) {}

    modifier onlyScanner() {
        if (!scanners[msg.sender] && msg.sender != owner()) revert NotAuthorizedScanner();
        _;
    }

    // --- ADMIN PROTOCOLS ---

    function setScanner(address scanner, bool status) public onlyOwner {
        scanners[scanner] = status;
    }

    function createMatch(
        string memory category,
        string memory teams,
        string memory stadium,
        uint256 matchTime,
        string[] memory enclosureNames,
        uint256[] memory enclosurePrices,
        uint256[] memory enclosureCapacities
    ) public onlyOwner {
        if (
            enclosureNames.length == 0 ||
            enclosureNames.length != enclosurePrices.length ||
            enclosureNames.length != enclosureCapacities.length
        ) {
            revert InvalidEnclosureConfig();
        }

        uint256 totalCapacity;
        uint256 matchId = nextMatchId;

        for (uint256 i = 0; i < enclosureNames.length; i++) {
            string memory enclosureName = enclosureNames[i];
            uint256 enclosurePrice = enclosurePrices[i];
            uint256 enclosureCapacity = enclosureCapacities[i];

            if (
                bytes(enclosureName).length == 0 ||
                enclosurePrice == 0 ||
                enclosureCapacity == 0
            ) {
                revert InvalidEnclosureConfig();
            }

            bytes32 enclosureKey = keccak256(bytes(enclosureName));
            if (_matchEnclosures[matchId][enclosureKey].exists) {
                revert DuplicateEnclosure();
            }

            _matchEnclosures[matchId][enclosureKey] = Enclosure({
                price: enclosurePrice,
                capacity: enclosureCapacity,
                currentMinted: 0,
                exists: true
            });

            _matchEnclosureNames[matchId].push(enclosureName);
            totalCapacity += enclosureCapacity;
        }

        matches[nextMatchId] = Match({
            category: category,
            teams: teams,
            stadium: stadium,
            matchTime: matchTime,
            maxCapacity: totalCapacity,
            currentMinted: 0,
            isActive: true
        });
        emit MatchCreated(nextMatchId, category, teams, stadium, matchTime, totalCapacity);
        nextMatchId++;
    }

    function setMatchStatus(uint256 matchId, bool status) public onlyOwner {
        matches[matchId].isActive = status;
    }

    // --- USER PROTOCOLS ---

    /**
     * @dev Public Minting Function enforcing CNIC binding, Seat Unicity, and Transaction Limits.
     */
    function mintTicket(
        uint256 _matchId,
        string memory _enclosure,
        bytes32 _cnicHash,
        uint256 _personCount,
        string memory _uri
    ) public payable {
        Match storage evData = matches[_matchId];
        bytes32 enclosureKey = keccak256(bytes(_enclosure));
        Enclosure storage enclosureObj = _matchEnclosures[_matchId][enclosureKey];
        
        if (!evData.isActive) revert MatchNotActive();
        if (evData.currentMinted + _personCount > evData.maxCapacity) revert MatchSoldOut();
        if (!enclosureObj.exists) revert EnclosureNotFound();
        if (enclosureObj.currentMinted + _personCount > enclosureObj.capacity) revert EnclosureSoldOut();
        if (_personCount == 0 || _personCount > MAX_TICKETS_PER_WALLET) revert InvalidPersonCount();
        if (matchWalletMintCount[_matchId][msg.sender] != 0) revert WalletLimitReached();
        if (msg.value != enclosureObj.price * _personCount) revert IncorrectPayment();

        // Register constraints BEFORE mint
        matchWalletMintCount[_matchId][msg.sender] = uint8(_personCount);
        evData.currentMinted += _personCount;
        enclosureObj.currentMinted += _personCount;

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);

        tickets[tokenId] = Ticket({
            matchId: _matchId,
            enclosure: _enclosure,
            personCount: _personCount,
            paidPrice: enclosureObj.price * _personCount,
            cnicHash: _cnicHash,
            isUsed: false
        });

        emit TicketMinted(tokenId, _matchId, msg.sender, _cnicHash);
    }

    /**
     * @dev Scan ticket at the gateway physical barrier.
     */
    function markTicketAsUsed(uint256 tokenId) public onlyScanner {
        if (tickets[tokenId].isUsed) revert TicketAlreadyUsed();
        tickets[tokenId].isUsed = true;
        emit TicketScanned(tokenId, msg.sender);
    }

    // --- READ FUNCTIONS ---

    function getMatchCount() public view returns (uint256) {
        return nextMatchId;
    }

    function getMatchEnclosures(uint256 matchId) public view returns (
        string[] memory enclosureNames,
        uint256[] memory enclosurePrices,
        uint256[] memory enclosureCapacities,
        uint256[] memory enclosureMinted
    ) {
        string[] storage storedNames = _matchEnclosureNames[matchId];
        uint256 len = storedNames.length;

        enclosureNames = new string[](len);
        enclosurePrices = new uint256[](len);
        enclosureCapacities = new uint256[](len);
        enclosureMinted = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            string memory enclosureName = storedNames[i];
            Enclosure storage enclosureObj = _matchEnclosures[matchId][keccak256(bytes(enclosureName))];
            enclosureNames[i] = enclosureName;
            enclosurePrices[i] = enclosureObj.price;
            enclosureCapacities[i] = enclosureObj.capacity;
            enclosureMinted[i] = enclosureObj.currentMinted;
        }
    }

    function getEnclosureDetails(uint256 matchId, string memory enclosure) public view returns (
        uint256 price,
        uint256 capacity,
        uint256 currentMinted,
        bool exists
    ) {
        Enclosure storage enclosureObj = _matchEnclosures[matchId][keccak256(bytes(enclosure))];
        return (
            enclosureObj.price,
            enclosureObj.capacity,
            enclosureObj.currentMinted,
            enclosureObj.exists
        );
    }

    function getTicketData(uint256 tokenId) public view returns (
        address owner,
        Ticket memory ticketObj,
        Match memory matchObj
    ) {
        owner = ownerOf(tokenId);
        ticketObj = tickets[tokenId];
        matchObj = matches[ticketObj.matchId];
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // --- SOULBOUND V2 LOCK ---

    function transferFrom(address, address, uint256) public virtual override(ERC721, IERC721) {
        revert TicketIsSoulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override(ERC721, IERC721) {
        revert TicketIsSoulbound();
    }
}

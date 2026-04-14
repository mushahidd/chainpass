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
error SeatAlreadyTaken();
error IncorrectPayment();
error MatchSoldOut();

/**
 * @title ChainPass PSL
 * @dev STRICT MATCH HIERARCHY, CNIC IDENTITY BINDING, AND DOUBLE-BOOKING PREVENTION
 */
contract ChainPass is ERC721URIStorage, Ownable {
    uint256 public nextMatchId;
    uint256 private _nextTokenId;

    struct Match {
        string teams;
        string stadium;
        uint256 price;
        uint256 maxCapacity;
        uint256 currentMinted;
        bool isActive;
    }

    struct Ticket {
        uint256 matchId;
        string enclosure;
        uint256 seatNumber;
        bytes32 cnicHash;
        bool isUsed;
    }

    // --- State Mappings ---
    mapping(uint256 => Match) public matches;
    mapping(uint256 => Ticket) public tickets;

    // matchId -> wallet -> count (Max 2)
    mapping(uint256 => mapping(address => uint8)) public matchWalletMintCount;
    // matchId -> enclosure -> seatNumber -> isTaken (Double-booking prevention)
    mapping(uint256 => mapping(string => mapping(uint256 => bool))) public isSeatTaken;

    mapping(address => bool) public scanners;

    event MatchCreated(uint256 indexed matchId, string teams, string stadium, uint256 price);
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

    function createMatch(string memory teams, string memory stadium, uint256 price, uint256 maxCapacity) public onlyOwner {
        matches[nextMatchId] = Match({
            teams: teams,
            stadium: stadium,
            price: price,
            maxCapacity: maxCapacity,
            currentMinted: 0,
            isActive: true
        });
        emit MatchCreated(nextMatchId, teams, stadium, price);
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
        uint256 _seatNumber,
        bytes32 _cnicHash,
        string memory _uri
    ) public payable {
        Match storage evData = matches[_matchId];
        
        if (!evData.isActive) revert MatchNotActive();
        if (evData.currentMinted >= evData.maxCapacity) revert MatchSoldOut();
        if (msg.value != evData.price) revert IncorrectPayment();
        if (matchWalletMintCount[_matchId][msg.sender] >= 2) revert WalletLimitReached();
        if (isSeatTaken[_matchId][_enclosure][_seatNumber]) revert SeatAlreadyTaken();

        // Register constraints BEFORE mint
        isSeatTaken[_matchId][_enclosure][_seatNumber] = true;
        matchWalletMintCount[_matchId][msg.sender]++;
        evData.currentMinted++;

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _uri);

        tickets[tokenId] = Ticket({
            matchId: _matchId,
            enclosure: _enclosure,
            seatNumber: _seatNumber,
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChainPass PSL
 * @dev Blockchain-based ticketing system with anti-scalp price caps and royalty logic.
 */
contract ChainPass is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    // 3% royalty to PCB
    uint256 public constant ROYALTY_PERCENT = 3;
    // 110% Maximum Resale Price Cap (10% over original)
    uint256 public constant PRICE_CAP_PERCENT = 110;

    struct Ticket {
        uint256 originalPrice;
        uint256 currentPrice;
        bool isForSale;
        string matchDetails;
    }

    mapping(uint256 => Ticket) public tickets;
    address public pcbVault;

    // --- SCOREBOARD STATE VARIABLES ---
    mapping(address => uint256) public totalMatchesAttended;
    mapping(address => mapping(string => uint256)) public teamMatchesAttended;

    struct FanScore {
        address wallet;
        uint256 score;
    }

    FanScore[10] public topGlobalFans;
    mapping(string => FanScore[10]) public topTeamFans;
    mapping(uint256 => bool) public isTicketRedeemed;
    // ----------------------------------

    event TicketMinted(uint256 indexed tokenId, address indexed owner, uint256 price, string matchDetails);
    event TicketListed(uint256 indexed tokenId, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event TicketRedeemed(uint256 indexed tokenId, address indexed viewer);

    constructor(address _pcbVault) ERC721("ChainPass PSL", "CPPSL") Ownable(msg.sender) {
        pcbVault = _pcbVault;
    }

    /**
     * @dev Mint a new ticket. Only owner (PCB) can mint original tickets.
     */
    function mintTicket(address to, string memory uri, uint256 price, string memory matchDetails) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        tickets[tokenId] = Ticket({
            originalPrice: price,
            currentPrice: price,
            isForSale: false,
            matchDetails: matchDetails
        });

        emit TicketMinted(tokenId, to, price, matchDetails);
    }

    /**
     * @dev List a ticket for resale. Enforcement of the price cap happens here.
     */
    function listTicket(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Not the ticket owner");
        
        // ANTI-SCALP LOGIC: PRICE_CAP_PERCENT (110%) Enforcement
        uint256 maxAllowedPrice = (tickets[tokenId].originalPrice * PRICE_CAP_PERCENT) / 100;
        require(price <= maxAllowedPrice, "Price exceeds 110% cap (Anti-Scalp Rule)");

        tickets[tokenId].currentPrice = price;
        tickets[tokenId].isForSale = true;

        emit TicketListed(tokenId, price);
    }

    /**
     * @dev Buy a listed ticket. Includes royalty split.
     */
    function buyTicket(uint256 tokenId) public payable nonReentrant {
        Ticket storage ticket = tickets[tokenId];
        require(ticket.isForSale, "Ticket not for sale");
        require(msg.value >= ticket.currentPrice, "Insufficient funds");

        address seller = ownerOf(tokenId);
        uint256 salePrice = ticket.currentPrice;

        // Calculate 3% royalty
        uint256 royaltyAmount = (salePrice * ROYALTY_PERCENT) / 100;
        uint256 sellerAmount = salePrice - royaltyAmount;

        // Mark as not for sale during transfer
        ticket.isForSale = false;

        // Distribute funds
        (bool pcbSuccess, ) = payable(pcbVault).call{value: royaltyAmount}("");
        require(pcbSuccess, "PCB royalty transfer failed");

        (bool sellerSuccess, ) = payable(seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller transfer failed");

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);

        emit TicketSold(tokenId, seller, msg.sender, salePrice);
    }

    /**
     * @dev Update PCB Vault address.
     */
    function setPcbVault(address _newVault) public onlyOwner {
        pcbVault = _newVault;
    }

    // --- SCOREBOARD / REDEMPTION LOGIC ---
    
    /**
     * @dev Redeem a ticket at the stadium gates. Updates scoreboards.
     * Only the owner (Admin/Scanner) can call this for now.
     */
    function redeemTicket(uint256 tokenId, string memory team1, string memory team2) public onlyOwner nonReentrant {
        require(!isTicketRedeemed[tokenId], "Ticket already redeemed");
        
        address attendee = ownerOf(tokenId);
        
        isTicketRedeemed[tokenId] = true;
        totalMatchesAttended[attendee] += 1;
        teamMatchesAttended[attendee][team1] += 1;
        teamMatchesAttended[attendee][team2] += 1;

        _updateGlobalLeaderboard(attendee, totalMatchesAttended[attendee]);
        _updateTeamLeaderboard(attendee, team1, teamMatchesAttended[attendee][team1]);
        _updateTeamLeaderboard(attendee, team2, teamMatchesAttended[attendee][team2]);

        emit TicketRedeemed(tokenId, attendee);
    }

    function _updateGlobalLeaderboard(address _fan, uint256 _score) internal {
        // Remove old entry if exists to avoid duplicates
        _removeFanFromGlobal(_fan);
        // Insert sort
        for (uint256 i = 0; i < 10; i++) {
            if (_score > topGlobalFans[i].score) {
                for (uint256 j = 9; j > i; j--) {
                    topGlobalFans[j] = topGlobalFans[j - 1];
                }
                topGlobalFans[i] = FanScore(_fan, _score);
                break;
            }
        }
    }

    function _removeFanFromGlobal(address _fan) internal {
        bool found = false;
        for (uint256 i = 0; i < 10; i++) {
            if (found && i > 0) {
                topGlobalFans[i - 1] = topGlobalFans[i];
                if (i == 9) topGlobalFans[9] = FanScore(address(0), 0);
            } else if (topGlobalFans[i].wallet == _fan) {
                found = true;
                if (i == 9) topGlobalFans[9] = FanScore(address(0), 0);
            }
        }
        if (found && topGlobalFans[9].wallet == _fan) {
            topGlobalFans[9] = FanScore(address(0), 0);
        }
    }

    function _updateTeamLeaderboard(address _fan, string memory _team, uint256 _score) internal {
        _removeFanFromTeam(_fan, _team);
        for (uint256 i = 0; i < 10; i++) {
            if (_score > topTeamFans[_team][i].score) {
                for (uint256 j = 9; j > i; j--) {
                    topTeamFans[_team][j] = topTeamFans[_team][j - 1];
                }
                topTeamFans[_team][i] = FanScore(_fan, _score);
                break;
            }
        }
    }

    function _removeFanFromTeam(address _fan, string memory _team) internal {
        bool found = false;
        for (uint256 i = 0; i < 10; i++) {
            if (found && i > 0) {
                topTeamFans[_team][i - 1] = topTeamFans[_team][i];
                if (i == 9) topTeamFans[_team][9] = FanScore(address(0), 0);
            } else if (topTeamFans[_team][i].wallet == _fan) {
                found = true;
                if (i == 9) topTeamFans[_team][9] = FanScore(address(0), 0);
            }
        }
        if (found && topTeamFans[_team][9].wallet == _fan) {
            topTeamFans[_team][9] = FanScore(address(0), 0);
        }
    }

    function getTopGlobalFans() public view returns (FanScore[10] memory) {
        return topGlobalFans;
    }

    function getTopTeamFans(string memory team) public view returns (FanScore[10] memory) {
        return topTeamFans[team];
    }
    // ---------------------------------------------

    /**
     * @dev Simple view to get ticket info
     */
    function getTicket(uint256 tokenId) public view returns (Ticket memory) {
        return tickets[tokenId];
    }

    /**
     * @dev Get total number of tickets minted
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}

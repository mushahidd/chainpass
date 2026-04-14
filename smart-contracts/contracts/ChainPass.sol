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

    event TicketMinted(uint256 indexed tokenId, address indexed owner, uint256 price, string matchDetails);
    event TicketListed(uint256 indexed tokenId, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

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

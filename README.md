# ChainPass

ChainPass is a blockchain-powered ticketing platform built for PSL-style events.

It combines:
- A modern Next.js frontend for discovery, wallet connection, ticket browsing, and resale flows.
- A Hardhat + Solidity smart contract backend that enforces anti-scalping resale logic on-chain.

## Why ChainPass

Traditional ticketing suffers from:
- Fake tickets
- Price gouging by scalpers
- No transparent resale controls

ChainPass addresses this with NFT tickets and contract-level rules:
- Tickets are ERC-721 assets
- Resale cap is enforced on-chain
- Secondary sale royalty is routed automatically

## Tech Stack

### Frontend
- Next.js 14
- React 18
- Ethers.js 6
- Custom CSS theme (neon cyberpunk aesthetic)

### Smart Contracts
- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts

## Project Structure

```text
frontend/
  components/
  pages/
  styles/
  utils/
smart-contracts/
  contracts/
  scripts/
  test/
```

## Quick Start

## 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at:
- http://localhost:3000

## 2) Smart Contracts

```bash
cd smart-contracts
npm install
npx hardhat compile
```

To deploy to WireFluid testnet:

```bash
cd smart-contracts
npm run deploy:wirefluid
npm run initialize:wirefluid
```

WireFluid testnet settings:
- RPC: `https://evm.wirefluid.com`
- Chain ID: `92533`
- Explorer: `wirefluidscan.com`
- Token: Test WIRE

## Core Flows

- Connect wallet from navbar
- Browse marketplace listings
- Buy listed tickets
- View owned tickets in My Tickets
- List tickets for resale (subject to contract rules)

## Smart Contract Notes

Main contract:
- smart-contracts/contracts/ChainPass.sol

Highlights:
- Ticket minting
- Listing logic with anti-scalp cap
- Purchase logic with royalty split
- Total supply and metadata retrieval

## Scripts

Frontend:
- `npm run dev`
- `npm run build`
- `npm run start`

Smart contracts:
- `npm run compile`
- `npm run test`
- `npm run deploy:wirefluid`
- `npm run initialize:wirefluid`

## Current Status

- Working end-to-end on WireFluid testnet configuration
- Frontend and contract are integrated
- UI heavily customized to project theme

## Next Improvements

- Add contract unit tests in `smart-contracts/test`
- Add frontend component and integration tests
- Add environment-based contract address management
- Improve scalable on-chain data fetching for large collections

## License

MIT

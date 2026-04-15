import { useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import contractInfo from '../utils/contractData.json';

const numberFormatter = new Intl.NumberFormat('en-US');
const RPC_URL = process.env.NEXT_PUBLIC_WIREFLUID_RPC_URL || 'https://evm.wirefluid.com';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractInfo.address;
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || 'WIREFLUID_TESTNET';
const SEASON_LABEL = process.env.NEXT_PUBLIC_SEASON_LABEL || 'PSL 2026';

const STATIC_VALUES = {
  fakeTickets: process.env.NEXT_PUBLIC_FAKE_TICKETS || '0',
  resaleCap: process.env.NEXT_PUBLIC_RESALE_CAP || 'N/A',
  pcbRoyalty: process.env.NEXT_PUBLIC_PCB_ROYALTY || 'N/A',
  blockedTxn: process.env.NEXT_PUBLIC_BLOCKED_TXN || 'N/A',
  tools: process.env.NEXT_PUBLIC_STACK_TOOLS || 'METAMASK + ETHERS',
};

export default function Ticker() {
  const [live, setLive] = useState({
    contract: 'CHECKING',
    block: '...',
    minted: '...',
    gas: '...',
  });

  useEffect(() => {
    let cancelled = false;

    const fetchLiveMetrics = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        const [blockNumber, feeData, code] = await Promise.all([
          provider.getBlockNumber(),
          provider.getFeeData(),
          provider.getCode(CONTRACT_ADDRESS),
        ]);

        const contractActive = code && code !== '0x';
        let mintedValue = 'N/A';

        if (contractActive) {
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractInfo.abi, provider);
          const totalSupply = await contract.totalSupply();
          mintedValue = `${numberFormatter.format(Number(totalSupply))} NFTs`;
        }

        const gasPriceWei = feeData.gasPrice ?? feeData.maxFeePerGas;
        const gasInGwei = gasPriceWei
          ? `${Number(ethers.formatUnits(gasPriceWei, 'gwei')).toFixed(2)} GWEI`
          : 'N/A';

        if (!cancelled) {
          setLive({
            contract: contractActive ? 'ACTIVE' : 'UNAVAILABLE',
            block: `#${numberFormatter.format(blockNumber)}`,
            minted: mintedValue,
            gas: gasInGwei,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLive({
            contract: 'RPC_ERROR',
            block: 'N/A',
            minted: 'N/A',
            gas: 'N/A',
          });
        }
      }
    };

    fetchLiveMetrics();
    const intervalId = setInterval(fetchLiveMetrics, 30000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const items = useMemo(() => ([
    { label: 'CONTRACT', value: live.contract, gold: false },
    { label: 'BLOCK', value: live.block, gold: false },
    { label: 'MINTED', value: live.minted, gold: false },
    { label: 'FAKE_TICKETS', value: STATIC_VALUES.fakeTickets, gold: true },
    { label: 'NETWORK', value: NETWORK_NAME.toUpperCase(), gold: false },
    { label: 'RESALE_CAP', value: STATIC_VALUES.resaleCap, gold: true },
    { label: 'GAS', value: live.gas, gold: false },
    { label: 'SEASON', value: SEASON_LABEL, gold: false },
    { label: 'PCB_ROYALTY', value: STATIC_VALUES.pcbRoyalty, gold: false },
    { label: 'BLOCKED_TXN', value: STATIC_VALUES.blockedTxn, gold: true },
    { label: 'TOOLS', value: STATIC_VALUES.tools, gold: false },
  ]), [live]);

  const TickerItems = () => (
    <div style={styles.seg}>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} style={styles.item}>
          {item.label}:{' '}
          <b
            style={{
              color: item.gold ? 'var(--gold)' : 'var(--g)',
              fontWeight: 700,
              letterSpacing: '0.4px',
              textShadow: item.gold
                ? '0 0 10px rgba(232, 184, 75, 0.28)'
                : '0 0 12px rgba(0, 255, 106, 0.3)',
            }}
          >
            {item.value}
          </b>
        </span>
      ))}
    </div>
  );

  return (
    <div className="site-ticker" style={styles.ticker}>
      <div className="site-ticker-track" style={styles.track}>
        <TickerItems />
        <TickerItems />
      </div>
      <style>{`
        @keyframes tick {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  ticker: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '8px 0',
    overflow: 'hidden',
  },
  track: {
    display: 'flex',
    animation: 'tick 28s linear infinite',
    whiteSpace: 'nowrap',
  },
  seg: {
    display: 'flex',
    flexShrink: 0,
  },
  item: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '1.5px',
    color: 'var(--muted)',
    padding: '0 24px',
    borderRight: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  },
};

import '../styles/globals.css';
import { Web3Provider, useWeb3, WEB3_UI_STATES } from '../utils/Web3Context';
import WirefluidTerminalGate from '../components/WirefluidTerminalGate';
import TxStateOverlay from '../components/TxStateOverlay';

function AppShell({ Component, pageProps }) {
  const { currentState } = useWeb3();

  return (
    <div className="wf-shell">
      <Component {...pageProps} />
      {currentState === WEB3_UI_STATES.WRONG_NETWORK ? <WirefluidTerminalGate /> : null}
      <TxStateOverlay />
    </div>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <Web3Provider>
      <AppShell Component={Component} pageProps={pageProps} />
    </Web3Provider>
  );
}

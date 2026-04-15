import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractInfo from './contractData.json';

const Web3Context = createContext();
const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 92533);
const NETWORK_LABEL = process.env.NEXT_PUBLIC_NETWORK_NAME || 'WireFluid Testnet';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractInfo.address;

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isScanner, setIsScanner] = useState(false);
  const [web3Error, setWeb3Error] = useState('');
  const [loading, setLoading] = useState(false);
  const [manuallyDisconnected, setManuallyDisconnected] = useState(false);

  const clearSession = useCallback(() => {
    setAccount(null);
    setContract(null);
    setProvider(null);
    setChainId(null);
    setIsOwner(false);
    setIsScanner(false);
  }, []);

  const syncWalletState = useCallback(async (requestAccounts = false) => {
    if (!window.ethereum) {
      clearSession();
      setWeb3Error('MetaMask not detected. Please install MetaMask.');
      return;
    }

    setLoading(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accountMethod = requestAccounts ? 'eth_requestAccounts' : 'eth_accounts';
      const accounts = await browserProvider.send(accountMethod, []);

      if (!accounts.length) {
        clearSession();
        setWeb3Error('');
        return;
      }

      const activeAccount = accounts[0];
      const network = await browserProvider.getNetwork();
      const activeChainId = Number(network.chainId);

      setAccount(activeAccount);
      setProvider(browserProvider);
      setChainId(activeChainId);

      if (activeChainId !== EXPECTED_CHAIN_ID) {
        setContract(null);
        setWeb3Error(
          `Wrong network: expected chain ${EXPECTED_CHAIN_ID} (${NETWORK_LABEL}), but wallet is on chain ${activeChainId}.`
        );
        return;
      }

      const code = await browserProvider.getCode(CONTRACT_ADDRESS);
      if (code === '0x') {
        setContract(null);
        setWeb3Error(
          `Contract not found at ${CONTRACT_ADDRESS} on chain ${activeChainId}. Deploy and initialize on ${NETWORK_LABEL}.`
        );
        return;
      }

      const signer = await browserProvider.getSigner();
      const chainPassContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractInfo.abi,
        signer
      );

      const [onChainOwner, scannerEnabled] = await Promise.all([
        chainPassContract.owner(),
        chainPassContract.scanners(activeAccount),
      ]);

      setContract(chainPassContract);
      setIsOwner(onChainOwner.toLowerCase() === activeAccount.toLowerCase());
      setIsScanner(Boolean(scannerEnabled));
      setWeb3Error('');
      console.log('Connected to:', activeAccount, 'on chain:', activeChainId);
    } catch (error) {
      console.error('Connection failed:', error);
      setContract(null);
      setIsOwner(false);
      setIsScanner(false);
      setWeb3Error('Wallet connection failed. Check browser console for details.');
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const connectWallet = async () => {
    setManuallyDisconnected(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('chainpass_wallet_disconnected');
    }
    await syncWalletState(true);
  };

  const disconnectWallet = useCallback(() => {
    clearSession();
    setWeb3Error('');
    setManuallyDisconnected(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chainpass_wallet_disconnected', '1');
    }
  }, [clearSession]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const disconnectedFlag = window.localStorage.getItem('chainpass_wallet_disconnected') === '1';
    if (disconnectedFlag) {
      setManuallyDisconnected(true);
      clearSession();
      setWeb3Error('');
    }
  }, [clearSession]);

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    if (!manuallyDisconnected) {
      syncWalletState(false);
    }

    const handleAccountsChanged = (accounts) => {
      if (manuallyDisconnected) {
        clearSession();
        setWeb3Error('');
        return;
      }

      if (!accounts.length) {
        clearSession();
        setWeb3Error('');
        return;
      }
      syncWalletState(false);
    };

    const handleChainChanged = () => {
      if (manuallyDisconnected) {
        clearSession();
        setWeb3Error('');
        return;
      }
      syncWalletState(false);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [clearSession, syncWalletState, manuallyDisconnected]);

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        provider,
        chainId,
        expectedChainId: EXPECTED_CHAIN_ID,
        isOwner,
        isScanner,
        canAccessAdminTools: isOwner || isScanner,
        web3Error,
        connectWallet,
        disconnectWallet,
        loading
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);

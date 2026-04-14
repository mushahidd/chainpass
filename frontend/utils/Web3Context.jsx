import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractInfo from './contractData.json';

const Web3Context = createContext();
const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [web3Error, setWeb3Error] = useState('');
  const [loading, setLoading] = useState(false);

  const clearSession = useCallback(() => {
    setAccount(null);
    setContract(null);
    setProvider(null);
    setChainId(null);
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
          `Wrong network: expected chain ${EXPECTED_CHAIN_ID} (Hardhat Local), but wallet is on chain ${activeChainId}.`
        );
        return;
      }

      const code = await browserProvider.getCode(contractInfo.address);
      if (code === '0x') {
        setContract(null);
        setWeb3Error(
          `Contract not found at ${contractInfo.address} on chain ${activeChainId}. Run initialization on localhost.`
        );
        return;
      }

      const signer = await browserProvider.getSigner();
      const chainPassContract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        signer
      );

      setContract(chainPassContract);
      setWeb3Error('');
      console.log('Connected to:', activeAccount, 'on chain:', activeChainId);
    } catch (error) {
      console.error('Connection failed:', error);
      setContract(null);
      setWeb3Error('Wallet connection failed. Check browser console for details.');
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const connectWallet = async () => {
    await syncWalletState(true);
  };

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    syncWalletState(false);

    const handleAccountsChanged = (accounts) => {
      if (!accounts.length) {
        clearSession();
        setWeb3Error('');
        return;
      }
      syncWalletState(false);
    };

    const handleChainChanged = () => {
      syncWalletState(false);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [clearSession, syncWalletState]);

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        provider,
        chainId,
        expectedChainId: EXPECTED_CHAIN_ID,
        web3Error,
        connectWallet,
        loading
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);

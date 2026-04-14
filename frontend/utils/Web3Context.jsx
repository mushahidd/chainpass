import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractInfo from './contract.json';

const Web3Context = createContext();
const WIREFLUID_CHAIN_ID = 92533;

function isValidConfiguredAddress(address) {
  const configuredAddress = String(address || '').trim();
  if (!configuredAddress) return false;
  if (configuredAddress.includes('REPLACE_WITH_')) return false;
  return ethers.isAddress(configuredAddress);
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [uiError, setUiError] = useState('');

  const hasValidContractConfig = isValidConfiguredAddress(contractInfo.address);
  const isCorrectNetwork = chainId === WIREFLUID_CHAIN_ID;

  const connectWallet = async () => {
    if (!window.ethereum) {
      setUiError('Please install MetaMask!');
      return;
    }

    if (!hasValidContractConfig) {
      setUiError('Contract not deployed. Run deploy script first.');
      return;
    }
    
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const walletAddress = accounts[0];
      const activeChainId = Number(network.chainId);
      setChainId(activeChainId);

      const configuredAddress = String(contractInfo.address || '').trim();

      if (activeChainId !== WIREFLUID_CHAIN_ID) {
        setAccount(walletAddress);
        setSigner(signer);
        setContract(null);
        setUiError('Switch to WireFluid network (92533)');
        return;
      }
      
      const chainPassContract = new ethers.Contract(
        configuredAddress,
        contractInfo.abi,
        signer
      );

      console.log("[WEB3_DEBUG] provider:", provider);
      console.log("[WEB3_DEBUG] signer:", signer);
      console.log("[WEB3_DEBUG] contract instance:", chainPassContract);
      console.log("[WEB3_DEBUG] wallet address:", walletAddress);
      console.log("[WEB3_DEBUG] network chainId:", activeChainId);
      console.log("[WEB3_DEBUG] contract address:", configuredAddress);

      setAccount(walletAddress);
      setSigner(signer);
      setContract(chainPassContract);
      setUiError('');
    } catch (error) {
      console.error("Connection failed:", error);
      setSigner(null);
      setContract(null);
      setUiError(error?.message || "Wallet connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasValidContractConfig) {
      setUiError('Contract not deployed. Run deploy script first.');
      return;
    }

    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null);
        setSigner(null);
        setContract(null);
      }
    };

    const handleChainChanged = (hexChainId) => {
      const nextChainId = parseInt(hexChainId, 16);
      setChainId(nextChainId);
      setSigner(null);
      setContract(null);
      if (nextChainId !== WIREFLUID_CHAIN_ID) {
        setUiError('Switch to WireFluid network (92533)');
      } else {
        setUiError('');
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  if (!hasValidContractConfig) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#04080a',
        color: '#ff7a7a',
        fontFamily: 'monospace',
        letterSpacing: '0.8px',
        padding: '20px',
      }}>
        Contract not deployed. Run deploy script first.
      </div>
    );
  }

  return (
    <Web3Context.Provider value={{
      account,
      signer,
      contract,
      connectWallet,
      loading,
      chainId,
      isCorrectNetwork,
      uiError,
      expectedChainId: WIREFLUID_CHAIN_ID,
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);

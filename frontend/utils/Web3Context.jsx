import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import contractInfo from './contract.json';

const Web3Context = createContext();

const WIREFLUID_CHAIN_ID = 92533;
const WIREFLUID_CHAIN_ID_HEX = '0x16975';
const WIREFLUID_EXPLORER_TX = 'https://explorer.wirefluid.com/tx/';

export const WEB3_UI_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  WRONG_NETWORK: 'WRONG_NETWORK',
  CORRECT_NETWORK: 'CORRECT_NETWORK',
  TX_PENDING: 'TX_PENDING',
  TX_SUCCESS: 'TX_SUCCESS',
  TX_FAILED: 'TX_FAILED',
};

function isValidConfiguredAddress(address) {
  const configuredAddress = String(address || '').trim();
  if (!configuredAddress) return false;
  if (configuredAddress.includes('REPLACE_WITH_')) return false;
  return ethers.isAddress(configuredAddress);
}

function extractRevertReason(err) {
  return (
    err?.reason ||
    err?.shortMessage ||
    err?.info?.error?.message ||
    err?.error?.message ||
    err?.message ||
    'Unknown transaction error'
  );
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const [walletAddress, setWalletAddress] = useState('');
  const [chainId, setChainId] = useState(null);
  const [contractReady, setContractReady] = useState(false);
  const [currentState, setCurrentState] = useState(WEB3_UI_STATES.DISCONNECTED);
  const [errorMessage, setErrorMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStep, setTxStep] = useState('idle');

  const hasValidContractConfig = isValidConfiguredAddress(contractInfo.address);
  const isCorrectNetwork = chainId === WIREFLUID_CHAIN_ID;

  const resetTxOverlay = () => {
    setTxHash('');
    setTxStep('idle');
    setErrorMessage('');
    if (!walletAddress) {
      setCurrentState(WEB3_UI_STATES.DISCONNECTED);
      return;
    }
    setCurrentState(isCorrectNetwork ? WEB3_UI_STATES.CORRECT_NETWORK : WEB3_UI_STATES.WRONG_NETWORK);
  };

  const buildContractFromSigner = (nextSigner) => {
    const configuredAddress = String(contractInfo.address || '').trim();
    return new ethers.Contract(configuredAddress, contractInfo.abi, nextSigner);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setCurrentState(WEB3_UI_STATES.DISCONNECTED);
      setErrorMessage('MetaMask is required to use ChainPass.');
      return;
    }

    if (!hasValidContractConfig) {
      setCurrentState(WEB3_UI_STATES.DISCONNECTED);
      setErrorMessage('Contract config missing. Deploy and sync contract.json first.');
      return;
    }

    setCurrentState(WEB3_UI_STATES.CONNECTING);
    setErrorMessage('');

    try {
      const nextProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await nextProvider.send('eth_requestAccounts', []);
      const nextWallet = accounts?.[0] || '';
      const network = await nextProvider.getNetwork();
      const nextChainId = Number(network.chainId);

      setProvider(nextProvider);
      setWalletAddress(nextWallet);
      setChainId(nextChainId);

      if (!nextWallet) {
        setSigner(null);
        setContract(null);
        setContractReady(false);
        setCurrentState(WEB3_UI_STATES.DISCONNECTED);
        setErrorMessage('No wallet account returned by MetaMask.');
        return;
      }

      if (nextChainId !== WIREFLUID_CHAIN_ID) {
        setSigner(null);
        setContract(null);
        setContractReady(false);
        setCurrentState(WEB3_UI_STATES.WRONG_NETWORK);
        setErrorMessage('Wrong network detected. WireFluid (92533) is required.');
        return;
      }

      const nextSigner = await nextProvider.getSigner();
      const nextContract = buildContractFromSigner(nextSigner);

      setSigner(nextSigner);
      setContract(nextContract);
      setContractReady(true);
      setCurrentState(WEB3_UI_STATES.CORRECT_NETWORK);
      setErrorMessage('');
    } catch (error) {
      setSigner(null);
      setContract(null);
      setContractReady(false);
      setCurrentState(WEB3_UI_STATES.DISCONNECTED);
      setErrorMessage(extractRevertReason(error));
    }
  };

  const switchToWirefluid = async () => {
    if (!window.ethereum) {
      setErrorMessage('MetaMask not detected.');
      setCurrentState(WEB3_UI_STATES.DISCONNECTED);
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: WIREFLUID_CHAIN_ID_HEX }],
      });
      setErrorMessage('');
    } catch (error) {
      setCurrentState(WEB3_UI_STATES.WRONG_NETWORK);
      setErrorMessage(error?.message || 'Network switch request rejected.');
    }
  };

  const runTransaction = async (txExecutor) => {
    if (!contract || !signer || !walletAddress) {
      setCurrentState(WEB3_UI_STATES.DISCONNECTED);
      setErrorMessage('Wallet not ready for transaction.');
      return null;
    }

    if (!isCorrectNetwork) {
      setCurrentState(WEB3_UI_STATES.WRONG_NETWORK);
      setErrorMessage('Wrong network detected. WireFluid (92533) is required.');
      return null;
    }

    try {
      setCurrentState(WEB3_UI_STATES.TX_PENDING);
      setTxStep('broadcasting');
      setErrorMessage('');
      setTxHash('');

      const tx = await txExecutor();
      if (!tx?.hash) {
        throw new Error('Transaction failed before hash generation.');
      }

      setTxHash(tx.hash);
      setTxStep('waiting_for_confirmation');

      await tx.wait();

      setTxStep('mining_block');
      setCurrentState(WEB3_UI_STATES.TX_SUCCESS);
      return tx.hash;
    } catch (error) {
      setCurrentState(WEB3_UI_STATES.TX_FAILED);
      setTxStep('failed');
      setErrorMessage(extractRevertReason(error));
      return null;
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      const nextWallet = accounts?.[0] || '';
      setWalletAddress(nextWallet);
      if (!nextWallet) {
        setSigner(null);
        setContract(null);
        setContractReady(false);
        setChainId(null);
        setCurrentState(WEB3_UI_STATES.DISCONNECTED);
        return;
      }

      if (!provider) return;

      if (chainId === WIREFLUID_CHAIN_ID) {
        const nextSigner = await provider.getSigner();
        const nextContract = buildContractFromSigner(nextSigner);
        setSigner(nextSigner);
        setContract(nextContract);
        setContractReady(true);
        setCurrentState(WEB3_UI_STATES.CORRECT_NETWORK);
        setErrorMessage('');
      } else {
        setSigner(null);
        setContract(null);
        setContractReady(false);
        setCurrentState(WEB3_UI_STATES.WRONG_NETWORK);
      }
    };

    const handleChainChanged = async (hexChainId) => {
      const nextChainId = parseInt(hexChainId, 16);
      setChainId(nextChainId);

      if (nextChainId !== WIREFLUID_CHAIN_ID) {
        setSigner(null);
        setContract(null);
        setContractReady(false);
        if (walletAddress) {
          setCurrentState(WEB3_UI_STATES.WRONG_NETWORK);
          setErrorMessage('Wrong network detected. WireFluid (92533) is required.');
        }
        return;
      }

      if (!provider || !walletAddress) {
        setCurrentState(walletAddress ? WEB3_UI_STATES.CONNECTING : WEB3_UI_STATES.DISCONNECTED);
        return;
      }

      const nextSigner = await provider.getSigner();
      const nextContract = buildContractFromSigner(nextSigner);
      setSigner(nextSigner);
      setContract(nextContract);
      setContractReady(true);
      setCurrentState(WEB3_UI_STATES.CORRECT_NETWORK);
      setErrorMessage('');
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, chainId, walletAddress]);

  const value = useMemo(() => ({
    walletAddress,
    chainId,
    contractReady,
    currentState,
    errorMessage,
    txHash,
    txStep,
    expectedChainId: WIREFLUID_CHAIN_ID,
    explorerTxBase: WIREFLUID_EXPLORER_TX,
    connectWallet,
    switchToWirefluid,
    runTransaction,
    resetTxOverlay,
    contract,
    signer,
    account: walletAddress,
    loading: currentState === WEB3_UI_STATES.CONNECTING,
    isCorrectNetwork,
    uiError: errorMessage,
  }), [walletAddress, chainId, contractReady, currentState, errorMessage, txHash, txStep, contract, signer, isCorrectNetwork]);

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export const useWeb3 = () => useContext(Web3Context);

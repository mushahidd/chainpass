import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractInfo from './contract.json';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const walletAddress = accounts[0];
      const chainId = Number(network.chainId);
      const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || contractInfo.chainId || 0);

      if (!ethers.isAddress(contractInfo.address)) {
        throw new Error(`Invalid contract address in config: ${contractInfo.address}`);
      }

      if (expectedChainId && chainId !== expectedChainId) {
        throw new Error(`Wrong network. Connected chainId=${chainId}, expected=${expectedChainId}`);
      }
      
      const chainPassContract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        signer
      );

      console.log("[WEB3_DEBUG] provider:", provider);
      console.log("[WEB3_DEBUG] signer:", signer);
      console.log("[WEB3_DEBUG] contract instance:", chainPassContract);
      console.log("[WEB3_DEBUG] wallet address:", walletAddress);
      console.log("[WEB3_DEBUG] network chainId:", chainId);
      console.log("[WEB3_DEBUG] contract address:", contractInfo.address);

      setAccount(walletAddress);
      setContract(chainPassContract);
    } catch (error) {
      console.error("Connection failed:", error);
      alert(error?.message || "Wallet connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
        else {
          setAccount(null);
          setContract(null);
        }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{ account, contract, connectWallet, loading }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);

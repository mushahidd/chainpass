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
      
      const chainPassContract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        signer
      );

      setAccount(accounts[0]);
      setContract(chainPassContract);
      console.log("Connected to:", accounts[0]);
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
        else setAccount(null);
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

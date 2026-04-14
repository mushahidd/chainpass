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
      // Prompt user to add/switch to WireFluid Network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x16975' }], // 92533 in Hex
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x16975',
                  chainName: 'WireFluid Testnet',
                  rpcUrls: ['https://evm.wirefluid.com'],
                  nativeCurrency: {
                    name: 'WireFluid',
                    symbol: 'WIRE',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://wirefluidscan.com'],
                },
              ],
            });
          } catch (addError) {
            throw new Error("Failed to add WireFluid testnet to your wallet.");
          }
        } else {
          throw new Error("Failed to switch to WireFluid Testnet. Please do it manually.");
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const walletAddress = accounts[0];
      const chainId = Number(network.chainId);

      // Verify we actually are on WireFluid (92533)
      if (chainId !== 92533) {
        throw new Error(`Wrong network. Connected chainId=${chainId}, expected=92533 (WireFluid)`);
      }

      if (!ethers.isAddress(contractInfo.address)) {
        throw new Error(`Invalid contract address in config: ${contractInfo.address}`);
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

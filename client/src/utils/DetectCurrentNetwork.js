import Web3 from "web3";
import networks from "./chains.json";

const initializeWeb3 = async () => {
  if (typeof window.ethereum === "undefined") {
    console.error("MetaMask is not installed or not connected.");
    return null;
  }
  let web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  return web3;
};

// Function to detect the current network
export async function detectCurrentNetwork() {
  const web3 = await initializeWeb3();
  if (!web3) return;
  try {
    // Get the current chain ID
    const chainId = await web3.eth.getChainId();

    // Find the network that matches the current chain ID
    for (const [networkName, details] of Object.entries(networks)) {
      if (details.chainHexId && parseInt(details.chainHexId, 16) === parseInt(Number(chainId))) {
        return networkName;
      }
    }

    // Return a message if no match is found
    return `Unknown Network (ID: ${chainId})`;
  } catch (error) {
    console.error("Error detecting network:", error);
    return "Error";
  }
}

export const switchNetwork = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia chainId
      });
    } catch (error) {
      console.error("Error switching network:", error);
      // This error code indicates that the chain has not been added to MetaMask.
      if (error.code === 4902) {
        console.log("Sepolia network not found in wallet, please add it manually or use a provider that supports it.");
      }
    }
  }
};

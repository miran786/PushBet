import React, { useContext, useEffect, useState } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import { AuthContext } from "../../utils/AuthProvider";
import { getTokenBalance } from "../../utils/SmartContract";
import { detectCurrentNetwork } from "../../utils/DetectCurrentNetwork";
import ChainInfo from "../../utils/chains.json";

const Greeting = () => {
  const { user, walletAddress } = useContext(AuthContext); // Use walletAddress from context
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("USDC");

  useEffect(() => {
    const fetchBalance = async () => {
      const address = walletAddress || user?.walletAddress;
      if (address) {
        try {
          const network = await detectCurrentNetwork();
          if (ChainInfo[network] && ChainInfo[network].usdcTokenCA) {
            const bal = await getTokenBalance(ChainInfo[network].usdcTokenCA, address);
            setBalance(bal);
          }
        } catch (error) {
          console.error("Error loading balance:", error);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [user, walletAddress]);

  const currentAddress = walletAddress || user?.walletAddress;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white" }}>
          Hello {user?.username || (currentAddress ? "Guest" : "User")}
        </h1>
        <p style={{ fontSize: "1rem", color: "white", marginTop: "4px" }}>
          Welcome back!
        </p>

        {/* Wallet Connected Box */}
        {currentAddress && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px 15px",
              backgroundColor: "rgba(76, 175, 80, 0.2)",
              border: "1px solid #4caf50",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#4caf50",
                  boxShadow: "0 0 8px #4caf50",
                }}
              ></div>
              <span style={{ color: "#fff", fontSize: "0.9rem", fontFamily: "monospace" }}>
                {currentAddress.substring(0, 6)}...
                {currentAddress.substring(currentAddress.length - 4)}
              </span>
              <span style={{ color: "#4caf50", fontSize: "0.8rem", fontWeight: "bold" }}>
                CONNECTED
              </span>
            </div>

            {/* Balance Separator */}
            <div style={{ width: '1px', height: '20px', backgroundColor: '#4caf50', opacity: 0.5 }}></div>

            {/* Balance Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: "#fff", fontSize: "0.9rem", fontWeight: "bold" }}>
                {balance}
              </span>
              <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                {currency}
              </span>
            </div>
          </div>
        )}
      </div>
      <SlOptionsVertical color="white" size={20} />
    </div>
  );
};

export default Greeting;

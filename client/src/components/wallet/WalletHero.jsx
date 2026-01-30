import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../utils/AuthProvider";
import { getTokenBalance } from "../../utils/SmartContract";
import ChainInfo from "../../utils/chains.json";
import { detectCurrentNetwork } from "../../utils/DetectCurrentNetwork";

const Digit = ({ targetDigit }) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const position = targetDigit * 10; // Calculate position for the target digit
    setScrollPosition(position);
  }, [targetDigit]);

  return (
    <div style={styles.digitContainer}>
      <div
        style={{
          ...styles.digit,
          transform: `translateY(-${scrollPosition}%)`,
          transition: "transform 0.5s ease-out",
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div key={i} style={styles.digitItem}>
            {i}
          </div>
        ))}
      </div>
    </div>
  );
};

const WalletHero = () => {
  const { user, walletAddress } = useContext(AuthContext); // Get walletAddress from AuthContext
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) return;

      try {
        const currentNetwork = await detectCurrentNetwork();
        const chainData = ChainInfo[currentNetwork];

        if (chainData && chainData.usdcTokenCA) {
          const fetchedBalance = await getTokenBalance(chainData.usdcTokenCA, walletAddress);
          setBalance(parseFloat(fetchedBalance));
        } else {
          // Fallback if no chain data or usdc token CA found
          setBalance(user?.funds || 0);
        }
      } catch (error) {
        console.error("Failed to fetch on-chain balance:", error);
        setBalance(user?.funds || 0);
      }
    };

    fetchBalance();
  }, [walletAddress, user]);

  const targetValue = balance;

  // Format targetValue as integer string for digit animation
  // (Assuming funds are integers for now, or floor them)
  const targetDigits = Math.floor(targetValue).toString().split("").map(Number);

  // Insert commas into the target value for readability logic
  // We need to map digits to formatted representation
  // This tricky part is mapping individual digits to the scrolling component
  // For simplicity, let's keep the digit animation logic but ensure it handles the number correct.
  // The original code `targetValue.toLocaleString().split("").map(Number)` produces NaNs for commas

  const formattedValue = Math.floor(targetValue).toLocaleString().split("").map((char) => {
    const num = Number(char);
    return isNaN(num) ? char : num;
  });

  return (
    <div style={styles.walletHeroContainer}>
      <div style={styles.titleContainer}>
        <h2 style={styles.title}>Your Wallet Balance</h2>
      </div>

      <div style={styles.balanceContainer}>
        <span style={styles.dollarSign}>$</span>
        {formattedValue.map((digit, index) =>
          typeof digit === 'string' ? (
            <span key={index} style={styles.comma}>
              {digit}
            </span>
          ) : (
            <Digit key={index} targetDigit={digit} />
          )
        )}
      </div>

    </div>
  );
};

export default WalletHero;

const styles = {
  walletHeroContainer: {
    paddingTop: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "60px",
  },
  titleContainer: {
    marginBottom: "5px",
    textAlign: "center",
  },
  title: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.5)",
  },
  balanceContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  dollarSign: {
    fontSize: "50px",
    fontWeight: "800",
    color: "white",
    marginRight: "5px",
  },
  digitContainer: {
    height: "70px",
    overflow: "hidden",
    width: "35px",
  },
  digit: {
    display: "flex",
    flexDirection: "column",
  },
  digitItem: {
    height: "60px",
    lineHeight: "60px",
    textAlign: "center",
    fontSize: "50px",
    fontWeight: "800",
    color: "white",
  },
  comma: {
    fontSize: "50px",
    fontWeight: "800",
    color: "white",
    lineHeight: "60px",
  },
};

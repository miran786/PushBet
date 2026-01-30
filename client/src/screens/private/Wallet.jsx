import React from "react";
import Header from "../../components/Header";
import WalletHero from "../../components/wallet/WalletHero";

import BottomSheet from "../../components/wallet/BottomSheet";
import TransactionHistory from "../../components/wallet/TransactionHistory";
import { AuthContext } from "../../utils/AuthProvider";
import { useContext } from "react";

const Wallet = () => {
  const { user } = useContext(AuthContext);
  return (
    <div>
      <div className="background">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          gap: 20,
          overflow: "scroll",
        }}
      >
        <Header />
        <WalletHero />

        <TransactionHistory transactions={user?.pastGames || []} currentUserId={user?.walletAddress} />
        <BottomSheet />
      </div>
    </div>
  );
};

export default Wallet;

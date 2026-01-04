import React, { useContext } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import { AuthContext } from "../../utils/AuthProvider";

const Greeting = () => {
  const { user } = useContext(AuthContext);

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
          Hello {user?.username || "User"}
        </h1>
        <p style={{ fontSize: "1rem", color: "white", marginTop: "4px" }}>
          Welcome back!
        </p>

        {/* Wallet Connected Box */}
        {user?.walletAddress && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px 15px",
              backgroundColor: "rgba(76, 175, 80, 0.2)",
              border: "1px solid #4caf50",
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
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
              {user.walletAddress.substring(0, 6)}...
              {user.walletAddress.substring(user.walletAddress.length - 4)}
            </span>
            <span style={{ color: "#4caf50", fontSize: "0.8rem", fontWeight: "bold", marginLeft: "5px" }}>
              CONNECTED
            </span>
          </div>
        )}
      </div>
      <SlOptionsVertical color="white" size={20} />
    </div>
  );
};

export default Greeting;

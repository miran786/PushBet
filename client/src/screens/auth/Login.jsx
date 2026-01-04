import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../utils/AuthProvider";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "../../client";
import logo from "../../assets/logo.png";

function Login() {
  const { setUser, walletAddress, setWalletAddress } = useContext(AuthContext);
  const activeAccount = useActiveAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeAccount) {
      setWalletAddress(activeAccount?.address);
      console.log("Connected wallet address:", activeAccount?.address); // Log the wallet address
    }
  }, [activeAccount, setWalletAddress]);

  const handleLogin = async () => {
    /*
    if (!walletAddress) {
      setError("Please connect your wallet to continue.");
      return;
    }
    */

    try {
      setLoading(true); // Show the loading spinner
      await signInWithEmailAndPassword(auth, email, password);
      // AuthProvider handles setting the user via onAuthStateChanged

      // Set a 2-second delay before navigating to the next page
      setTimeout(() => {
        setLoading(false); // Hide the loader after 2 seconds
        navigate("/home");
      }, 2000);

    } catch (err) {
      setError(err.message || "An error occurred during login");
      console.error("Login error:", err);
      setLoading(false); // Hide the loader in case of error
    }
  };

  return (
    <div className="login-container">
      {loading && (
        <div className="loader-container">
          <div className="loader"></div> {/* You can style this loader */}
        </div>
      )}
      <div className="background">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div className="top">
        <img src={logo} alt="PushBet logo" />
        <p>PUSHBET</p>
      </div>
      <div className="middle">
        <h2>Welcome</h2>
        <h2>Back</h2>
      </div>
      <div className="bottom">
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            alignItems: "center",
            width: "100%",
          }}
        >
          <ConnectButton client={client} /> {/* Connect wallet button */}
          <button className="button" onClick={handleLogin} disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        <a href="/reset-password">Forgot Password</a>
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;

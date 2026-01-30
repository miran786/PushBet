import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../utils/AuthProvider";
import "./Auth.css";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import axios from "axios";
import { client } from "../../client";
import logo from "../../assets/logo.png";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

function Register() {
  const { setUser, walletAddress, setWalletAddress } = useContext(AuthContext);
  const activeAccount = useActiveAccount();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeAccount) {
      setWalletAddress(activeAccount.address);
      console.log("Connected wallet address:", activeAccount.address);
    }
  }, [activeAccount, setWalletAddress]);

  const handleRegister = async () => {
    if (!walletAddress) {
      setError("Please connect your wallet to continue.");
      return;
    }
    setError("");
    setIsLoading(true);

    const registerBackend = async () => {
      // Use config from environment or default to localhost
      // Use proxy endpoint (relative path)
      const backendUrl = "/api";

      const response = await axios.post(
        `${backendUrl}/user/register`,
        {
          username,
          email,
          password,
          walletAddress,
        }
      );
      return response;
    };

    try {
      // 1. Create user in Firebase
      await createUserWithEmailAndPassword(auth, email, password);

      // 2. Create user in MongoDB
      const response = await registerBackend();

      if (response.status === 201) {
        navigate("/home");
      }
    } catch (err) {
      console.error("Registration error:", err);

      // Handle "Email already in use" (Firebase error)
      if (err.code === "auth/email-already-in-use") {
        console.log("User exists in Firebase, attempting backend registration...");
        try {
          // Try to create in backend in case it was missed
          const response = await registerBackend();
          if (response.status === 201) {
            navigate("/home");
            return;
          }
        } catch (backendErr) {
          console.error("Backend registration error:", backendErr);
          setError("Account already exists. Please Login.");
          return;
        }
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        // Generic friendly error
        setError(
          err.response?.data?.error || "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
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
        <h2>Create</h2>
        <h2>Account</h2>
      </div>
      <div className="bottom">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <div className="button-container">
          <ConnectButton client={client} />
          <button
            className="button"
            onClick={handleRegister}
            disabled={isLoading || !walletAddress}
            style={{ opacity: (isLoading || !walletAddress) ? 0.7 : 1, cursor: (isLoading || !walletAddress) ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? "Creating..." : "Register"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <p>
          Already have an account? <a href="/login" style={{ pointerEvents: isLoading ? 'none' : 'auto' }}>Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;

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

    const registerBackend = async () => {
      const response = await axios.post(
        "https://localhost:8000/user/register",
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
          // If backend also fails (likely duplicate), then user is fully registered.
          // Or if backend fails with other error.
          // We can suggest login.
          setError("Account already exists. Please Login.");
          return;
        }
      }

      setError(
        err.message || err.response?.data?.error || "An error occurred during registration"
      );
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
          onChange={(e) => setUsername(e.target.value)}
        />
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
        <div className="button-container">
          <ConnectButton client={client} />
          <button className="button" onClick={handleRegister}>
            Register
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;

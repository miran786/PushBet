import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";

// Create context
export const AuthContext = createContext();

import { ConnectButton, useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeAccount = useActiveAccount();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();

  useEffect(() => {
    if (activeAccount) {
      console.log("AuthProvider: Thirdweb wallet connected:", activeAccount.address);
      setWalletAddress(activeAccount.address);
    } else {
      console.log("AuthProvider: Thirdweb wallet disconnected");
      setWalletAddress(null);
    }
  }, [activeAccount]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AuthProvider: onAuthStateChanged triggered", currentUser);
      if (currentUser) {
        // Fetch user details from MongoDB using the email
        try {
          const response = await axios.post(`/api/user/get-by-email`, {
            email: currentUser.email
          });
          console.log("AuthProvider: Fetched MongoDB user", response.data);
          setUser({ ...currentUser, ...response.data }); // Merge firebase and mongodb user data
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(currentUser); // Fallback to just firebase user
        }
      } else {
        console.log("AuthProvider: No user logged in");
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      if (wallet) {
        disconnect(wallet);
      }
      setUser(null);
      setWalletAddress(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        walletAddress
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

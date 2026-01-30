import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";

// Create context
export const AuthContext = createContext();

import { ConnectButton, useActiveAccount } from "thirdweb/react";

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  const activeAccount = useActiveAccount();

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
          // You need to import axios if not already imported, but let's assume it is or use fetch
          // Better to use axios as per project standard
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

  if (loading) {
    return <div>Loading...</div>;
  }

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setWalletAddress(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, walletAddress, setWalletAddress, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

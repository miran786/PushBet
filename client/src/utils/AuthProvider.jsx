import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";

// Create context
export const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user details from MongoDB using the email
        try {
          // You need to import axios if not already imported, but let's assume it is or use fetch
          // Better to use axios as per project standard
          const response = await axios.post(`${import.meta.env.VITE_SERVER_URL || "https://localhost:8000"}/user/get-by-email`, {
            email: currentUser.email
          });
          setUser({ ...currentUser, ...response.data }); // Merge firebase and mongodb user data
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(currentUser); // Fallback to just firebase user
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ user, setUser, walletAddress, setWalletAddress }}
    >
      {children}
    </AuthContext.Provider>
  );
};

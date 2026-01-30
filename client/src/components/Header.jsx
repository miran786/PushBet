import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { FaUserFriends, FaSignOutAlt } from "react-icons/fa";
import "./Header.css";
import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { AuthContext } from "../utils/AuthProvider";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  console.log("Header Rendered. User:", user);

  return (
    <div className="header-container">
      {/* Friends Icon */}
      <Link to="/friends" className="icon-link">
        <FaUserFriends size={24} />
      </Link>

      {/* Logout Button */}
      <button onClick={logout} className="icon-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }} title="Logout">
        <FaSignOutAlt size={24} />
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>LOGOUT</span>
      </button>

      {/* Connect Wallet Button */}
      <ConnectButton client={client} />
    </div>
  );
};

export default Header;

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import BottomTab from "../components/BottomTabs";
import Home from "./private/Home";
import Wallet from "./private/Wallet";
import Games from "./private/Games";
import Rankings from "./private/Rankings";
import PoseTracking from "./private/PoseTracking";

function MainNavigation() {
  return (
    <div className="main-navigation">
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/games" element={<Games />} />
        <Route path="/ranking" element={<Rankings />} />
        <Route path="/pose" element={<PoseTracking />} />
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      <BottomTab />
    </div>
  );
}

export default MainNavigation;

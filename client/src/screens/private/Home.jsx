import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Greeting from "../../components/home/Greeting";
import Streak from "../../components/home/Streaks";
import Game from "../../components/home/Game";
import Widgets from "../../components/home/Widgets";

const Home = () => {
  const navigate = useNavigate();
  return (
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
      <div className="background">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <Header />
      <Greeting />
      <Streak />
      <Game />
      <div onClick={() => navigate("/pose")} style={{
        padding: "10px 20px",
        backgroundColor: "#007AFF",
        borderRadius: "10px",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        width: "100%",
        textAlign: "center"
      }}>
        Test Pose Tracking
      </div>
      <Widgets />
    </div>
  );
};

export default Home;

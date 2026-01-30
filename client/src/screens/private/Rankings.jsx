import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import "./Rankings.css";
import axios from "axios";

const Rankings = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get("/api/user/leaderboard/all");
        // Add rank to each user
        const rankedUsers = response.data.map((user, index) => ({
          ...user,
          rank: index + 1,
          // Fallback image if needed
          image: user.image || `https://ui-avatars.com/api/?name=${user.username}&background=random`
        }));
        setLeaderboard(rankedUsers);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const additionalStats = [
    {
      title: "Most Pushups",
      player: "DarthKing",
      value: "600",
      image:
        "https://plus.unsplash.com/premium_photo-1664536392896-cd1743f9c02c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: "Most Earnings",
      player: leaderboard[0]?.username || "CharlieBEE",
      value: leaderboard[0] ? `$${leaderboard[0].funds}` : "$1200",
      image: leaderboard[0]?.image ||
        "https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: "Most Points",
      player: "CharlieBEE",
      value: "1700",
      image:
        "https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      title: "Longest Streak",
      player: "Killer45",
      value: "35 Days",
      image:
        "https://plus.unsplash.com/premium_photo-1689539137236-b68e436248de?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjV8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D",
    },
  ];

  return (
    <div className="rankings-container">
      <div className="background">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <Header />
      <h1 className="rankings-title">Leaderboard</h1>

      {loading ? (
        <div style={{ color: "white", textAlign: "center", marginTop: "20px" }}>Loading...</div>
      ) : (
        <div className="top-players-section">
          {leaderboard.map((player) => (
            <div
              key={player.rank}
              className="top-player-card"
              onClick={() => setSelectedPlayer(player)}
            >
              <div className="rank-badge">{player.rank}</div>
              <img
                src={player.image}
                alt={player.username}
                className="player-avatar"
              />
              <div className="player-name">{player.username}</div>
              <div className="player-score">Funds: ${player.funds}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="rankings-subtitle">Additional Stats</h2>
      <div className="additional-stats-section">
        {additionalStats.map((stat, index) => (
          <div key={index} className="stat-card">
            <img src={stat.image} alt={stat.player} className="stat-avatar" />
            <div className="stat-info">
              <h3 className="stat-title">{stat.title}</h3>
              <p className="stat-player">{stat.player}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSelectedPlayer(null)}
            >
              X
            </button>
            <img
              src={selectedPlayer.image}
              alt={selectedPlayer.username}
              className="modal-avatar"
            />
            <h3 className="modal-name">{selectedPlayer.username}</h3>
            <p className="modal-detail">Funds: ${selectedPlayer.funds}</p>
            <p className="modal-detail">Games Played: {selectedPlayer.gamesPlayed || 0}</p>
            {/* Additional details can be added here if available in user model */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;

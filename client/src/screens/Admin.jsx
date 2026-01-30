import React, { useState } from "react";
import axios from "axios"; // Import axios
import { getWinners, payoutWinners, returnBets } from "../utils/SmartContract";
import ChainInfo from "../utils/chains.json";
import { detectCurrentNetwork } from "../utils/DetectCurrentNetwork";

const AdminPage = () => {
  const [message, setMessage] = useState("");
  const [gameId, setGameId] = useState(""); // For "end game" command

  // Function to handle API requests using axios
  const sendCommand = async (command) => {
    let endpoint = `/api/admin/${command}`; // Proxy handles /api -> http://localhost:8000
    let body = {};

    if (command === "end") {
      // For "end" game, we need to pass the game ID
      body = { gameId };
    }

    try {
      const response = await axios.post(endpoint, body);
      setMessage(
        `${command} command successful: ${JSON.stringify(response.data)}`
      );
    } catch (error) {
      console.error("Error:", error);
      if (error.response) {
        // Error response from the server
        setMessage(`Error running ${command}: ${error.response.data.message}`);
      } else {
        // General error
        setMessage(`An error occurred with the ${command} command.`);
      }
    }
  };



  return (
    <div>
      <h1>Game Admin Panel</h1>
      <button onClick={() => sendCommand("create")}>Create Game</button>
      <button onClick={() => sendCommand("activate")}>Activate Game</button>
      <button onClick={() => sendCommand("start")}>Start Game</button>
      <button onClick={() => sendCommand("reset")}>Reset Game</button>

      {/* End Game requires game ID */}
      <input
        type="text"
        placeholder="Enter Game ID to end"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />
      <button onClick={() => sendCommand("end")}>End Game</button>

      {/* Display response message */}
      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminPage;

import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../../utils/AuthProvider";
import "./Game.css";
import {
  initializeSocketListeners,
  joinGame,
  submitResponse,
} from "../../utils/gameFunctions";
import Logo from "../../assets/logo.png";
import { joinGameContract, addTokenToMetaMask } from "../../utils/SmartContract";
import ChainInfo from "../../utils/chains.json";
import { detectCurrentNetwork, switchNetwork } from "../../utils/DetectCurrentNetwork";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const Game = () => {
  const { user } = useContext(AuthContext);
  const walletAddress = user?.walletAddress;
  const [notification, setNotification] = useState("");
  const [progress, setProgress] = useState(0);
  const [icon, setIcon] = useState(null);
  const [joinError, setJoinError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [gameStatus, setGameStatus] = useState("none");
  const [players, setPlayers] = useState([]);
  const [stake, setStake] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [userResult, setUserResult] = useState(null);
  const [hasJoinedGame, setHasJoinedGame] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  useEffect(() => { countRef.current = count; }, [count]);
  const [stage, setStage] = useState("DOWN");

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  useEffect(() => {
    if (isRecording && videoRef.current) {
      let animationFrameId;
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        if (!canvasRef.current) return;

        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext("2d");

        // Should verify width/height are available
        if (!videoRef.current || !videoRef.current.videoWidth) return;

        // Match canvas size to video explicitly every frame to be safe or just when changed
        if (canvasElement.width !== videoRef.current.videoWidth) {
          canvasElement.width = videoRef.current.videoWidth;
          canvasElement.height = videoRef.current.videoHeight;
          console.log("Canvas resized to", canvasElement.width, "x", canvasElement.height);
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (results.poseLandmarks) {
          // Ensure lineWidth is visible
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 4,
          });
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });

          // Calculate push-up angle
          const landmarks = results.poseLandmarks;
          const leftShoulder = landmarks[11];
          const leftElbow = landmarks[13];
          const leftWrist = landmarks[15];

          if (leftShoulder && leftElbow && leftWrist) {
            const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);

            // Push-up logic
            setStage((prevStage) => {
              if (angle > 160) {
                if (prevStage === "DOWN") {
                  setCount((prevCount) => prevCount + 1);
                }
                return "UP";
              } else if (angle < 90) {
                return "DOWN";
              }
              return prevStage;
            });
          }
        }
        canvasCtx.restore();
      });

      const loop = async () => {
        // Only send data if video is playing and has data
        if (videoRef.current &&
          videoRef.current.readyState >= 2 && // HAVE_CURRENT_DATA
          !videoRef.current.paused &&
          !videoRef.current.ended) {
          try {
            await pose.send({ image: videoRef.current });
          } catch (e) {
            console.error("Pose send error:", e);
          }
        }
        if (isRecording) { // Check closure variable? isRecording might change in the component but this effect runs ONCE when isRecording BECOMES true.
          // Actually this effect depends on [isRecording]. When isRecording becomes false, this effect cleanup runs, and we should stop the loop.
          // We can use a ref or check a variable. 
          // However, since we re-run the effect when isRecording changes (it goes false), the cleanup below will be called.
          // We should cancel the animation frame there.
          animationFrameId = requestAnimationFrame(loop);
        }
      };
      loop();

      return () => {
        cancelAnimationFrame(animationFrameId);
        pose.close();
      };
    }
  }, [isRecording]);
  /* Fix: isUserInGame should check walletAddress in players array of objects */
  const isUserInGame = players.some((p) => p.walletAddress === user?.walletAddress);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await axios.get("https://localhost:8000/game/");
        if (response.data.message === "No games found.") {
          setGameStatus("none");
        } else {
          const currentGame = response.data.games[0];

          // Map server state to client UI state
          let mappedStatus = currentGame.status;
          if (currentGame.status === "inactive") {
            mappedStatus = "created";
          } else if (currentGame.status === "active") {
            mappedStatus = currentGame.gameStarted ? "active" : "activated";
          }

          setGameStatus(mappedStatus);
          setPlayers(currentGame.players || []);
          /* Fix: Check using walletAddress */
          setHasJoinedGame(
            (currentGame.players || []).some(
              (p) => p.walletAddress === user?.walletAddress
            )
          );
        }
      } catch (error) {
        console.error("Error fetching game data:", error);
      }
    };

    fetchGame();
    initializeSocketListeners(
      setNotification,
      setProgress,
      setIcon,
      setGameStatus,
      showNotification
    );
  }, [user]); /* Added user to dependency to ensure check runs when user loads */

  const handleJoinGame = async () => {
    setLoading(true);
    if (!user) {
      showNotification("Please log in to join the game.");
      setLoading(false);
      return;
    }

    if (!stake || isNaN(stake)) {
      showNotification("Please enter a valid stake amount.");
      setLoading(false);
      return;
    }
    try {
      const currentNetwork = await detectCurrentNetwork();
      if (!ChainInfo[currentNetwork]) {
        showNotification(`Unsupported network: ${currentNetwork}. Attempting to switch to Sepolia...`);
        await switchNetwork();
        setLoading(false);
        return;
      }

      await joinGameContract(
        ChainInfo[currentNetwork].gameCA,
        ChainInfo[currentNetwork].usdcTokenCA,
        stake
      );

      const errorMessage = await joinGame(user._id, stake, showNotification);
      if (!errorMessage) {
        /* Fix: Push object to match state structure */
        setPlayers((prevPlayers) => [
          ...prevPlayers,
          { walletAddress: user.walletAddress, stakeAmount: parseFloat(stake) },
        ]);
        setStake("");
        setHasJoinedGame(true);
      } else {
        setJoinError(errorMessage);
      }
    } catch (error) {
      console.error("Error joining game:", error);
      showNotification("Failed to join game. Check console for details.");
    } finally {
      setLoading(false);
    }
  };


  const handleAddToken = async () => {
    const currentNetwork = await detectCurrentNetwork();
    if (ChainInfo[currentNetwork]) {
      await addTokenToMetaMask(
        ChainInfo[currentNetwork].usdcTokenCA,
        "mUSDC",
        6
      );
    } else {
      showNotification("Unsupported network.");
    }
  };

  const startCountdown = () => {
    setTimeLeft(30);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (gameStatus === "active") {
      startCountdown();
    }
    if (gameStatus === "ended") {
      checkUserResult();
    }
  }, [gameStatus]);

  const checkUserResult = async () => {
    if (!user) return; // Prevent check if user is not logged in
    try {
      const response = await axios.get(
        `https://localhost:8000/game/result/${user.walletAddress}`
      );
      setUserResult(response.data.result);
    } catch (error) {
      console.error("Error fetching user result:", error);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setNotification("");
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    setTimeout(() => {
      // Animate the notification disappearing
      const notificationBar = document.querySelector(".notification-bar");
      if (notificationBar) {
        notificationBar.style.animation = "fadeOut 0.5s forwards";
      }
      setTimeout(() => setNotification(""), 500); // Remove notification after fade
    }, 4000); // Delay to allow progress bar to fill
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser.");
      showNotification("getUserMedia not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setVideoBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        submitVideo(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      // Reset count and stage when recording starts to avoid false positives
      setCount(0);
      setStage("UP"); // Force user to start from UP position (or at least go UP before going DOWN)
    } catch (error) {
      console.error("Error starting video recording:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const submitVideo = async (blobArg) => {
    const blobToSubmit = blobArg || videoBlob;
    if (!blobToSubmit) return;

    const formData = new FormData();
    formData.append("video", blobToSubmit, "pushups.webm");
    formData.append("walletAddress", walletAddress);
    formData.append("pushupCount", countRef.current);

    try {
      const response = await axios.post(
        `https://localhost:8000/game/submitResponse`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      showNotification("Video submitted successfully!");
      setVideoBlob(null); // Clear the video blob after submission
      setHasSubmitted(true);
    } catch (error) {
      console.error("Error submitting video:", error);
      showNotification("Error submitting video.");
    }
  };

  /* New hasSubmitted state to track submission status */
  const [hasSubmitted, setHasSubmitted] = useState(false);

  /* Calculate Pool Size */
  const poolSize = players.reduce(
    (acc, player) => acc + (player.stakeAmount || 0),
    0
  );

  // Find current user's stake
  const myPlayer = players.find(p => p.walletAddress === user?.walletAddress);

  return (
    <div className="game-container">
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}
      {notification !== "" && (
        <div className="notification-bar">
          <div className="notification-content">
            <div className="notification-message">{notification}</div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      <div className="header">
        <h1 className="title">Games</h1>
      </div>

      <div className="card">
        {gameStatus === "none" && (
          <p className="globalText">No upcoming games at the moment.</p>
        )}
        {gameStatus === "created" && (
          <p className="globalText">A new game has been created. Join now!</p>
        )}
        {gameStatus === "activated" && (
          <p className="globalText">
            {isUserInGame
              ? "The game is activated! Wait for the start."
              : "The game is activated, but you are not enrolled. Join now!"}
          </p>
        )}
        {gameStatus === "active" && (
          <p className="globalText">
            {isUserInGame
              ? hasSubmitted ? "Response Recorded. Good Luck!" : "Game is in progress. Time left to do pushups!"
              : "The game is in progress, but you are not enrolled."}
          </p>
        )}
        {gameStatus === "ended" && (
          <p className="globalText">
            The game has ended.{" "}
            <span
              style={{
                fontSize: "2em",
                fontWeight: "bold",
                color: userResult === "win" ? "green" : "red",
                display: "block",
                marginTop: "10px",
              }}
            >
              {userResult ? `You ${userResult}!` : ""}
            </span>
            {userResult === "win" && (
              <span
                style={{
                  fontSize: "1em",
                  color: "#4caf50",
                  display: "block",
                  marginTop: "5px",
                }}
              >
                Reward transferred to your wallet.
              </span>
            )}
            {userResult === "lose" && (
              <span
                style={{
                  fontSize: "1em",
                  color: "#ff5252",
                  display: "block",
                  marginTop: "5px",
                }}
              >
                You lost ${myPlayer?.stakeAmount || 0} from your account.
              </span>
            )}
          </p>
        )}

        {gameStatus !== "none" && (
          <p className="poolText">
            {gameStatus === "created"
              ? "Current Pool Size"
              : "Current Reward Pool"}{" "}
            <span className="poolAmount">${poolSize}</span>
            <br />
            <span style={{ fontSize: "0.8em", color: "#ccc" }}>
              Active Members: {players.length}
            </span>
          </p>
        )}

        <div className="iconContainer">
          <img src={Logo} alt="Game Logo" className="logo" />
        </div>

        {gameStatus === "created" && !hasJoinedGame ? (
          <div className="inputContainer">
            <input
              type="number"
              className="input"
              placeholder="Enter bet amount"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
            />
            <button className="joinButton" onClick={handleJoinGame}>
              Stake
            </button>

          </div>
        ) : gameStatus === "created" && hasJoinedGame ? (
          <p className="joinedMessage">Joined Game</p>
        ) : null}

        {gameStatus === "active" && isUserInGame && !hasSubmitted && (
          <div className="timeContainer">
            <p className="startText">Time Left</p>
            <div className="timer">
              <p className="startText">{formatTime(timeLeft)}</p>
            </div>

            <div style={{ position: "relative", width: "100%" }}>
              <video
                ref={videoRef}
                className="videoFeed"
                autoPlay
                playsInline
                style={{ display: isRecording || videoBlob ? "block" : "none", width: "100%" }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100vh",
                  pointerEvents: "none",
                  display: isRecording ? "block" : "none",
                  zIndex: 11
                }}
              />
              {isRecording && (
                <div style={{
                  position: "fixed",
                  top: 10,
                  left: 10,
                  color: "white",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  zIndex: 12
                }}>
                  <h3>Count: {count}</h3>

                </div>
              )}
              {!isRecording && count < 5 && videoBlob && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "rgba(255, 0, 0, 0.8)",
                  color: "white",
                  padding: "20px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  zIndex: 20
                }}>
                  YOU LOSE!
                </div>
              )}
            </div>

            <div className="videoControls">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className="videoButton"
              >
                {isRecording ? "Stop Recording / Submit" : "Record Pushups"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;

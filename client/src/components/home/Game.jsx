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

const Game = ({ selectedDeviceId, isSuspicious }) => {
  const { user, walletAddress: contextWalletAddress } = useContext(AuthContext);
  const walletAddress = contextWalletAddress || user?.walletAddress;
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

  // --- ANTI-CHEAT STATE ---
  // Using prop isSuspicious instead of local state for detection


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
            color: "rgba(0, 255, 255, 0.4)", // Sci-Fi Cyan (transparent)
            lineWidth: 2,
          });
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: "#00FFFF", // Cyan dots
            lineWidth: 1,
            radius: 3
          });

          const lm = results.poseLandmarks;

          // Key points for Left side
          const leftShoulder = lm[11];
          const leftElbow = lm[13];
          const leftWrist = lm[15];
          const leftHip = lm[23];
          const leftAnkle = lm[27];

          // Key points for Right side
          const rightShoulder = lm[12];
          const rightElbow = lm[14];
          const rightWrist = lm[16];
          const rightHip = lm[24];
          const rightAnkle = lm[28];

          // Nose for Head HUD
          const nose = lm[0];

          if (leftShoulder && leftElbow && leftWrist && rightShoulder && rightElbow && rightWrist && leftHip && leftAnkle) {

            // 1. Arm Angles
            const leftArmAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
            const rightArmAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

            // 2. Body Alignment
            const bodyAlignmentAngle = calculateAngle(leftShoulder, leftHip, leftAnkle);

            // Thresholds
            const ARM_EXTENDED_THRESHOLD = 160;
            const ARM_BENT_THRESHOLD = 90;
            const BODY_STRAIGHT_THRESHOLD = 150;

            // --- HUD & VISUALS START ---
            const width = canvasElement.width;
            const height = canvasElement.height;

            // A. Target Reticle on Head
            if (nose) {
              const nx = nose.x * width;
              const ny = nose.y * height;

              canvasCtx.strokeStyle = isSuspicious ? "red" : "#00FFFF";
              canvasCtx.lineWidth = 2;
              canvasCtx.beginPath();
              canvasCtx.arc(nx, ny, 30, 0, 2 * Math.PI); // Circle around face
              canvasCtx.moveTo(nx - 40, ny); canvasCtx.lineTo(nx - 20, ny); // Left Hash
              canvasCtx.moveTo(nx + 40, ny); canvasCtx.lineTo(nx + 20, ny); // Right Hash
              canvasCtx.moveTo(nx, ny - 40); canvasCtx.lineTo(nx, ny - 20); // Top Hash
              canvasCtx.moveTo(nx, ny + 40); canvasCtx.lineTo(nx, ny + 20); // Bottom Hash
              canvasCtx.stroke();

              if (isSuspicious) {
                canvasCtx.fillStyle = "red";
                canvasCtx.font = "bold 20px Arial";
                canvasCtx.fillText("VIRTUAL CAM", nx - 60, ny - 50);
              }
            }

            // B. Energy Bar (Depth Gauge)
            // Map arm angle (180 -> 70) to Percentage (0 -> 100)
            // 180 = 0% (Start), 90 = 100% (Full Rep Depth)
            const depthMetric = Math.min(100, Math.max(0, (180 - leftArmAngle) / (180 - 90) * 100));
            const barCheck = depthMetric > 90; // "In the zone"

            // Draw Bar Container
            const barW = 30;
            const barH = 300;
            const barX = 40;
            const barY = height / 2 - barH / 2;

            canvasCtx.fillStyle = "rgba(0,0,0,0.5)";
            canvasCtx.fillRect(barX, barY, barW, barH);

            // Draw Fill
            canvasCtx.fillStyle = barCheck ? "#00FF00" : (depthMetric > 50 ? "orange" : "#00FFFF");
            const fillH = (depthMetric / 100) * barH;
            canvasCtx.fillRect(barX, barY + (barH - fillH), barW, fillH);

            // Draw Bar Border
            canvasCtx.strokeStyle = "white";
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeRect(barX, barY, barW, barH);

            // Text Label
            canvasCtx.fillStyle = "white";
            canvasCtx.font = "12px monospace";
            canvasCtx.fillText("DEPTH", barX - 5, barY + barH + 15);

            // --- HUD END ---

            let feedback = "";
            let isBodyStraight = bodyAlignmentAngle > BODY_STRAIGHT_THRESHOLD;
            let areArmsBent = leftArmAngle < ARM_BENT_THRESHOLD && rightArmAngle < ARM_BENT_THRESHOLD;
            let areArmsExtended = leftArmAngle > ARM_EXTENDED_THRESHOLD && rightArmAngle > ARM_EXTENDED_THRESHOLD;

            if (!isBodyStraight) {
              feedback = "ALIGN CORE";
              canvasCtx.strokeStyle = "red"; // Alert color
            } else if (stage === "UP" && !areArmsBent && leftArmAngle < 140) {
              feedback = "INCREASE DEPTH";
            } else if (stage === "DOWN" && !areArmsExtended && leftArmAngle > 110) {
              feedback = "EXTEND ARMS";
            }

            // Draw Sci-Fi Feedback
            if (feedback) {
              canvasCtx.fillStyle = "rgba(255, 0, 0, 0.8)";
              canvasCtx.font = "bold 40px Courier New";
              canvasCtx.fillText(`⚠ ${feedback}`, width / 2 - 150, 100);
            }

            // LIVENESS CHECK: Draw Timestamp
            canvasCtx.fillStyle = "rgba(0, 255, 255, 0.7)";
            canvasCtx.font = "14px monospace";
            canvasCtx.fillText(`SYS.TIME: ${new Date().toISOString()}`, 10, height - 10);
            canvasCtx.fillText(`TRACKING: ONLINE`, 10, height - 25);

            // PARTICLE SYSTEM LOGIC
            // Initialize particles if not exists
            if (!videoRef.current.particles) videoRef.current.particles = [];

            // Update and draw existing particles
            for (let i = videoRef.current.particles.length - 1; i >= 0; i--) {
              const p = videoRef.current.particles[i];
              p.x += p.vx;
              p.y += p.vy;
              p.life -= 0.05;
              p.vy += 0.5; // Gravity

              if (p.life <= 0) {
                videoRef.current.particles.splice(i, 1);
              } else {
                canvasCtx.fillStyle = `rgba(255, 200, 50, ${p.life})`;
                canvasCtx.beginPath();
                canvasCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                canvasCtx.fill();
              }
            }

            // State Machine
            setStage((prevStage) => {
              // Only transitions if body is straight
              if (isBodyStraight) {
                if (areArmsExtended) {
                  if (prevStage === "DOWN") {
                    // ACTION: REP COMPLETE
                    setCount((prevCount) => {
                      const newCount = prevCount + 1;
                      countRef.current = newCount; // SYNC REF FOR SUBMISSION

                      // 1. Audio Confirmation
                      const synth = window.speechSynthesis;
                      if (synth) {
                        const utterance = new SpeechSynthesisUtterance(String(newCount));
                        utterance.rate = 1.2;
                        utterance.pitch = 1.0;
                        synth.cancel(); // Stop previous
                        synth.speak(utterance);

                        // Encouragement every 5 reps
                        if (newCount % 5 === 0) {
                          const encouragement = new SpeechSynthesisUtterance("Great work! Keep pushing.");
                          synth.speak(encouragement);
                        }
                      }

                      return newCount;
                    });

                    // 2. Spawn Particles (Explosion)
                    if (nose) {
                      for (let k = 0; k < 30; k++) {
                        videoRef.current.particles.push({
                          x: nose.x * width,
                          y: nose.y * height,
                          vx: (Math.random() - 0.5) * 10,
                          vy: (Math.random() - 0.5) * 10 - 5, // Upward bias
                          life: 1.0,
                          size: Math.random() * 5 + 2
                        });
                      }
                    }
                  }
                  return "UP";
                } else if (areArmsBent) {
                  return "DOWN";
                }
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
  const isUserInGame = players.some((p) => p.walletAddress === walletAddress);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await axios.get(`/api/game/`);
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
              (p) => p.walletAddress === walletAddress
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
    console.log("handleJoinGame called. User:", user);
    setLoading(true);
    // Allow joining if we have a user (logged in) OR just a wallet address
    if (!user && !walletAddress) {
      showNotification("Please connect your wallet to join.");
      setLoading(false);
      return;
    }

    const currentUserId = user ? user._id : null;
    const currentWallet = walletAddress || (user ? user.walletAddress : null);

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

      // Pass walletAddress as well
      const errorMessage = await joinGame(currentUserId, stake, showNotification, currentWallet);
      if (!errorMessage) {
        /* Fix: Push object to match state structure */
        setPlayers((prevPlayers) => [
          ...prevPlayers,
          { walletAddress: currentWallet, stakeAmount: parseFloat(stake) },
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
          clearInterval(timer);
          endRecordingProcess(); // Stop recording when time is up
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
    if (!walletAddress) return; // Wait until we have a wallet address
    try {
      const response = await axios.get(
        `/api/game/result/${walletAddress}`
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
      const constraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
      countRef.current = 0; // Explicitly reset ref
      setStage("UP"); // Force user to start from UP position
    } catch (error) {
      console.error("Error starting video recording:", error);
    }
  };

  const endRecordingProcess = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Explicitly stop video stream tracks to turn off camera light
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    // DO NOT RESET COUNT HERE. It is needed for submission!
  };



  const submitVideo = async (blobArg) => {
    const blobToSubmit = blobArg || videoBlob;
    if (!blobToSubmit) return;

    const formData = new FormData();
    formData.append("video", blobToSubmit, "pushups.webm");
    formData.append("walletAddress", walletAddress);
    console.log("Submitting video. CountRef:", countRef.current);
    formData.append("pushupCount", countRef.current);

    // DEBUG: Test POST connectivity with small payload
    try {
      console.log("DEBUG: Pinging POST /api/game/submitResponse with JSON...");
      const pingRes = await fetch(`/api/game/submitResponse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "ping" })
      });
      console.log(`DEBUG: Ping Status: ${pingRes.status}`);
      if (pingRes.status === 404) {
        console.error("DEBUG: Route not found even for JSON!");
      }
    } catch (e) {
      console.error("DEBUG: Ping failed", e);
    }

    try {
      console.log("Submitting to /api/game/submitResponse...");
      const response = await fetch(`/api/game/submitResponse`, {
        method: "POST",
        body: formData, // fetch handles multipart headers automatically
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status} ${response.statusText}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Submission response:", data);

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
  const myPlayer = players.find(p => p.walletAddress === walletAddress);

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

        {gameStatus === "created" && !hasJoinedGame && !isSuspicious ? (
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
                onClick={isRecording ? endRecordingProcess : startRecording}
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

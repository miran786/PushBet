import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { io } from "socket.io-client";

const ServerPoseTracking = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [count, setCount] = useState(0);
    const [stage, setStage] = useState("UP");
    const [angle, setAngle] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Connect directly to Python server on 8001 to avoid conflict with Node server on 8000
        const newSocket = io("http://localhost:8001");
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to Python Analysis Server");
        });

        newSocket.on("pose_data", (data) => {
            setCount(data.count);
            setStage(data.stage);
            setAngle(data.angle);
            setFeedback(data.feedback);
        });

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            sendFrame();
        }, 100); // 10fps

        return () => clearInterval(interval);
    }, [socket]);

    const sendFrame = () => {
        if (
            webcamRef.current &&
            webcamRef.current.video.readyState === 4 &&
            socket
        ) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                socket.emit("process_frame", imageSrc);
            }
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                backgroundColor: "#1e1e1e",
                position: "relative",
            }}
        >
            <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={1280}
                height={720}
                style={{
                    position: "absolute",
                    marginLeft: "auto",
                    marginRight: "auto",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    zIndex: 9,
                }}
            />
            {/* Overlay feedback */}
            <div
                style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    zIndex: 10,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    color: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    border: "2px solid #00f0ff"
                }}
            >
                <h1 style={{ margin: 0, fontSize: "40px", color: "#00f0ff" }}>Count: {count}</h1>
                <h2 style={{ margin: 0 }}>Stage: {stage}</h2>
                <h3 style={{ margin: 0 }}>Angle: {Math.round(angle)}°</h3>
                <h3 style={{ margin: 0, color: feedback === "UP" ? "green" : "red" }}>{feedback}</h3>
                <small>Server-Side AI Tracking Active (Port 8001)</small>
            </div>
        </div>
    );
};

export default ServerPoseTracking;

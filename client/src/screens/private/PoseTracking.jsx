import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const PoseTracking = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [count, setCount] = useState(0);
    const [stage, setStage] = useState("DOWN"); // "UP" or "DOWN"

    const calculateAngle = (a, b, c) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);

        if (angle > 180.0) {
            angle = 360 - angle;
        }
        return angle;
    };

    useEffect(() => {
        const onResults = (results) => {
            if (!webcamRef.current || !webcamRef.current.video || !canvasRef.current) {
                return;
            }

            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;

            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            const canvasElement = canvasRef.current;
            const canvasCtx = canvasElement.getContext("2d");
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            if (results.poseLandmarks) {
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
        };

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

        pose.onResults(onResults);

        if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null) {
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current && webcamRef.current.video) {
                        await pose.send({ image: webcamRef.current.video });
                    }
                },
                width: 1280,
                height: 720,
            });
            camera.start();
        }
    }, []);

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
                style={{
                    position: "absolute",
                    marginLeft: "auto",
                    marginRight: "auto",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    zIndex: 9,
                    width: 1280,
                    height: 720,
                }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    marginLeft: "auto",
                    marginRight: "auto",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    zIndex: 9,
                    width: 1280,
                    height: 720,
                }}
            />

            {/* HUD for Counts */}
            <div
                style={{
                    position: "absolute",
                    top: 20,
                    left: 20,
                    zIndex: 10,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                }}
            >
                <h1 style={{ margin: 0, fontSize: "40px" }}>Count: {count}</h1>
                <h2 style={{ margin: 0 }}>Stage: {stage}</h2>
            </div>
        </div>
    );
};

export default PoseTracking;

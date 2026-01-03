import React, { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const PoseTracking = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

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

            // Draw the video frame content if you want the underlying video to be visible
            // Or MediaPipe can just draw on top of the transparent canvas on top of the <Webcam>
            // The <Webcam> component usually displays the video itself.
            // So we just draw landmarks on the canvas.

            if (results.poseLandmarks) {
                drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 4,
                });
                drawLandmarks(canvasCtx, results.poseLandmarks, {
                    color: "#FF0000",
                    lineWidth: 2,
                });
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

        if (
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null
        ) {
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
        </div>
    );
};

export default PoseTracking;

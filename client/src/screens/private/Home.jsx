import React from "react";

import Header from "../../components/Header";
import Greeting from "../../components/home/Greeting";
import Streak from "../../components/home/Streaks";
import Game from "../../components/home/Game";
import Widgets from "../../components/home/Widgets";

const Home = () => {
  const [cameras, setCameras] = React.useState([]);

  const [selectedDeviceId, setSelectedDeviceId] = React.useState("");
  const [isSuspicious, setIsSuspicious] = React.useState(false);

  // Check for suspicious cameras whenever selectedDeviceId changes
  React.useEffect(() => {
    if (!selectedDeviceId || cameras.length === 0) return;

    const selectedCamera = cameras.find(c => c.deviceId === selectedDeviceId);
    if (selectedCamera) {
      const label = selectedCamera.label.toLowerCase();
      const blacklist = ["virtual", "obs", "manycam", "xsplit", "fake", "clone", "droidcam", "iriun", "camo"];
      const isSus = blacklist.some(keyword => label.includes(keyword));
      setIsSuspicious(isSus);
    }
  }, [selectedDeviceId, cameras]);

  React.useEffect(() => {
    const getCameras = async () => {
      try {
        // 1. Request permission first to get labels
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        // 2. Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);

        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }

        // 3. Stop the stream (we just needed it for permissions/labels)
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Error getting cameras or permission denied:", err);
      }
    };
    getCameras();
  }, []);

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

      {/* Camera Selector at the top */}
      {cameras.length > 0 && (
        <div style={{ zIndex: 10, marginTop: "10px", width: "90%", maxWidth: "600px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "10px" }}>
          <label style={{ color: "white", fontWeight: "bold" }}>Select Camera:</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "#222",
              color: "white",
              border: "1px solid #ffc400", // Gold border to match theme
              flex: 1,
              maxWidth: "300px"
            }}
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`}
              </option>
            ))}

          </select>
        </div>
      )}

      {isSuspicious && (
        <div style={{
          zIndex: 10,
          width: "90%",
          maxWidth: "600px",
          padding: "10px",
          borderRadius: "5px",
          background: "rgba(255, 0, 0, 0.8)",
          color: "white",
          textAlign: "center",
          fontWeight: "bold",
          border: "2px solid red"
        }}>
          ⚠️ SUSPICIOUS CAMERA DETECTED! COMPETITIVE MODE DISABLED.
        </div>
      )}

      <Greeting />
      <Streak />
      <Game selectedDeviceId={selectedDeviceId} isSuspicious={isSuspicious} />

      <Widgets />
    </div>
  );
};

export default Home;

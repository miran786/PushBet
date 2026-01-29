// Created by: Miran | Date: 01/01/2026
const express = require("express");
const https = require("https");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("./database");
const userRoutes = require("./routes/userRoutes");
const gameRoutes = require("./routes/gameRoutes");
const { Server } = require("socket.io");

dotenv.config();

const app = express();

const http = require("http");

// Load SSL credentials or fallback to HTTP
let server;
if (process.env.NODE_ENV === "production") {
  // On Render/Production, use basic HTTP (Load Balancer handles SSL)
  console.log("Production environment detected. Starting HTTP server.");
  server = http.createServer(app);
} else {
  // Local Development: Try to use HTTPS
  try {
    const privateKey = fs.readFileSync("../client/server.key", "utf8");
    const certificate = fs.readFileSync("../client/server.cert", "utf8");
    const credentials = { key: privateKey, cert: certificate };
    server = https.createServer(credentials, app);
    console.log("Local development: Starting HTTPS server.");
  } catch (error) {
    console.warn("SSL certificates not found. Falling back to HTTP.");
    server = http.createServer(app);
  }
}

const io = new Server(server, {
  cors: {
<<<<<<< HEAD
    origin: "*", // Allow any origin for hackathon demo
=======
    origin: [
      "https://localhost:5173",
      "http://localhost:5173",
      "https://localhost:5174",
      "http://localhost:5174",
      "https://192.168.31.201:5174",
      "http://192.168.31.201:5174",
      "https://push-bet-nine.vercel.app",
    ],
>>>>>>> 4e53ea28cb243f5076f0a2a905f9e2047b0d4e7f
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
<<<<<<< HEAD
    origin: true, // Reflects the request origin
=======
    origin: [
      "https://localhost:5173",
      "http://localhost:5173",
      "https://localhost:5174",
      "http://localhost:5174",
      "https://192.168.31.201:5174",
      "http://192.168.31.201:5174",
      "https://push-bet-nine.vercel.app",
    ],
>>>>>>> 4e53ea28cb243f5076f0a2a905f9e2047b0d4e7f
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Middleware to use io in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(bodyParser.json());

// Routes
app.use("/user", userRoutes);
app.use("/game", gameRoutes);

// Now pass io to the admin routes after io is initialized
const adminRoutes = require("./controllers/consoleControllers")(io);
app.use("/admin", adminRoutes); // Mount the routes

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server running on port ${PORT}`);
});

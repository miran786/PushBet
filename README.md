# PushBet 🚀
> **The future of decentralized betting. Fair, transparent, and real-time.**

PushBet is a full-stack decentralized application (dApp) built for the Hackathon. It bridges the gap between traditional betting and blockchain transparency, allowing users to wager on pushup challenges in real-time.

## 🌟 Key Features

*   **🛡️ Trustless Transactions**: Powered by Smart Contracts (Solidity), ensuring every bet is secure and payout is guaranteed.
*   **⚡ Real-Rime Action**: Live updates via Socket.io for instant game status and opponent moves.
*   **🔐 Seamless Web3 Auth**: Integrated with Thirdweb & MetaMask for one-click wallet login.
*   **🤖 Anti-Cheat System**: (Coming Soon) AI-powered video verification to ensure fair play.
*   **📦 Dockerized**: One-command setup for the full stack.

## 📸 Screenshots

| Landing Page | Game Interface |
|:---:|:---:|
| *(Add Screenshot)* | *(Add Screenshot)* |

## Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Web3**: Thirdweb, Web3.js, @walletconnect/web3-provider
*   **Styling**: CSS / Tailwind (if applicable)
*   **State/Routing**: React Router DOM

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (Mongoose)
*   **Real-time**: Socket.io
*   **Authentication**: JSON Web Token (JWT), bcryptjs

### Blockchain
*   **Smart Contracts**: Solidity
*   **Deployment**: (e.g., Remix, Thirdweb, or Hardhat - Update this based on how you deployed)

## Prerequisites

Before running the project, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (for MongoDB)
*   [MetaMask](https://metamask.io/) or another Web3 wallet extension

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/miran786/PushBet
cd PushBet
```

### 2. Start the Database
This project uses Docker to run MongoDB. Ensure Docker Desktop is running.
```bash
docker-compose up -d
```
This will start a MongoDB container named `miran_mongo` on port `27017`.

### 3. Backend Setup
Navigate to the server directory, install dependencies, and start the server.

```bash
cd server
npm install
```

**Environment Variables:**
Create a `.env` file in the `server` directory. You may need to ask the project owner for the specific variables required (e.g., `MONGO_URI`, `JWT_SECRET`, `PORT`).
Example:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hackathon_db
```

Start the server:
```bash
npm start
```
*The server will run using `nodemon` for auto-reloading.*

### 4. Frontend Setup
Open a new terminal, navigate to the client directory, and start the application.

```bash
cd client
npm install
npm run dev
```
Access the application at the URL provided in the terminal (usually `http://localhost:5173`).

## Smart Contracts
The `contract` directory contains the Solidity smart contracts (`MockUSDC.sol`, `UpdatedGame.sol`). Refer to that directory for deployment and testing scripts relevant to the blockchain layer.

## License
ISC

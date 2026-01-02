# Hackathon Project

A full-stack decentralized application (dApp) built for the Hackathon. This project features a React-based frontend, a Node.js/Express backend, and integrates with blockchain smart contracts.

## Features

*   **Decentralized Interaction**: seamless integration with blockchain wallets and smart contracts using Thirdweb and Web3.js.
*   **Real-time Updates**: Live data synchronization using Socket.io.
*   **User Authentication**: Secure user management.
*   **Robust Backend**: RESTful API powered by Node.js and Express.
*   **Containerized Database**: MongoDB setup via Docker for easy deployment.

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
*   **Development**: Hardhat / Foundry (implied by file structure)

## Prerequisites

Before running the project, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) (for MongoDB)
*   [MetaMask](https://metamask.io/) or another Web3 wallet extension

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <project-directory>
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

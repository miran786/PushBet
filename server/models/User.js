const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  walletAddress: { type: String, required: true },
  funds: { type: Number, default: 10000 },
  gamesPlayed: { type: Number, default: 0 },
  activeGame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
    default: null,
  },
  pastGames: [{ type: mongoose.Schema.Types.ObjectId, ref: "PastGame" }],
  winnings: [{ type: Number }],
  losses: [{ type: Number }],
});

module.exports = mongoose.model("User", userSchema);

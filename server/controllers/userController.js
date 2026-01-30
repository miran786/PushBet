const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.register = async (req, res) => {
  const { username, email, password, walletAddress } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      walletAddress,
    });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, walletAddress } = req.body;
  try {
    const user = await User.findOne({ email });
    if (
      !user ||
      !(await bcrypt.compare(password, user.password)) ||
      user.walletAddress !== walletAddress
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("pastGames");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
exports.getUserByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email }).select("-password").populate("pastGames");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
  } catch (err) {
  res.status(400).json({ error: err.message });
}
};

exports.getLeaderboard = async (req, res) => {
  try {
    // Fetch users sorted by funds (descending)
    // Limit to top 50 users
    const users = await User.find({})
      .select("username funds gamesPlayed winnings")
      .sort({ funds: -1 })
      .limit(50);

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

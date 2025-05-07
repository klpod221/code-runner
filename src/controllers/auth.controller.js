const jwt = require("jsonwebtoken");
const { User, Sequelize } = require("../models");
const { Op } = Sequelize;

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION === "true";

/**
 * Generate JWT token for a user
 * @param {number} userId - The user ID to include in the token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  if (!JWT_EXPIRATION) {
    return jwt.sign({ id: userId }, JWT_SECRET);
  }
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if this is the first user (to make them admin)
    const userCount = await User.count();

    // If not the first user and registration is disabled, return error
    if (userCount > 0 && !ALLOW_REGISTRATION) {
      return res.status(403).json({
        message: "Registration is currently disabled",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or email already in use",
      });
    }

    const role = userCount === 0 ? "admin" : "user";

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    // Generate token using the helper function
    const token = generateToken(user.id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({
      where: {
        username,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated",
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // Generate token using the helper function
    const token = generateToken(user.id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      message: "User profile retrieved successfully",
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving user profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

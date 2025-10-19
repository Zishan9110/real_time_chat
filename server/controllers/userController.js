import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// ✅ Signup Controller
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  console.log("🟢 Signup API called with data:", req.body);

  try {
    // Step 1: Validation
    if (!fullName || !email || !password || !bio) {
      console.log("⚠️ Missing field detected");
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Step 2: Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists:", email);
      return res.status(409).json({
        success: false,
        message: "Account already exists",
      });
    }

    // Step 3: Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    console.log("🔑 Password hashed successfully");

    // Step 4: Create user
    const newUser = await User.create({
      fullName,
      email,
      password: hashPassword,
      bio,
    });
    console.log("✅ User created successfully:", newUser._id);

    // Step 5: Generate token
    const token = generateToken(newUser._id);
    console.log("🎟️ Token generated:", token ? "YES" : "NO");

    // Step 6: Response
    res.status(201).json({
      success: true,
      userData: newUser,
      token,
      message: "Account created successfully",
    });

  } catch (error) {
    console.error("🔥 Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🟢 Login API called with:", email);

    // Step 1: Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Step 2: Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log("❌ Incorrect password for:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Step 3: Generate token
    const token = generateToken(user._id);
    console.log("✅ Login successful for:", email);

    // Step 4: Response
    res.status(200).json({
      success: true,
      userData: user,
      token,
      message: "Login successful",
    });

  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ✅ Check Auth Controller
export const checkAuth = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// ✅ Update Profile Controller
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    console.log("🟢 Update profile called for user:", userId);

    const updateData = { fullName, bio };

    if (profilePic) {
      const uploadResult = await cloudinary.uploader.upload(profilePic, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET, // ✅ use env variable
        folder: "user_profiles",
      });
      updateData.profilePic = uploadResult.secure_url;
      console.log("📸 Profile pic uploaded:", uploadResult.secure_url);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    console.log("✅ Profile updated for user:", updatedUser._id);

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("🔥 Update error:", error);
    res.status(error.http_code || 500).json({
      success: false,
      message: error.message,
      errorType: error.name,
    });
  }
};

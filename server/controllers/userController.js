import { generateToken } from "../lib/utils.js";
import { connectDB } from "../lib/db.js";   // ⭐ ADD
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";


// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    await connectDB();   // ⭐ MUST for Vercel

    const { fullName, email, password, bio } = req.body;

    if (!fullName || !email || !password || !bio) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Account already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    const safeUser = await User.findById(newUser._id).select("-password");

    res.status(201).json({
      success: true,
      userData: safeUser,
      token,
      message: "Account created successfully",
    });

  } catch (error) {
    console.error("🔥 Signup error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    await connectDB();   // ⭐ MUST for Vercel

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    const safeUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      userData: safeUser,
      token,
      message: "Login successful",
    });

  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= CHECK AUTH =================
export const checkAuth = async (req, res) => {
  await connectDB();

  res.status(200).json({
    success: true,
    user: req.user,
  });
};


// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    await connectDB();   // ⭐ MUST

    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    const updateData = { fullName, bio };

    if (profilePic) {
      const uploadResult = await cloudinary.uploader.upload(profilePic, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        folder: "user_profiles",
      });

      updateData.profilePic = uploadResult.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error("🔥 Update error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

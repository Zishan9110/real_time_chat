import jwt from 'jsonwebtoken'; // Make sure to import jwt
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
    try {
        // 1. Get token from header
        const token = req.headers.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token provided"
            });
        }

        // 2. Verify token (FIXED the typo here)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Find user
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        // 4. Attach user to request
        req.user = user;
        next();

    } catch (error) {
        console.error("Authentication Error:", error);
        
        let message = "Not authorized, token failed";
        if (error.name === 'TokenExpiredError') {
            message = "Token expired";
        } else if (error.name === 'JsonWebTokenError') {
            message = "Invalid token";
        }

        return res.status(401).json({
            success: false,
            message
        });
    }
};
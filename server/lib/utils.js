import jwt from "jsonwebtoken";

// ✅ Enhanced and fixed token generator
export const generateToken = (userId) => {
  try {
    // 1. Validate environment variable
    if (!process.env.JWT_SECRET || typeof process.env.JWT_SECRET !== 'string') {
      throw new Error("JWT_SECRET is missing or invalid in environment variables");
    }

    // 2. Validate and normalize userId
    if (!userId) {
      throw new Error("Invalid user ID provided");
    }
    const userIdStr = userId.toString(); // ✅ convert ObjectId → string

    // 3. Generate token with secure options
    return jwt.sign(
      { 
        userId: userIdStr,
        iss: 'your-app-name', // Issuer
        sub: 'user-auth',     // Subject
        aud: 'client'         // Audience
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',      // 1-day expiration
        algorithm: 'HS256',   // Explicit algorithm
        noTimestamp: false,   // Include issued-at timestamp
      }
    );

  } catch (error) {
    console.error("Token generation failed:", error);
    throw new Error("Failed to generate authentication token");
  }
};

// ✅ Secure token verification
export const verifyToken = (token) => {
  try {
    if (!token) throw new Error("No token provided");
    
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], 
      ignoreExpiration: false, 
      issuer: 'your-app-name', 
      audience: 'client'
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

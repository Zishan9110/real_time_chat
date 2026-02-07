import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });

    isConnected = conn.connections[0].readyState === 1;

    console.log("✅ Database Connected");
  } catch (error) {
    console.error("❌ Database Connection Error:", error.message);
    throw error;
  }
};

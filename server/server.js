import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Export these so other files can import them safely
export let io;
export const userSocketMap = new Map();

// Create app and setup middlewares (these work in all environments)
const app = express();

// ✅ CORS Setup
const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));

// ✅ Routes
app.use("/api/status", (req, res) => {
  res.status(200).json({ status: "healthy", time: new Date() });
});

app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// ✅ Start server only if not running in a serverless environment (like Vercel)
if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
  const server = http.createServer(app);

  // ✅ Initialize Socket.IO
  io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 10000,
    pingInterval: 5000,
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  });

  // ✅ Handle Socket Connections
  io.on("connection", (socket) => {
    console.log(`🟢 New connection: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    if (!userId) {
      console.warn("⚠️ Missing userId in handshake query");
      return socket.disconnect(true);
    }

    // Disconnect old socket if user already connected
    if (userSocketMap.has(userId)) {
      const oldSocketId = userSocketMap.get(userId);
      io.to(oldSocketId).disconnectSockets(true);
      console.log(`🔄 Replaced old socket for user ${userId}`);
    }

    userSocketMap.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(userSocketMap.keys()));

    socket.on("disconnect", () => {
      console.log(`🔴 Disconnected: ${socket.id}`);
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
        io.emit("onlineUsers", Array.from(userSocketMap.keys()));
      }
    });

    socket.on("error", (err) => {
      console.error(`❌ Socket error for user ${userId}:`, err);
    });
  });

  io.on("connection_error", (err) => {
    console.error("🚨 Socket.IO connection error:", err.message);
  });

  // ✅ Start Server
  const startServer = async () => {
    try {
      await connectDB();
      const PORT = process.env.PORT || 3000;
      server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}`);
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  };

  startServer();
}

// ✅ Export for Vercel compatibility (Serverless handler)
export default app;

import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Export these for other files
export let io;
export const userSocketMap = new Map();

// Create app
const app = express();

// ✅ CORS Setup
const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",")
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "https://real-time-chat-delta-six.vercel.app", // deployed frontend
    ];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "5mb" }));

// ✅ Status route
app.get("/api/status", (req, res) => {
  res.status(200).json({ status: "healthy", time: new Date() });
});

// ✅ Routes
app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// ✅ Socket.IO & local server (skip on Vercel)
if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
  const server = http.createServer(app);

  // Initialize Socket.IO
  io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
    pingTimeout: 10000,
    pingInterval: 5000,
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 New connection: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    if (!userId) return socket.disconnect(true);

    // Replace old socket if exists
    if (userSocketMap.has(userId)) {
      const oldSocketId = userSocketMap.get(userId);
      io.to(oldSocketId).disconnectSockets(true);
    }

    userSocketMap.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(userSocketMap.keys()));

    socket.on("disconnect", () => {
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
        io.emit("onlineUsers", Array.from(userSocketMap.keys()));
      }
    });

    socket.on("error", (err) => console.error(`Socket error for ${userId}:`, err));
  });

  const startServer = async () => {
    try {
      await connectDB(); // ✅ DB connection for local
      const PORT = process.env.PORT || 3000;
      server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("❌ Failed to start server:", err);
      process.exit(1);
    }
  };

  startServer();
}

// ✅ Export app for Vercel serverless
export default app;

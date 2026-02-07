import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

export let io;
export const userSocketMap = new Map();

const app = express();


// ✅ DB connect middleware (FIX FOR VERCEL)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB middleware error:", err);
    res.status(500).json({ message: "Database not connected" });
  }
});


// ✅ CORS
const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",")
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "https://real-time-chat-app-frontend-swart.vercel.app"
    ];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "5mb" }));


// ✅ Routes
app.get("/api/status", (req, res) => {
  res.status(200).json({ status: "healthy", time: new Date() });
});

app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);


// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});


// ✅ Socket only for LOCAL (not vercel)
if (process.env.VERCEL !== "1") {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 10000,
    pingInterval: 5000,
  });

  io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    if (!userId) return socket.disconnect(true);

    if (userSocketMap.has(userId)) {
      const oldId = userSocketMap.get(userId);
      io.to(oldId).disconnectSockets(true);
    }

    userSocketMap.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(userSocketMap.keys()));

    socket.on("disconnect", () => {
      if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
        io.emit("onlineUsers", Array.from(userSocketMap.keys()));
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`✅ Local server running on ${PORT}`);
  });
}

export default app;

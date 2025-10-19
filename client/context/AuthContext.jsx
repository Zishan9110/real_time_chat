import { createContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const checkAuth = async () => {
      try {
        const { data } = await axios.get("/api/auth/check");
        if (data.success) {
          setAuthUser(data.user);
          connectSocket(data.user);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
      }
    };

    axios.defaults.headers.common["token"] = token;
    checkAuth();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [token]);

  const connectSocket = (userData) => {
    if (!userData?._id || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", userData._id);
    });

    // ✅ FIXED EVENT NAME (backend emits "onlineUsers")
    newSocket.on("onlineUsers", (userIds) => {
      console.log("🟢 Online users from backend:", userIds);
      setOnlineUsers(userIds);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    setSocket(newSocket);
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["token"] = data.token;
        connectSocket(data.userData);
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const logout = () => {
    if (socket) socket.disconnect();
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["token"];
    toast.success("Logged out successfully");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body, {
        headers: {
          token: localStorage.getItem("token"),
          "Content-Type": "application/json",
        },
      });

      if (data.success) {
        setAuthUser(data.user);
        return data.user;
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Update failed");
    }
  };

  const value = useMemo(
    () => ({
      authUser,
      onlineUsers,
      socket,
      login,
      logout,
      updateProfile,
      axios, // ✅ Provided axios instance
    }),
    [authUser, onlineUsers, socket]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

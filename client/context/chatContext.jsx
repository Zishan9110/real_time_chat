// path: src/context/ChatContext.jsx   <-- keep file name & import casing consistent across project
import React, { useContext, useEffect, useState, createContext, useCallback } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  // Defensive: try several common property names from AuthContext
  const auth = useContext(AuthContext) || {};
  const socket = auth.socket || auth.io || null;
  const axios = auth.axios || auth.api || auth.axiosInstance || null;

  // If axios is not provided, we show an informative toast once (avoid spamming)
  useEffect(() => {
    if (!axios) {
      toast.error(
        "ChatContext: No axios instance found in AuthContext. Make sure AuthProvider provides an axios instance (property name: axios / api / axiosInstance)."
      );
    }
  }, [axios]);

  // function to get all users for sidebar
  const getUsers = useCallback(async () => {
    if (!axios) return;
    try {
      const { data } = await axios.get("/api/message/users");
      if (data?.success) {
        setUsers(data.users || []);
        setUnseenMessages(data.unseenMessages || {});
      } else {
        toast.error(data?.message || "Failed to fetch users");
      }
    } catch (error) {
      // show error message if axios exists; otherwise this won't run
      toast.error(error?.message || "Failed to fetch users");
    }
  }, [axios]);

  // function to get messages for selected user
  const getMessages = useCallback(
    async (userId) => {
      if (!axios) return;
      try {
        const { data } = await axios.get(`/api/message/${userId}`);
        if (data?.success) {
          setMessages(data.messages || []);
        } else {
          toast.error(data?.message || "Failed to fetch messages");
        }
      } catch (error) {
        toast.error(error?.message || "Failed to fetch messages");
      }
    },
    [axios]
  );

  // function to send message to selected user
  const sendMessage = useCallback(
    async (messageData) => {
      if (!selectedUser) {
        toast.error("No user selected");
        return;
      }
      if (!axios) {
        toast.error("HTTP client unavailable. Can't send message.");
        return;
      }

      try {
        const { data } = await axios.post(`/api/message/send/${selectedUser._id}`, messageData);
        if (data?.success) {
          setMessages((prev) => [...prev, data.newMessage]);
        } else {
          toast.error(data?.message || "Failed to send message");
        }
      } catch (error) {
        toast.error(error?.message || "Failed to send message");
      }
    },
    [selectedUser, axios]
  );

  // Socket message handler (named so we can remove it reliably)
  useEffect(() => {
    if (!socket) return;

    // named handler so we can remove exactly this listener
    const handleNewMessage = async (newMessage) => {
      try {
        // If the incoming message is from the currently opened conversation
        if (selectedUser && newMessage.senderId === selectedUser._id) {
          newMessage.seen = true;
          setMessages((prev) => [...prev, newMessage]);

          // Mark message as seen in backend (fire-and-forget)
          if (axios) {
            axios.put(`/api/message/mark/${newMessage._id}`).catch((err) => {
              // silent catch but log for debugging
              console.error("Failed to mark message seen:", err?.message || err);
            });
          }
        } else {
          // increment unseen count
          setUnseenMessages((prev) => ({
            ...prev,
            [newMessage.senderId]: prev[newMessage.senderId] ? prev[newMessage.senderId] + 1 : 1,
          }));
        }
      } catch (err) {
        console.error("Error processing incoming message:", err);
      }
    };

    socket.on("newMessage", handleNewMessage);

    // cleanup
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser, axios]);

  // expose API
  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setMessages,
    unseenMessages,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

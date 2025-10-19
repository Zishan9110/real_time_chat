import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/chatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");

  // Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  // Send image message
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollEnd.current && messages?.length > 0) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">

      {/* -------- Header -------- */}
      <div className="flex items-center gap-3 py-3 px-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers?.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden w-6 cursor-pointer"
        />
        <img src={assets.help_icon} alt="" className="hidden md:block w-5" />
      </div>

      {/* -------- Chat Messages -------- */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-28">
        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser?._id;
          return (
            <div
              key={index}
              className={`flex items-end mb-2 ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex items-end gap-2 max-w-[70%]">
                {!isSender && (
                  <img
                    src={selectedUser?.profilePic || assets.avatar_icon}
                    alt=""
                    className="w-7 h-7 rounded-full"
                  />
                )}

                <div
                  className={`p-2 rounded-lg break-words ${
                    isSender
                      ? "bg-purple-500/70 text-white rounded-br-none"
                      : "bg-gray-700/50 text-white rounded-bl-none"
                  }`}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="sent"
                      className="max-w-full rounded-lg mt-1"
                    />
                  )}
                  <p className="text-xs text-gray-300 mt-1 text-right">
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>

                {isSender && (
                  <img
                    src={authUser?.profilePic || assets.avatar_icon}
                    alt=""
                    className="w-7 h-7 rounded-full"
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* -------- Input Bar -------- */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-3 p-3 z-50 bg-black/30 backdrop-blur-md">
        <div className="flex-1 flex items-center bg-gray-100/10 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => (e.key === "Enter" ? handleSendMessage(e) : null)}
            type="text"
            placeholder="Type a message..."
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white bg-transparent placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 h-full max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16" alt="" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;

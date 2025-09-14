import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, Bot, User, RefreshCcw, Menu } from "lucide-react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatSessionId");
    if (saved) setSessionId(saved);
  }, []);

  useEffect(() => {
    if (sessionId) localStorage.setItem("chatSessionId", sessionId);
  }, [sessionId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMessage = { from: "user", text };
    setMessages((prev) => [...prev, newMessage]);
    setText("");
    setLoading(true);

    try {
      const res = await axios.post("https://rganewschatbot.onrender.com/chat", {
        sessionId,
        message: text,
      });

      const { answer, sessionId: newSessionId } = res.data;
      setSessionId(newSessionId);
      setMessages((prev) => [...prev, { from: "ai", text: answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "⚠️ Something went wrong. Try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem("chatSessionId");
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="font-bold text-lg flex items-center gap-2">
          <Bot className="w-6 h-6" /> AI News Assistant
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-80 bg-gray-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5 text-lg font-bold border-b border-gray-700 flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AI News Assistant
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          <button
            onClick={resetChat}
            className="w-full flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition"
          >
            <RefreshCcw className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="p-4 border-t border-gray-700 flex items-center justify-center text-gray-400 text-sm italic">
          Developed by{" "}
          <span className="font-semibold text-white ml-1">Harshit Soni</span>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-40"
        ></div>
      )}

      {/* Chat Panel */}
<div className="w-full h-screen flex flex-col bg-gray-100">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
          <div className="font-semibold text-lg">Chat</div>
          <button
            onClick={resetChat}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
          >
            <RefreshCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center text-gray-500 mt-20">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-500 text-white mb-4">
                <Bot className="w-8 h-8" />
              </div>
              <h2 className="font-semibold text-lg">Hello 👋</h2>
              <p className="mt-2 text-center text-gray-600">
                Ask about the latest news in technology, finance, sports, or
                world events.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className={`flex items-end gap-2 ${
                msg.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.from === "ai" && (
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500 text-white">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={`px-5 py-3 max-w-[70%] rounded-2xl ${
                  msg.from === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              {msg.from === "user" && (
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white">
                  <User className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 justify-start"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-5 py-3 bg-white border rounded-2xl rounded-bl-none flex gap-2 text-gray-600">
                <motion.span
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                />
                <motion.span
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                />
                <motion.span
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <form
          onSubmit={sendMessage}
          className="p-4 bg-white border-t border-gray-200 flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask about recent news..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 bg-indigo-600 text-white rounded-2xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

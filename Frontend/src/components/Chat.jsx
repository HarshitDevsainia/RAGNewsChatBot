import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, Bot, User } from "lucide-react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMessage = { from: "user", text };
    setMessages((prev) => [...prev, newMessage]);
    setText("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4000/chat", {
        sessionId,
        message: text,
      });

      const { answer, sessionId: newSessionId } = res.data;
      setSessionId(newSessionId); // keep session
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-gray-300/40">
      {/* Header */}
      <div className="sticky top-0 z-10 p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xl flex items-center gap-3 shadow-md">
        <Bot className="w-6 h-6" /> AI News Assistant
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-50 to-gray-100">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80 }}
            className={`flex items-end gap-2 ${
              msg.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.from === "ai" && (
              <Bot className="w-6 h-6 text-indigo-500 flex-shrink-0" />
            )}
            <div
              className={`px-4 py-3 max-w-[70%] rounded-2xl shadow-lg backdrop-blur-md ${
                msg.from === "user"
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-none"
                  : "bg-white/80 text-gray-800 border border-gray-200 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
            {msg.from === "user" && (
              <User className="w-6 h-6 text-indigo-600 flex-shrink-0" />
            )}
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 justify-start"
          >
            <Bot className="w-6 h-6 text-indigo-500 flex-shrink-0" />
            <div className="px-4 py-3 bg-white/80 border rounded-2xl rounded-bl-none shadow text-gray-600 flex gap-2">
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
        className="sticky bottom-0 p-4 bg-gradient-to-r from-white to-gray-50 border-t flex items-center gap-3"
      >
        <input
          type="text"
          className="flex-1 px-5 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-md shadow-sm"
          placeholder="Ask about recent news..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

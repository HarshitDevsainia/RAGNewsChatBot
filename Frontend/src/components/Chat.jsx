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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 rounded-[2rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-gray-300/30">
      {/* Header */}
      <div className="sticky top-0 z-10 p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold text-lg sm:text-xl flex items-center gap-3 shadow-lg">
        <Bot className="w-7 h-7 drop-shadow-lg" />
        AI News Assistant
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-50/80 to-gray-100/90 backdrop-blur-sm flex flex-col">
        {messages.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center text-gray-500"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Hello 👋</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              I’m your{" "}
              <span className="font-medium text-indigo-600">
                AI News Assistant
              </span>
              . Ask me about the latest updates in technology, finance, sports,
              or world events.
            </p>
            <div className="mt-4 text-sm text-gray-400 italic">
              Try: “What’s trending in tech today?”
            </div>
          </motion.div>
        ) : (
          messages.map((msg, i) => (
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
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div
                className={`px-5 py-3 text-[15px] leading-relaxed max-w-[70%] rounded-2xl shadow-md backdrop-blur-md ${
                  msg.from === "user"
                    ? "bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 text-white rounded-br-none"
                    : "bg-white/80 text-gray-800 border border-gray-200 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              {msg.from === "user" && (
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
                  <User className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))
        )}

        {/* Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 justify-start"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-5 py-3 bg-white/90 border rounded-2xl rounded-bl-none shadow text-gray-600 flex gap-2 backdrop-blur-md">
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
        className="sticky bottom-0 p-4 bg-gradient-to-r from-white/70 to-gray-50/70 backdrop-blur-md border-t flex items-center gap-3"
      >
        <input
          type="text"
          className="flex-1 px-5 py-3 rounded-2xl border border-gray-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/60 backdrop-blur-md shadow-sm text-[15px]"
          placeholder="Ask about recent news..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="p-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl text-white shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

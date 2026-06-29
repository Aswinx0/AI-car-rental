import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Chatbot = () => {
  const { axios } = useAppContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Ask me things like: \"I need a car for 5 people under ₹2000/day\"",
    },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const { data } = await axios.post("/api/chatbot/ask", { question });

      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
      } else {
        toast.error(data.message || "Something went wrong");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Sorry, I couldn't process that request." },
        ]);
      }
    } catch (error) {
      toast.error(error.message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, the chatbot is unavailable right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(100vw-3rem,380px)] h-[480px] bg-white border border-borderColor rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold">Car Rental Assistant</p>
              <p className="text-xs text-white/80">Powered by AI + your fleet data</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-white text-xl leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-light">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "ml-auto bg-primary text-white rounded-br-md"
                    : "mr-auto bg-white border border-borderColor text-gray-700 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white border border-borderColor text-gray-500 px-3 py-2 rounded-2xl rounded-bl-md text-sm">
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-borderColor bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cars..."
              className="flex-1 border border-borderColor rounded-full px-4 py-2 text-sm outline-none focus:border-primary"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary-dull disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary-dull text-white w-14 h-14 rounded-full shadow-lg text-2xl flex items-center justify-center"
        aria-label="Open chat assistant"
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
};

export default Chatbot;

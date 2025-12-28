import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';

const ChatInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hey! I'm your AI Party Planner. Need help with a budget or mix suggestions? 🥂" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, the music is too loud! I couldn't hear that. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* --- FLOATING TOGGLE BUTTON --- */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-black border border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.5)] flex items-center justify-center text-white hover:bg-pink-600 transition-colors group"
      >
        <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20" />
        {isOpen ? <X size={28} /> : <MessageCircle size={28} className="group-hover:animate-bounce" />}
      </motion.button>

      {/* --- CHAT WINDOW --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 right-6 z-50 w-[90vw] md:w-[400px] h-[500px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">Party <span className="text-pink-500">AI</span></h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online
                </p>
              </div>
              <Sparkles className="ml-auto text-yellow-400 opacity-50" />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`
                      max-w-[80%] p-3 rounded-2xl text-sm font-medium leading-relaxed
                      ${msg.role === 'user' 
                        ? 'bg-pink-600 text-white rounded-br-none shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                        : 'bg-white/10 text-slate-200 border border-white/5 rounded-bl-none'}
                    `}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for budget ideas..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 top-2 p-1.5 bg-pink-500 rounded-lg text-white hover:bg-pink-400 transition-colors shadow-lg"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatInterface;
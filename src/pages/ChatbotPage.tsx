import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hello! I am SAHAAY Chatbot. I can help you with app usage, local issue statistics, or general civic questions. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userRole: 'Citizen',
          locationContext: 'City'
        })
      });

      if (!response.ok) throw new Error('Chatbot failed');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.warn(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-[2rem] shadow-sm border border-sand overflow-hidden p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center text-white font-serif text-2xl">
          S
        </div>
        <div>
          <h2 className="font-serif text-2xl text-ink">SAHAAY Chatbot</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-canvas rounded-2xl">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user' ? 'bg-olive text-white rounded-tr-none' : 'bg-white border border-sand text-ink rounded-tl-none shadow-sm'}`}>
              <p className="text-sm italic leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="bg-white border border-sand rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-olive animate-spin" />
              <span className="text-sm italic text-ink/60 font-medium animate-pulse">SAHAAY is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4 mt-2">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your community or how to use the app..."
            className="flex-1 bg-canvas border border-sand focus:bg-white focus:border-olive focus:ring-1 focus:ring-olive rounded-xl px-4 py-3 text-sm italic transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-olive text-white rounded-xl px-5 flex items-center justify-center hover:bg-olive/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage, Coordinates, WalletItem } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface SmartAssistantProps {
  userLocation: Coordinates | null;
  walletItems: WalletItem[];
}

export const SmartAssistant: React.FC<SmartAssistantProps> = ({ userLocation, walletItems }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Benvenuto in SafeWallet Sagl. Sono qui per aiutarti a proteggere i tuoi beni. Posso localizzare il tuo portafoglio, analizzare zone sicure o fornirti assistenza tecnica.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass walletItems to the service
      const response = await sendChatMessage(input, userLocation || undefined, walletItems);
      
      const aiMsg: ChatMessage = {
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        groundingMetadata: response.groundingMetadata
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3 shadow-sm">
        <div className="bg-blue-50 p-2 rounded-lg">
           <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
           <h2 className="font-semibold text-slate-900">Assistente IA</h2>
           <p className="text-xs text-slate-500">Powered by Gemini & Google Maps</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Maps Grounding Display */}
              {msg.groundingMetadata?.groundingChunks?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                   <p className="text-xs font-semibold opacity-70 mb-2">Fonti verificate:</p>
                   {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                      if (chunk.web?.uri) {
                         return (
                            <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 p-2 rounded hover:bg-blue-100">
                               <MapPin className="w-3 h-3" />
                               {chunk.web.title || "Vedi su Mappa"}
                            </a>
                         )
                      }
                      return null;
                   })}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-sm border border-slate-200 flex items-center gap-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-slate-500 text-sm">Analisi richiesta in corso...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-1.5 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
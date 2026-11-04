import React, { useState, useRef, useEffect } from 'react';
import { db } from '../db';
import { Send, Bot, User, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { getApiKey, MODELS } from '../lib/ai';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AISearch() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hallo! Ich bin dein Wein-Sommelier. Frag mich nach Empfehlungen aus deiner Datenbank, z.B. "Welcher Wein passt gut zu Pasta mit Tomatensoße?" oder frag nach speziellen Essensempfehlungen für einen bestimmten Wein!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setError('Bitte hinterlege zuerst deinen KI-Schlüssel unter „Einstellungen“.');
        setIsLoading(false);
        return;
      }

      // Fetch all wines to build context
      const wines = await db.wines.toArray();
      const wineContext = wines.map(w => {
        return `- ${w.name} (${w.jahrgang || 'k.A.'}): ${w.farbe}, ${w.geschmacksnote}. Rebsorte: ${w.rebsorte}. Geruch: ${w.geruch?.join(', ')}. Geschmack: ${w.geschmack?.join(', ')}. Note Kirsten: ${w.noteKirsten}, Note Torsten: ${w.noteTorsten}. Besonderheiten: ${w.besonderheiten}.`;
      }).join('\n');

      const systemPrompt = `Du bist ein hilfreicher Wein-Sommelier. Du hast Zugriff auf die private Wein-Datenbank des Nutzers. 
Basierend auf der folgenden Liste von Weinen, beantworte die Fragen des Nutzers und gib Empfehlungen.
Wenn du konkrete Essensempfehlungen oder Weinbegleitungen vorschlägst, beziehe dich explizit auf die Charakteristika des Weins (z.B. Rebsorte, Farbe, Geschmacksnoten, Geruch und besondere Eigenschaften).
Wenn ein Wein aus der Datenbank gut passt, nenne seinen Namen und erkläre kurz, warum (basierend auf den Noten, Geschmack, etc.). Erkläre insbesondere, warum er gut zu bestimmten Speisen passt.
Sei freundlich, präzise und formatiere deine Antwort übersichtlich (z.B. mit Bulletpoints).

Hier ist die Wein-Datenbank:
${wineContext || 'Die Datenbank ist noch leer.'}`;

      const ai = new GoogleGenAI({ apiKey });
      
      // Convert messages to Gemini format
      const geminiMessages = messages.map(m => `${m.role === 'user' ? 'Nutzer' : 'Assistent'}: ${m.content}`).join('\n\n');
      const prompt = `${systemPrompt}\n\nBisheriger Chatverlauf:\n${geminiMessages}\n\nNutzer: ${userMsg}\nAssistent:`;

      const response = await ai.models.generateContent({
        model: MODELS.text,
        contents: prompt,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Keine Antwort erhalten.' }]);
    } catch (err: any) {
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold">KI-Sommelier</h1>
      </div>

      <div className="flex-1 bg-white border border-[#e9e9e7] rounded-lg overflow-hidden flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#37352f] text-white' : 'bg-purple-100 text-purple-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-[#f7f7f5] text-[#37352f]' : 'bg-white border border-[#e9e9e7] text-[#37352f] whitespace-pre-wrap'}`}>
                <div className="markdown-body prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#e9e9e7] rounded-2xl px-4 py-3 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#e9e9e7] bg-[#f7f7f5]">
          {error && (
            <div className="mb-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Frag nach einer Weinempfehlung..."
              className="flex-1 p-3 bg-white border border-[#e9e9e7] focus:border-[#d4d4d2] rounded-full text-sm outline-none shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-12 h-12 rounded-full bg-[#37352f] text-white flex items-center justify-center shrink-0 hover:bg-[#2f2d28] transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

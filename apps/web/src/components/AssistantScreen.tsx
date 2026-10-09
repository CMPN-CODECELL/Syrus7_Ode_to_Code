import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  Info,
  Sprout
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { AssistResponse } from '../types';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  audioText?: string;
}

interface AssistantScreenProps {
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
  labels: Record<string, string>;
  onPlayVoice: (text: string) => void;
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  language,
  labels,
  onPlayVoice
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: language === 'mr-IN'
        ? 'नमस्कार! मी कृषिनिर्णय कृषी मित्र (AI Expert) आहे. टोमॅटो, कांदा किंवा इतर पिकांच्या बाजारभावाबद्दल आणि विक्री निर्णयाबद्दल काहीही विचारा.'
        : language === 'hi-IN'
        ? 'नमस्ते! मैं कृषिनिर्णय कृषि मित्र (AI Expert) हूँ। टमाटर, प्याज या अन्य फसलों के मंडी भाव और बिक्री निर्णय के बारे में कुछ भी पूछें।'
        : 'Hello! I am your KrishiNirnay AI Expert. Ask me anything about mandi prices, optimal sell decisions, or transport costs.',
      timestamp: 'Just now'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const quickPrompts = language === 'mr-IN'
    ? [
        'टोमॅटो २ दिवस थांबल्यास किती निव्वळ नफा होईल?',
        'नाशिक बाजार समितीचे आजचे भाव काय आहेत?',
        'वाहतूक आणि नासाडी खर्च किती वजा होईल?',
        'स्थानिक बाजारात किमान आरक्षण भाव काय ठेवावा?'
      ]
    : language === 'hi-IN'
    ? [
        'टमाटर 2 दिन रुकने पर कितना शुद्ध मुनाफा होगा?',
        'नासिक मंडी का आज का औसत भाव क्या है?',
        'ढुलाई और खराबी का खर्च कितना कटेगा?',
        'न्यूनतम आरक्षण भाव क्या तय करना चाहिए?'
      ]
    : [
        'What is the net profit if I wait 2 days for tomato?',
        'What are today’s modal prices in Nashik APMC?',
        'How much will transport and spoilage cost?',
        'What minimum reservation price should I accept?'
      ];

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const resp: AssistResponse = await ApiClient.assist({
        session_id: 'session-screen-chat',
        message: text,
        language: language,
        input_mode: 'text'
      });

      const replyText = resp.spoken_summary || resp.decision_record?.explanation.spoken_summary || 'Analysis complete.';

      const botMsg: Message = {
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioText: replyText
      };

      setMessages((prev) => [...prev, botMsg]);
      onPlayVoice(replyText);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: language === 'mr-IN'
            ? 'माफ करा, सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.'
            : language === 'hi-IN'
            ? 'क्षमा करें, सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।'
            : 'Sorry, could not connect to server. Please try again.',
          timestamp: 'Now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      handleSend(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col h-[78vh] min-h-[580px]">
      {/* 1. Expert Profile Header (Screen 9 in Mockup) */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-green-700 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 text-2xl">
              👨‍🌾
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-emerald-900 rounded-full animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black font-serif">
                {language === 'mr-IN' ? 'डॉ. इम्रान सिद्दीकी / कृषी मित्र' : language === 'hi-IN' ? 'डॉ. इमरान सिद्दीकी / कृषि मित्र' : 'Dr. Imran Siddiqui / Krishi Mitra'}
              </h2>
              <span className="bg-emerald-900/60 text-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-600/50">
                4.9 ★ Verified
              </span>
            </div>
            <p className="text-xs text-emerald-100 font-medium">
              {language === 'mr-IN' ? 'वरिष्ठ कृषी व बाजार अर्थतज्ज्ञ • ऑनलाइन' : language === 'hi-IN' ? 'वरिष्ठ कृषि व मंडी अर्थशास्त्री • ऑनलाइन' : 'Senior Agricultural Decision Expert • Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPlayVoice(messages[messages.length - 1]?.text || '')}
            className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white transition active:scale-95"
            title="Read out last reply"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Chat Message Thread */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAF8]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 text-sm shadow-xs mt-1">
                <Sprout className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-3xl text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-emerald-700 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-emerald-100 rounded-bl-xs'
              }`}
            >
              <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
              
              <div className={`flex items-center justify-between gap-3 mt-2 pt-1 border-t text-[10px] ${
                msg.sender === 'user' ? 'border-white/20 text-emerald-200' : 'border-slate-100 text-slate-400'
              }`}>
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && msg.audioText && (
                  <button
                    onClick={() => onPlayVoice(msg.audioText!)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{labels.listen || 'Listen'}</span>
                  </button>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 text-sm shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold p-2 bg-white rounded-2xl w-fit border border-emerald-100 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>कृषिनिर्णय विश्लेषण चालू आहे...</span>
          </div>
        )}
      </div>

      {/* 3. Quick Suggestion Chips */}
      <div className="p-2 sm:p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-black uppercase text-slate-400 pl-2 whitespace-nowrap">
          {language === 'mr-IN' ? 'झटपट प्रश्न:' : language === 'hi-IN' ? 'त्वरित प्रश्न:' : 'Quick Prompts:'}
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold whitespace-nowrap transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 4. Input Bar with Microphone & Send */}
      <div className="p-3 sm:p-4 bg-white border-t border-emerald-100 flex items-center gap-2">
        <button
          onClick={startVoiceInput}
          className={`p-3 rounded-2xl transition active:scale-95 flex-shrink-0 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          }`}
          title={isListening ? 'Listening...' : 'Hold or click to speak'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder={labels.askQuestion || 'Ask your question or speak...'}
          className="flex-1 py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputMessage.trim() || loading}
          className="p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition active:scale-95 shadow-md shadow-emerald-700/20 flex-shrink-0"
          title="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

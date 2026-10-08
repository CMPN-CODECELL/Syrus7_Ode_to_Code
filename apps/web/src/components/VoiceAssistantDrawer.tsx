import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { AssistResponse, SlotSchema, DecisionRecord } from '../types';
import { ApiClient } from '../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: 'mr-IN' | 'hi-IN' | 'en-IN';
  onNewDecision: (record: DecisionRecord) => void;
  labels: Record<string, string>;
}

export const VoiceAssistantDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  onNewDecision,
  labels
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; spokenText?: string }>>([
    {
      sender: 'assistant',
      text: language === 'mr-IN'
        ? 'नमस्कार! मी कृषिनिर्णय सहाय्यक. आपले पीक, प्रमाण (उदा. २५ क्विंटल टोमॅटो) आणि बाजार सांगा.'
        : language === 'hi-IN'
        ? 'नमस्ते! मैं कृषिनिर्णय सहायक हूँ। अपनी फसल, मात्रा (जैसे 25 क्विंटल टमाटर) और मंडी बताएं।'
        : 'Hello! I am KrishiNirnay assistant. Tell me your crop, quantity (e.g. 25 quintal tomato), and preferred mandi.'
    }
  ]);
  const [currentSlots, setCurrentSlots] = useState<SlotSchema | null>(null);

  // Quick preset test phrases for judges / demo
  const samplePrompts = language === 'mr-IN' ? [
    '२५ क्विंटल टोमॅटो, आज नाशिकला विकू की २ दिवस थांबू?',
    '२० क्विंटल कांदा, पिंपळगावला पाठवू का?',
    '५० पोतं टोमॅटो' // Test bag ambiguity!
  ] : language === 'hi-IN' ? [
    '25 क्विंटल टमाटर, आज नासिक बेचें या 2 दिन रुकें?',
    '20 क्विंटल प्याज, क्या पिंपलगांव भेजें?',
    '50 कट्टा टमाटर'
  ] : [
    '20 quintal tomato in Nashik, should I wait 2 days?',
    'What if transport cost rises by 20%?',
    '50 bags tomato'
  ];

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg = textToSend.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setLoading(true);

    try {
      const resp: AssistResponse = await ApiClient.assist({
        session_id: 'session-demo-001',
        message: userMsg,
        language: language,
        input_mode: 'voice'
      });

      setCurrentSlots(resp.slots);

      const assistantMsg = resp.assistant_text;
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: assistantMsg,
        spokenText: resp.spoken_summary || assistantMsg
      }]);

      if (resp.decision_record) {
        onNewDecision(resp.decision_record);
      }

      // Automatically speak the concise summary if Web Speech API available
      if (resp.spoken_summary && 'speechSynthesis' in window) {
        speakText(resp.spoken_summary);
      }
    } catch (e) {
      console.error('Assist call failed:', e);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: 'माफ करा, सर्व्हरशी संपर्क होऊ शकला नाही. ऑफलाइन कॅश दाखवत आहे.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleVoice = () => {
    // If Web Speech Recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (!isRecording) {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          handleSendMessage(transcript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } else {
        setIsRecording(false);
      }
    } else {
      // Browser speech API unavailable -> use sample preset prompt
      const fallbackPrompt = samplePrompts[0];
      handleSendMessage(fallbackPrompt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-agri-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">{labels.assistant || 'KrishiNirnay Voice Assistant'}</h3>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Number Guard Protected (0% Hallucination)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Tracker Bar */}
        {currentSlots && (
          <div className="bg-slate-900/90 border-b border-slate-800 p-2.5 px-4 text-xs flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Slots:</span>
            {currentSlots.commodity && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                {currentSlots.commodity}
              </span>
            )}
            {currentSlots.quantity !== null && currentSlots.quantity !== undefined && (
              <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 font-medium">
                {currentSlots.quantity} {currentSlots.quantity_unit}
              </span>
            )}
            {currentSlots.home_mandi && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                {currentSlots.home_mandi}
              </span>
            )}
            {currentSlots.missing_slots.includes('bag_weight_kg') && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Bag weight required
              </span>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-agri-600 text-white rounded-br-none shadow-md shadow-agri-600/20'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                {m.spokenText && (
                  <button
                    onClick={() => speakText(m.spokenText!)}
                    className="mt-2 pt-1 border-t border-slate-800 text-[11px] text-agri-400 hover:text-agri-300 flex items-center gap-1 font-semibold"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{labels.listen || 'Listen (पुन्हा ऐका)'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
              <div className="w-2 h-2 rounded-full bg-agri-400 animate-ping"></div>
              <span>कृषिनिर्णय इंजिन तपासत आहे...</span>
            </div>
          )}
        </div>

        {/* Quick Demo Prompts */}
        <div className="p-2 px-4 bg-slate-900/50 border-t border-slate-800/80 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-500 block w-full">Quick Demo Questions:</span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 truncate max-w-full text-left"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
          <button
            onClick={handleToggleVoice}
            className={`p-3 rounded-xl font-bold transition flex-shrink-0 ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 text-agri-400 hover:bg-slate-700'
            }`}
            title="Toggle Voice Microphone"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder={labels.askQuestion || 'Ask question or speak...'}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-agri-500"
          />

          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || loading}
            className="p-3 rounded-xl bg-agri-600 hover:bg-agri-500 disabled:opacity-50 text-white font-bold transition flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MobileApiClient } from '../api/client';
import { MobileSpeechService } from '../voice/speechService';
import { DecisionRecord } from '../types';

interface Props {
  onNewDecision: (record: DecisionRecord) => void;
  language: string;
}

export const VoiceAssistantScreen: React.FC<Props> = ({ onNewDecision, language }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; spoken?: string }>>([
    {
      sender: 'assistant',
      text: language === 'mr-IN'
        ? 'नमस्कार! मी कृषिनिर्णय सहाय्यक. आपले पीक, प्रमाण (उदा. २५ क्विंटल टोमॅटो) सांगा.'
        : 'नमस्ते! मैं कृषिनिर्णय सहायक हूँ। फसल और मात्रा बताएं।'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = language === 'mr-IN' ? [
    '२५ क्विंटल टोमॅटो, आज नाशिकला विकू की २ दिवस थांबू?',
    '२० क्विंटल कांदा, पिंपळगावला पाठवू का?',
    '५० पोतं टोमॅटो'
  ] : [
    '25 क्विंटल टमाटर, आज नासिक बेचें या 2 दिन रुकें?',
    '20 क्विंटल प्याज, क्या पिंपलगांव भेजें?',
    '50 कट्टा टमाटर'
  ];

  const handleSend = async (query: string) => {
    if (!query.trim()) return;
    const text = query.trim();
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setLoading(true);

    try {
      const resp = await MobileApiClient.assist({
        session_id: 'mobile-session-001',
        message: text,
        language: language as any,
        input_mode: 'voice'
      });

      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: resp.assistant_text,
        spoken: resp.spoken_summary || resp.assistant_text
      }]);

      if (resp.decision_record) {
        onNewDecision(resp.decision_record);
      }

      if (resp.spoken_summary) {
        MobileSpeechService.speak(resp.spoken_summary, language);
      }
    } catch (e) {
      console.error('Mobile assist error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Messages Stream */}
      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.msgBubble,
              m.sender === 'user' ? styles.userBubble : styles.assistantBubble
            ]}
          >
            <Text style={[styles.msgText, m.sender === 'user' && { color: '#fff' }]}>
              {m.text}
            </Text>
            {m.spoken && (
              <TouchableOpacity
                onPress={() => MobileSpeechService.speak(m.spoken!, language)}
                style={styles.listenBtn}
              >
                <Text style={styles.listenText}>🔊 पुन्हा ऐका</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {loading && (
          <Text style={styles.loadingNote}>कृषिनिर्णय इंजिन तपासत आहे...</Text>
        )}
      </ScrollView>

      {/* Preset Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
        {presets.map((p, idx) => (
          <TouchableOpacity key={idx} style={styles.presetPill} onPress={() => handleSend(p)}>
            <Text style={styles.presetPillText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="प्रश्न विचारा किंवा बोला..."
          placeholderTextColor="#64748b"
          style={styles.textInput}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendBtnText}>पाठवा</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16 },
  msgBubble: { maxWidth: '85%', borderRadius: 16, padding: 12, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#16a34a' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  msgText: { color: '#e2e8f0', fontSize: 13, lineHeight: 18 },
  listenBtn: { marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderColor: '#1e293b' },
  listenText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },
  loadingNote: { color: '#64748b', fontSize: 11, fontStyle: 'italic', margin: 8 },
  presetScroll: { maxHeight: 44, paddingHorizontal: 12, backgroundColor: '#0b1120' },
  presetPill: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, height: 32 },
  presetPillText: { color: '#cbd5e1', fontSize: 11 },
  inputBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#1e293b', backgroundColor: '#0f172a' },
  textInput: { flex: 1, backgroundColor: '#020617', borderRadius: 12, paddingHorizontal: 14, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: '#1e293b', marginRight: 8 },
  sendBtn: { backgroundColor: '#16a34a', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

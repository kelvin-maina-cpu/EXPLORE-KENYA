import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api, { getCachedApiData } from '../../services/api';
import { useLocale } from '../../context/LocalizationContext';
import { useTheme } from '../../context/ThemeContext';

export default function ChatbotScreen() {
  const { t } = useLocale();
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await getCachedApiData('/chatbot/knowledge', {
          policy: 'cache-first',
          ttlMs: 24 * 60 * 60 * 1000,
        });
        const prompts = Array.isArray(response.data) ? response.data.slice(0, 4).map((item) => item.question) : [];
        setSuggestions(prompts);
      } catch (error) {
        console.error('Chatbot knowledge load error:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    void loadSuggestions();
  }, []);

  const askQuestion = async (questionText) => {
    if (!questionText.trim()) {
      return;
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: questionText.trim(),
    };

    setMessages((current) => [...current, userMessage]);
    setMessage('');
    setSending(true);

    try {
      const response = await api.post('/chatbot/ask', { message: questionText.trim() });
      const botMessage = {
        id: `${Date.now()}-bot`,
        role: 'bot',
        text: response.data?.answer || t('chatbot_no_response'),
        matchedQuestion: response.data?.matchedQuestion || '',
      };

      setMessages((current) => [...current, botMessage]);
      if (Array.isArray(response.data?.suggestions) && response.data.suggestions.length) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'bot',
          text: error.response?.data?.message || t('chatbot_unavailable'),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.screen }]}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === 'user'
                ? [styles.userBubble, { backgroundColor: theme.colors.primary }]
                : [styles.botBubble, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }],
            ]}
          >
            {item.matchedQuestion ? <Text style={[styles.matchLabel, { color: theme.colors.textMuted }]}>{item.matchedQuestion}</Text> : null}
            <Text style={[styles.messageText, { color: theme.colors.text }, item.role === 'user' && [styles.userText, { color: theme.colors.primaryText }]]}>{item.text}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={[styles.heroCard, { backgroundColor: theme.colors.hero }]}>
              <Text style={[styles.eyebrow, { color: theme.colors.heroEyebrow }]}>{t('chatbot')}</Text>
              <Text style={[styles.title, { color: theme.colors.heroText }]}>{t('chatbot_title')}</Text>
              <Text style={[styles.copy, { color: theme.colors.heroMuted }]}>{t('chatbot_copy')}</Text>
            </View>

            <View style={[styles.suggestionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.suggestionTitle, { color: theme.colors.text }]}>{t('faq')}</Text>
              {loadingSuggestions ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <View style={styles.suggestionList}>
                  {suggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={[styles.suggestionChip, { backgroundColor: theme.colors.screen, borderColor: theme.colors.border }]}
                      onPress={() => askQuestion(suggestion)}
                    >
                      <Text style={[styles.suggestionText, { color: theme.colors.text }]}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.composerBar, { backgroundColor: theme.colors.cardSoft, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.borderSoft, backgroundColor: theme.colors.card, color: theme.colors.inputText }]}
          placeholder={t('type_message')}
          placeholderTextColor={theme.colors.placeholder}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.colors.primary }]} onPress={() => askQuestion(message)} disabled={sending}>
          <Ionicons name="send" size={18} color={theme.colors.primaryText} />
          <Text style={[styles.sendText, { color: theme.colors.primaryText }]}>{sending ? t('loading') : t('send')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F1E8',
  },
  content: {
    padding: 18,
    paddingBottom: 18,
    gap: 12,
  },
  headerWrap: {
    gap: 14,
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: '#173457',
    borderRadius: 28,
    padding: 24,
  },
  eyebrow: {
    color: '#C8D7EC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  copy: {
    marginTop: 10,
    color: '#D4DDEC',
    fontSize: 15,
    lineHeight: 23,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 16,
    gap: 10,
  },
  suggestionTitle: {
    color: '#1D2D45',
    fontSize: 16,
    fontWeight: '800',
  },
  suggestionList: {
    gap: 8,
  },
  suggestionChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F7F1E8',
  },
  suggestionText: {
    color: '#1D2D45',
    fontSize: 14,
    lineHeight: 20,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    maxWidth: '88%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#264E86',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EA',
  },
  matchLabel: {
    color: '#66707C',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '700',
  },
  messageText: {
    color: '#1D2D45',
    fontSize: 14,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
  },
  composerBar: {
    padding: 18,
    backgroundColor: '#FFFDF9',
    borderTopWidth: 1,
    borderTopColor: '#D9E0EA',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#264E86',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

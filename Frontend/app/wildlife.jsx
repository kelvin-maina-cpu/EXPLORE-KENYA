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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useLocale } from '../context/LocalizationContext';
import { useTheme } from '../context/ThemeContext';

export default function WildlifeScreen() {
  const { search: initialSearchParam } = useLocalSearchParams();
  const initialSearch = Array.isArray(initialSearchParam) ? initialSearchParam[0] || '' : initialSearchParam || '';
  const [search, setSearch] = useState(initialSearch);
  const [wildlife, setWildlife] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useLocale();
  const { theme } = useTheme();

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const loadWildlife = async () => {
      setLoading(true);
      try {
        const response = await api.get('/wildlife', {
          params: { search: search.trim() || undefined },
        });
        setWildlife(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Wildlife load error:', error);
        setWildlife([]);
      } finally {
        setLoading(false);
      }
    };

    void loadWildlife();
  }, [search]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.screen }]}>
      <FlatList
        data={wildlife}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{item.speciesName}</Text>
            <Text style={[styles.region, { color: theme.colors.secondary }]}>{item.region}</Text>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>{t('wildlife_habitat')}</Text>
            <Text style={[styles.copy, { color: theme.colors.textSoft }]}>{item.habitat}</Text>
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>{t('wildlife_conservation')}</Text>
            <Text style={[styles.copy, { color: theme.colors.textSoft }]}>{item.conservationInfo}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={[styles.heroCard, { backgroundColor: theme.colors.hero }]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color={theme.colors.heroText} />
              </TouchableOpacity>
              <Text style={[styles.eyebrow, { color: theme.colors.heroEyebrow }]}>{t('wildlife_library')}</Text>
              <Text style={[styles.heroTitle, { color: theme.colors.heroText }]}>{t('wildlife_title')}</Text>
              <Text style={[styles.heroCopy, { color: theme.colors.heroMuted }]}>{t('wildlife_copy_2')}</Text>
            </View>

            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.inputText }]}
              value={search}
              onChangeText={setSearch}
              placeholder={t('wildlife_search_placeholder')}
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.loadingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : null}
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>{loading ? t('loading') : t('wildlife_empty')}</Text>
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 28,
    gap: 12,
  },
  headerWrap: {
    gap: 14,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: '#173457',
    borderRadius: 28,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    color: '#C8D7EC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  heroCopy: {
    marginTop: 10,
    color: '#D4DDEC',
    fontSize: 15,
    lineHeight: 23,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0EA',
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 18,
    gap: 6,
    marginBottom: 12,
  },
  title: {
    color: '#1D2D45',
    fontSize: 21,
    fontWeight: '900',
  },
  region: {
    color: '#24654B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#66707C',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  copy: {
    color: '#566170',
    fontSize: 14,
    lineHeight: 21,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#66707C',
    fontSize: 15,
    textAlign: 'center',
  },
});

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../context/LocalizationContext';
import { getAttractions } from '../services/api';

const CATEGORY_ICONS = {
  wildlife: '\u{1F981}',
  culture: '\u{1F3DB}\uFE0F',
  cultural: '\u{1F3DB}\uFE0F',
  adventure: '\u{1F9D7}',
  beach: '\u{1F3D6}\uFE0F',
  history: '\u{1F3F0}',
  historical: '\u{1F3F0}',
};

const FILTERS = ['all', 'wildlife', 'culture', 'cultural', 'adventure', 'beach', 'history', 'historical'];

export default function AttractionsCatalog() {
  const router = useRouter();
  const { t } = useLocale();
  const [attractions, setAttractions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        const data = await getAttractions();
        setAttractions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Attractions load error:', error);
        setAttractions([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchAttractions();
  }, []);

  const filtered = useMemo(() => {
    let results = attractions;

    if (activeFilter !== 'all') {
      const aliases =
        activeFilter === 'culture'
          ? new Set(['culture', 'cultural'])
          : activeFilter === 'history'
            ? new Set(['history', 'historical'])
            : new Set([activeFilter]);

      results = results.filter((item) => aliases.has((item.category || '').toLowerCase()));
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      results = results.filter((item) => item.name?.toLowerCase().includes(query));
    }

    return results;
  }, [activeFilter, attractions, search]);

  const formatFilterLabel = (value) => {
    const key = `category_${value}`;
    const translated = t(key);
    return translated === key ? value.charAt(0).toUpperCase() + value.slice(1) : translated;
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/attraction/${item._id}`)}>
      <View style={styles.cardImg}>
        <Text style={styles.cardEmoji}>{CATEGORY_ICONS[(item.category || '').toLowerCase()] || '\u{1F33F}'}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{formatFilterLabel((item.category || 'wildlife').toLowerCase())}</Text>
          </View>
          <Text style={styles.viewMore}>{t('catalog_view_more')} {'->'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('catalog_greeting')} {'\u{1F44B}'}</Text>
          <Text style={styles.headerTitle}>Explore Kenya</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/bookings')}>
          <Text style={styles.profileEmoji}>{'\u{1F4CB}'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>{'\u{1F50D}'}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('catalog_search_placeholder')}
          placeholderTextColor="#999999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filtersWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filter, activeFilter === item && styles.filterActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {formatFilterLabel(item)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0F6E56" style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t('catalog_empty')}</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFE',
  },
  header: {
    backgroundColor: '#0F6E56',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  profileBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: {
    fontSize: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#1A1A1A',
  },
  filtersWrap: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  filterActive: {
    backgroundColor: '#0F6E56',
    borderColor: '#0F6E56',
  },
  filterText: {
    fontSize: 13,
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  cardImg: {
    backgroundColor: '#E1F5EE',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 48,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#E1F5EE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: '#0F6E56',
  },
  viewMore: {
    fontSize: 13,
    color: '#0F6E56',
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    color: '#999999',
    marginTop: 40,
    fontSize: 15,
  },
});

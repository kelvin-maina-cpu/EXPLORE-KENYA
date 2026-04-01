import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useLocale } from '../context/LocalizationContext';

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const capabilities = [
    { title: t('about_capability_explore_title'), copy: t('about_capability_explore_copy') },
    { title: t('about_capability_book_title'), copy: t('about_capability_book_copy') },
    { title: t('about_capability_live_title'), copy: t('about_capability_live_copy') },
    { title: t('about_capability_tools_title'), copy: t('about_capability_tools_copy') },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{t('about_eyebrow')}</Text>
          <Text style={styles.title}>{t('about_title')}</Text>
          <Text style={styles.copy}>{t('about_copy')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about_section_title')}</Text>
          <Text style={styles.sectionCopy}>{t('about_section_copy')}</Text>
        </View>

        <View style={styles.grid}>
          {capabilities.map((item) => (
            <View key={item.title} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCopy}>{item.copy}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about_key_capabilities_title')}</Text>
          <Text style={styles.bullet}>{t('about_bullet_one')}</Text>
          <Text style={styles.bullet}>{t('about_bullet_two')}</Text>
          <Text style={styles.bullet}>{t('about_bullet_three')}</Text>
          <Text style={styles.bullet}>{t('about_bullet_four')}</Text>
          <Text style={styles.bullet}>{t('about_bullet_five')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1511',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B1511',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#133228',
  },
  backButtonText: {
    color: '#E7F7EF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#12936F',
    borderRadius: 28,
    padding: 22,
    gap: 12,
  },
  eyebrow: {
    color: '#E6FFF6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  copy: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    backgroundColor: '#121F1A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E352D',
    gap: 10,
  },
  sectionTitle: {
    color: '#F2F7F4',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCopy: {
    color: '#BFD0C8',
    fontSize: 14,
    lineHeight: 22,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#182720',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#274036',
    gap: 8,
  },
  cardTitle: {
    color: '#F1F8F5',
    fontSize: 16,
    fontWeight: '800',
  },
  cardCopy: {
    color: '#C0D1C9',
    fontSize: 14,
    lineHeight: 21,
  },
  bullet: {
    color: '#D8E6DF',
    fontSize: 14,
    lineHeight: 22,
  },
});

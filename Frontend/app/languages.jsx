import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AVAILABLE_LANGUAGES, useLocale } from '../context/LocalizationContext';

const LANGUAGE_PREVIEWS = {
  en: 'Welcome to Explore Kenya',
  sw: 'Karibu Explore Kenya',
  fr: 'Bienvenue sur Explore Kenya',
  es: 'Bienvenido a Explore Kenya',
  de: 'Willkommen bei Explore Kenya',
  zh: '欢迎来到 Explore Kenya',
  ar: 'مرحبا بك في Explore Kenya',
};

export default function LanguagesScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLocale();

  const handleSelectLanguage = async (code) => {
    await setLanguage(code);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('languages_support_eyebrow')}</Text>
          <Text style={styles.title}>{t('languages_title')}</Text>
          <Text style={styles.copy}>
            {t('languages_copy')}
          </Text>
        </View>

        <View style={styles.grid}>
          {AVAILABLE_LANGUAGES.map((item) => {
            const selected = item.code === language;

            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.card, selected && styles.cardActive]}
                onPress={() => {
                  void handleSelectLanguage(item.code);
                }}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.cardCode, selected && styles.cardCodeActive]}>{item.code.toUpperCase()}</Text>
                  {selected ? <Text style={styles.selectedTag}>{t('selected')}</Text> : null}
                </View>
                <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>{item.label}</Text>
                <Text style={[styles.cardPreview, selected && styles.cardPreviewActive]}>
                  {LANGUAGE_PREVIEWS[item.code] || item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08130F',
  },
  container: {
    flex: 1,
    backgroundColor: '#08130F',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#133228',
  },
  backButtonText: {
    color: '#E7F7EF',
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    borderRadius: 28,
    backgroundColor: '#12936F',
    padding: 22,
    gap: 12,
  },
  eyebrow: {
    color: '#E7FFF6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
  },
  copy: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    gap: 14,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#13201B',
    borderWidth: 1,
    borderColor: '#233B31',
    padding: 18,
    gap: 8,
  },
  cardActive: {
    backgroundColor: '#173F32',
    borderColor: '#2BC08D',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCode: {
    color: '#7ADBB7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardCodeActive: {
    color: '#DFFFF2',
  },
  selectedTag: {
    color: '#DFFFF2',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#F1F8F4',
    fontSize: 20,
    fontWeight: '800',
  },
  cardTitleActive: {
    color: '#FFFFFF',
  },
  cardPreview: {
    color: '#BFD0C8',
    fontSize: 14,
    lineHeight: 21,
  },
  cardPreviewActive: {
    color: '#E8FFF5',
  },
});

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocalizationContext';
import { getAttractions } from '../services/api';

const FEATURE_CARDS = [
  {
    key: 'navigation',
    icon: '🗺️',
    title: 'GPS navigation',
    copy: 'Real-time maps to every attraction across Kenya.',
  },
  {
    key: 'mpesa',
    icon: '💱',
    title: 'M-Pesa booking',
    copy: 'Pay instantly with M-Pesa STK push.',
  },
  {
    key: 'live',
    icon: '📹',
    title: 'Live streaming',
    copy: 'Watch wildlife live from any park.',
  },
  {
    key: 'swahili',
    icon: '🌍',
    title: 'Swahili support',
    copy: 'Full English and Swahili language support.',
  },
];

const PACKAGE_OPTIONS = ['Day trip', 'Weekend', 'Family', 'Premium'];

export default function LandingShowcase({ withinTabs = false }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [travelDate, setTravelDate] = useState('');
  const [visitors, setVisitors] = useState('2');
  const [selectedPackage, setSelectedPackage] = useState(PACKAGE_OPTIONS[0]);
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const featureCards = useMemo(
    () => [
      { ...FEATURE_CARDS[0], title: t('landing_feature_navigation_title'), copy: t('landing_feature_navigation_copy') },
      { ...FEATURE_CARDS[1], title: t('landing_feature_mpesa_title'), copy: t('landing_feature_mpesa_copy') },
      { ...FEATURE_CARDS[2], title: t('landing_feature_live_title'), copy: t('landing_feature_live_copy') },
      { ...FEATURE_CARDS[3], title: t('landing_feature_language_title'), copy: t('landing_feature_language_copy') },
    ],
    [t]
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [glowAnimation]);

  const requireAuthAndPush = (target) => {
    if (isAuthenticated) {
      router.push(target);
      return;
    }

    router.push('/login');
  };

  const exploreTarget = withinTabs ? '/(tabs)/attractions' : '/(tabs)';
  const handleAbout = () => {
    if (withinTabs) {
      requireAuthAndPush('/(tabs)/profile');
      return;
    }

    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, withinTabs && styles.contentWithTabs]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroShell}>
          <Animated.View style={[styles.heroGlowLarge, styles.heroGlowOne]} />
          <Animated.View style={[styles.heroGlowSmall, styles.heroGlowTwo]} />

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{t('landing_badge')}</Text>
          </View>

          <Text style={styles.heroTitle}>{t('landing_title')}</Text>
          <Text style={styles.heroCopy}>{t('landing_copy')}</Text>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => requireAuthAndPush(exploreTarget)}>
              <Text style={styles.primaryButtonText}>{t('landing_explore')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => requireAuthAndPush('/(tabs)/live')}>
              <Text style={styles.secondaryButtonText}>{t('landing_watch_live')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.animalRow}>
            {['🦁', '🦓', '🦒', '🦏', '🐘'].map((animal) => (
              <View key={animal} style={styles.animalBubble}>
                <Text style={styles.animalEmoji}>{animal}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { value: '20+', label: t('landing_stat_parks') },
            { value: '10K+', label: t('landing_stat_visitors') },
            { value: '4.9⭐', label: t('landing_stat_rating') },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>{t('landing_ready_label')}</Text>
          <Text style={styles.sectionTitle}>{t('landing_ready_title')}</Text>
          <Text style={styles.sectionCopy}>{t('landing_ready_copy')}</Text>
        </View>

        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => requireAuthAndPush(exploreTarget)}
        >
          <Text style={styles.exploreBtnIcon}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.exploreBtnTitle}>{t('landing_explore_title')}</Text>
            <Text style={styles.exploreBtnSub}>{t('landing_explore_copy')}</Text>
          </View>
          <Text style={styles.exploreBtnArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.featuresGrid}>
          {featureCards.map((feature) => (
            <View key={feature.key} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureCopy}>{feature.copy}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bookingCard}>
          <Text style={styles.bookingTitle}>{t('landing_booking_title')}</Text>
          <TouchableOpacity style={styles.bookingButton} onPress={handleAbout}>
            <Text style={styles.bookingButtonText}>{t('landing_booking_cta')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Explore Kenya</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={handleAbout}>
              <Text style={styles.footerLink}>{t('landing_footer_about')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => requireAuthAndPush('/(tabs)/live')}>
              <Text style={styles.footerLink}>{t('landing_footer_live')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => requireAuthAndPush('/(tabs)/bookings')}>
              <Text style={styles.footerLink}>{t('landing_footer_bookings')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030303',
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
  },
  content: {
    padding: 18,
    paddingBottom: 44,
    gap: 18,
  },
  contentWithTabs: {
    paddingBottom: 120,
  },
  heroShell: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#12936F',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroGlowLarge: {
    position: 'absolute',
    right: -26,
    bottom: -32,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(170, 255, 227, 0.28)',
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  heroGlowSmall: {
    position: 'absolute',
    left: -34,
    top: -18,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 78, 63, 0.22)',
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  heroGlowOne: {
    transform: [{ translateX: 22 }, { translateY: 18 }],
  },
  heroGlowTwo: {
    transform: [{ translateX: -18 }, { translateY: -12 }],
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 20,
  },
  heroBadgeText: {
    color: '#F5FFF9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '300',
    textAlign: 'center',
    maxWidth: 620,
  },
  heroCopy: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 640,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 28,
  },
  primaryButton: {
    minWidth: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(17, 77, 63, 0.16)',
  },
  primaryButtonText: {
    color: '#F5FFF9',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    minWidth: 126,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  secondaryButtonText: {
    color: '#F5FFF9',
    fontSize: 14,
    fontWeight: '600',
  },
  animalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 40,
  },
  animalBubble: {
    width: 62,
    height: 62,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  animalEmoji: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#2D2C28',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3A3936',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  statValue: {
    color: '#09997A',
    fontSize: 22,
    fontWeight: '500',
  },
  statLabel: {
    marginTop: 6,
    color: '#D5D3CC',
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: 14,
    gap: 8,
  },
  sectionEyebrow: {
    color: '#D0C6B7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#F4F0E6',
    fontSize: 28,
    fontWeight: '800',
  },
  sectionCopy: {
    color: '#D0C6B7',
    fontSize: 15,
    lineHeight: 22,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  exploreBtnIcon: {
    fontSize: 32,
  },
  exploreBtnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  exploreBtnSub: {
    fontSize: 12,
    color: '#666',
  },
  exploreBtnArrow: {
    fontSize: 20,
    color: '#0F6E56',
    marginLeft: 'auto',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  featureCard: {
    width: '48%',
    minWidth: 158,
    backgroundColor: '#2D2C28',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3A3936',
    padding: 16,
    gap: 10,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureTitle: {
    color: '#F3F1EA',
    fontSize: 15,
    fontWeight: '700',
  },
  featureCopy: {
    color: '#C8C3B8',
    fontSize: 14,
    lineHeight: 21,
  },
  bookingCard: {
    backgroundColor: '#2D2C28',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#4A4945',
    padding: 18,
    gap: 16,
  },
  bookingTitle: {
    color: '#F3F1EA',
    fontSize: 17,
    fontWeight: '700',
  },
  bookingButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#69655C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#33322F',
  },
  bookingButtonText: {
    color: '#F4F0E6',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 10,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#494846',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  footerBrand: {
    color: '#0FA37F',
    fontSize: 16,
    fontWeight: '800',
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  footerLink: {
    color: '#E0D8CB',
    fontSize: 14,
    fontWeight: '600',
  },
});

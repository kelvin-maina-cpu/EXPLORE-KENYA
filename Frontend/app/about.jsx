import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const CAPABILITIES = [
  {
    title: 'Explore attractions',
    copy: 'Browse national parks, reserves, cultural destinations, and featured travel highlights across Kenya.',
  },
  {
    title: 'Book and pay',
    copy: 'Reserve tours and experiences, then complete payments inside the app with M-Pesa and checkout support.',
  },
  {
    title: 'Watch live sessions',
    copy: 'Join real-time live streams from parks and attractions to experience wildlife and destinations remotely.',
  },
  {
    title: 'Use smart travel tools',
    copy: 'Access GPS navigation, multilingual support, chatbot assistance, and personal booking history in one place.',
  },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>ABOUT EXPLORE KENYA</Text>
          <Text style={styles.title}>A tourism app built to help travelers discover, plan, book, and experience Kenya more easily.</Text>
          <Text style={styles.copy}>
            Explore Kenya brings destination discovery, live travel experiences, route guidance, bookings, and payment support together in one mobile platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Explore Kenya Does</Text>
          <Text style={styles.sectionCopy}>
            Explore Kenya helps users find attractions, learn about destinations, watch live sessions, plan trips, make reservations, and manage their travel activity from a single interface.
          </Text>
        </View>

        <View style={styles.grid}>
          {CAPABILITIES.map((item) => (
            <View key={item.title} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCopy}>{item.copy}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Capabilities</Text>
          <Text style={styles.bullet}>Discover attractions and wildlife destinations across Kenya.</Text>
          <Text style={styles.bullet}>Book experiences with integrated payment flows.</Text>
          <Text style={styles.bullet}>Watch live streams from supported attractions.</Text>
          <Text style={styles.bullet}>Use built-in navigation and travel guidance tools.</Text>
          <Text style={styles.bullet}>Get help through multilingual support and chatbot assistance.</Text>
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

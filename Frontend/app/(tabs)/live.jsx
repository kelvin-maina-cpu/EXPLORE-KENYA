import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getLiveStreams } from '../../services/api';
import { useLocale } from '../../context/LocalizationContext';

export default function LiveScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStreams();

    const refreshInterval = setInterval(() => {
      fetchStreams();
    }, 15000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLiveStreams();
      setStreams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(t('live_failed_load') || 'Failed to load live streams');
    } finally {
      setLoading(false);
    }
  };

  const handleWatch = (item) => {
    if (item.playbackType === 'agora') {
      router.push(`/live/${item._id}`);
      return;
    }

    if (item.streamUrl) {
      const { Linking } = require('react-native');
      Linking.openURL(item.streamUrl).catch(() => {});
    }
  };

  const renderStream = ({ item }) => {
    // Fix: use item.status === 'live' not item.liveStream?.isLive
    const isLive = item.status === 'live';

    return (
      <TouchableOpacity
        style={styles.streamCard}
        onPress={() => handleWatch(item)}
        activeOpacity={0.85}
      >
        <View style={styles.streamCardLeft}>
          <View style={[styles.streamIcon, isLive && styles.streamIconLive]}>
            <Text style={styles.streamEmoji}>🦁</Text>
          </View>
          <View style={styles.streamInfo}>
            <Text style={styles.streamName} numberOfLines={1}>
              {item.title || item.attractionName || 'Live Stream'}
            </Text>
            <Text style={styles.streamLocation} numberOfLines={1}>
              {item.locationName || item.attractionName || ''}
            </Text>
            {item.hostName ? (
              <Text style={styles.streamHost}>by {item.hostName}</Text>
            ) : null}
            <View style={styles.streamMeta}>
              {isLive ? (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineText}>OFFLINE</Text>
                </View>
              )}
              {item.playbackType === 'agora' ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.viewerCount || 0} watching</Text>
                </View>
              ) : null}
              {item.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        <View style={[styles.watchBtn, !isLive && styles.watchBtnOffline]}>
          <Text style={styles.watchBtnText}>
            {isLive ? (item.playbackType === 'agora' ? 'Join' : 'Watch') : 'View'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {t('live_title') || 'Live Streams'}
          </Text>
          <Text style={styles.headerSub}>
            Kenya Wildlife & Attractions
          </Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.livePulse} />
          <Text style={styles.liveIndicatorText}>LIVE</Text>
        </View>
      </View>

      {/* Start Broadcasting Button */}
      <TouchableOpacity
        style={styles.broadcastBanner}
        onPress={() => router.push('/broadcast/general')}
        activeOpacity={0.85}
      >
        <Text style={styles.broadcastBannerEmoji}>📡</Text>
        <View style={styles.broadcastBannerText}>
          <Text style={styles.broadcastBannerTitle}>
            {t('broadcast_go_live') || 'Go Live Now'}
          </Text>
          <Text style={styles.broadcastBannerSub}>
            Share your Kenya experience live
          </Text>
        </View>
        <Text style={styles.broadcastBannerArrow}>›</Text>
      </TouchableOpacity>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchStreams} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {t('live_all_cameras') || 'All Live Cameras'}
        </Text>
        <TouchableOpacity onPress={fetchStreams}>
          <Text style={styles.refreshBtn}>
            {t('live_refresh') || 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stream List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0F6E56"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={streams}
          keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
          renderItem={renderStream}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📡</Text>
              <Text style={styles.emptyTitle}>
                {t('live_empty_title') || 'No Live Streams'}
              </Text>
              <Text style={styles.emptyDesc}>
                {t('live_empty_desc') ||
                  'No live streams available right now. Check back soon or start your own!'}
              </Text>
              <TouchableOpacity
                style={styles.startLiveBtn}
                onPress={() => router.push('/broadcast/general')}
              >
                <Text style={styles.startLiveBtnText}>Start Live Stream</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030303',
  },
  header: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  liveIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  broadcastBanner: {
    margin: 16,
    backgroundColor: '#173457',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#264E86',
  },
  broadcastBannerEmoji: {
    fontSize: 32,
  },
  broadcastBannerText: {
    flex: 1,
  },
  broadcastBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  broadcastBannerSub: {
    fontSize: 12,
    color: '#C8D7EC',
    marginTop: 2,
  },
  broadcastBannerArrow: {
    fontSize: 24,
    color: '#C8D7EC',
    fontWeight: '300',
  },
  errorBox: {
    backgroundColor: '#FCEBEB',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#A32D2D',
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#A32D2D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F1EA',
  },
  refreshBtn: {
    fontSize: 14,
    color: '#0FA37F',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  streamCard: {
    backgroundColor: '#2D2C28',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3936',
    width: '100%',
  },
  streamCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  streamIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E1F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  streamIconLive: {
    backgroundColor: '#FFE8E8',
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  streamEmoji: {
    fontSize: 26,
  },
  streamInfo: {
    flex: 1,
  },
  streamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F1EA',
    marginBottom: 2,
  },
  streamLocation: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 2,
  },
  streamHost: {
    fontSize: 11,
    color: '#0FA37F',
    marginBottom: 4,
  },
  streamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4444',
  },
  liveText: {
    color: '#ff6666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  offlineBadge: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  offlineText: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: 'rgba(15,110,86,0.3)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 10,
    color: '#0FA37F',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  watchBtn: {
    backgroundColor: '#0F6E56',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    minWidth: 70,
    flexShrink: 0,
  },
  watchBtnOffline: {
    backgroundColor: '#333',
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F3F1EA',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  startLiveBtn: {
    marginTop: 8,
    backgroundColor: '#0F6E56',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  startLiveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

import { useEffect, useRef, useState } from 'react';
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
import { getLiveStreams, getStreamToken } from '../../services/api';

export default function LiveScreen() {
  const router = useRouter();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [remoteUid, setRemoteUid] = useState(null);
  const [error, setError] = useState(null);
  const engineRef = useRef(null);
  const AgoraRef = useRef(null);

  useEffect(() => {
    fetchStreams();
    return () => { leaveStream(); };
  }, []);

  const fetchStreams = async () => {
    try {
      const data = await getLiveStreams();
      setStreams(data);
    } catch {
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const joinStream = async (attraction) => {
    try {
      setJoining(true);
      setError(null);
      const { token, channelName, appId } = await getStreamToken(attraction._id);
      const Agora = await import('react-native-agora');
      AgoraRef.current = Agora;
      const engine = Agora.createAgoraRtcEngine();
      engine.initialize({ appId });
      engine.enableVideo();
      engine.addListener('onUserJoined', (_, uid) => {
        setRemoteUid(uid);
        setViewers(v => v + 1);
      });
      engine.addListener('onUserOffline', () => {
        setRemoteUid(null);
        setViewers(v => Math.max(0, v - 1));
      });
      await engine.setClientRole(2);
      await engine.joinChannel(token, channelName, 0, {
        clientRoleType: 2,
      });
      engineRef.current = engine;
      setActiveStream({ ...attraction, channelName, appId });
      setJoined(true);
    } catch (err) {
      setError('Failed to join stream: ' + err.message);
    } finally {
      setJoining(false);
    }
  };

  const leaveStream = async () => {
    try {
      if (engineRef.current) {
        await engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
      setJoined(false);
      setActiveStream(null);
      setRemoteUid(null);
      setViewers(0);
    } catch (err) {
      console.error(err);
    }
  };

  const renderStream = ({ item }) => {
    const isActive = activeStream?._id === item._id;
    const isLive = item.liveStream?.isLive;
    return (
      <TouchableOpacity
        style={[styles.streamCard, isActive && styles.streamCardActive]}
        onPress={() => isActive ? leaveStream() : joinStream(item)}
        disabled={joining}
      >
        <View style={styles.streamCardLeft}>
          <View style={styles.streamIcon}>
            <Text style={styles.streamEmoji}>🦁</Text>
          </View>
          <View style={styles.streamInfo}>
            <Text style={styles.streamName}>{item.name}</Text>
            <Text style={styles.streamCounty}>{item.county}</Text>
            <View style={styles.streamMeta}>
              {isLive ? (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={[styles.joinBtn, isActive && styles.joinBtnActive]}>
          {joining && isActive ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.joinBtnText}>
              {isActive ? 'Leave' : 'Watch'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Cameras</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.livePulse} />
          <Text style={styles.liveIndicatorText}>LIVE</Text>
        </View>
      </View>

      {/* Real video feed */}
      {joined && activeStream && AgoraRef.current && (
        <View style={styles.videoContainer}>
          {remoteUid ? (
            <AgoraRef.current.RtcSurfaceView
              style={styles.videoFeed}
              canvas={{ uid: remoteUid }}
            />
          ) : (
            <View style={styles.waitingView}>
              <ActivityIndicator color="#0FA37F" size="large" />
              <Text style={styles.waitingText}>
                Waiting for park camera...
              </Text>
            </View>
          )}
          <View style={styles.videoOverlay}>
            <View style={styles.videoLiveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.videoName}>{activeStream.name}</Text>
            <Text style={styles.videoViewers}>👁 {viewers}</Text>
          </View>
          <TouchableOpacity style={styles.leaveBtn} onPress={leaveStream}>
            <Text style={styles.leaveBtnText}>✕ Leave</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>All park cameras</Text>
        <TouchableOpacity onPress={fetchStreams}>
          <Text style={styles.refreshBtn}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0F6E56" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={streams}
          keyExtractor={i => i._id}
          renderItem={renderStream}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📡</Text>
              <Text style={styles.emptyTitle}>No streams available</Text>
              <Text style={styles.emptyDesc}>
                Park cameras will appear here when live.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030303' },
  header: {
    backgroundColor: '#0F6E56',
    padding: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#fff' },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4444' },
  liveIndicatorText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  videoContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 240,
    backgroundColor: '#111',
    position: 'relative',
  },
  videoFeed: { flex: 1 },
  waitingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  waitingText: { color: '#aaa', fontSize: 14 },
  videoOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  videoName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '500' },
  videoViewers: { color: '#fff', fontSize: 12 },
  leaveBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(200,0,0,0.85)',
    padding: 10,
    alignItems: 'center',
  },
  leaveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FCEBEB',
    margin: 16,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: '#A32D2D', fontSize: 13 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#F3F1EA' },
  refreshBtn: { fontSize: 14, color: '#0FA37F' },
  list: { padding: 16, gap: 10 },
  streamCard: {
    backgroundColor: '#2D2C28',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3936',
  },
  streamCardActive: { borderColor: '#0FA37F', backgroundColor: '#1a2e28' },
  streamCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  streamIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#E1F5EE',
    alignItems: 'center', justifyContent: 'center',
  },
  streamEmoji: { fontSize: 24 },
  streamInfo: { flex: 1 },
  streamName: { fontSize: 14, fontWeight: '600', color: '#F3F1EA', marginBottom: 2 },
  streamCounty: { fontSize: 12, color: '#AAA', marginBottom: 4 },
  streamMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, gap: 4,
  },
  offlineBadge: { backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  offlineText: { fontSize: 10, color: '#888' },
  joinBtn: {
    backgroundColor: '#0F6E56', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    minWidth: 60, alignItems: 'center',
  },
  joinBtnActive: { backgroundColor: '#cc3333' },
  joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#F3F1EA' },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },
});

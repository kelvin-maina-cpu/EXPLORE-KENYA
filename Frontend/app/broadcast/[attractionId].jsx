import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getStreamToken } from '../../services/api';

export default function BroadcastScreen() {
  const { attractionId, attractionName } = useLocalSearchParams();
  const router = useRouter();
  const engineRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [cameraFront, setCameraFront] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startStream = async () => {
    try {
      setLoading(true);

      const { token, channelName, appId } = await getStreamToken(attractionId);

      const AgoraEngine = await import('react-native-agora');
      const engine = AgoraEngine.createAgoraRtcEngine();

      engine.initialize({ appId });
      engine.enableVideo();
      engine.enableAudio();

      engine.addListener('onUserJoined', () => {
        setViewers(v => v + 1);
      });

      engine.addListener('onUserOffline', () => {
        setViewers(v => Math.max(0, v - 1));
      });

      // Set as broadcaster role
      await engine.setClientRole(1);
      await engine.startPreview();

      await engine.joinChannel(token, channelName, 0, {
        clientRoleType: 1, // Broadcaster
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
      });

      engineRef.current = engine;
      setStreaming(true);
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (err) {
      console.error('Start stream error:', err);
      Alert.alert('Error', 'Failed to start stream: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const stopStream = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (engineRef.current) {
        await engineRef.current.stopPreview();
        await engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
      setStreaming(false);
      setViewers(0);
      setDuration(0);
    } catch (err) {
      console.error('Stop stream error:', err);
    }
  };

  const flipCamera = async () => {
    if (engineRef.current) {
      await engineRef.current.switchCamera();
      setCameraFront(f => !f);
    }
  };

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera preview area */}
      <View style={styles.preview}>
        {streaming ? (
          <View style={styles.livePreview}>
            {/* Agora renders video here natively */}
            <Text style={styles.previewEmoji}>📸</Text>
            <Text style={styles.previewText}>Camera broadcasting</Text>
            <Text style={styles.previewSub}>
              {attractionName || 'Park camera'}
            </Text>
          </View>
        ) : (
          <View style={styles.offlinePreview}>
            <Text style={styles.previewEmoji}>📷</Text>
            <Text style={styles.previewText}>Camera ready</Text>
            <Text style={styles.previewSub}>
              Tap Start to go live
            </Text>
          </View>
        )}

        {/* Live badge */}
        {streaming && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Duration */}
        {streaming && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {formatDuration(duration)}
            </Text>
          </View>
        )}

        {/* Viewers */}
        {streaming && (
          <View style={styles.viewersBadge}>
            <Text style={styles.viewersText}>👁 {viewers}</Text>
          </View>
        )}

        {/* Flip camera */}
        {streaming && (
          <TouchableOpacity style={styles.flipBtn} onPress={flipCamera}>
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.parkInfo}>
          <Text style={styles.parkName}>
            {attractionName || 'Park Camera'}
          </Text>
          <Text style={styles.parkStatus}>
            {streaming
              ? `Broadcasting • ${viewers} watching`
              : 'Ready to stream'}
          </Text>
        </View>

        {!streaming ? (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={startStream}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.startBtnIcon}>🔴</Text>
                <Text style={styles.startBtnText}>Go Live</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopBtn}
            onPress={() => {
              Alert.alert(
                'Stop streaming?',
                'This will end the live stream for all viewers.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Stop', style: 'destructive', onPress: stopStream },
                ]
              );
            }}
          >
            <Text style={styles.stopBtnText}>⏹ Stop stream</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  preview: {
    flex: 1,
    backgroundColor: '#111',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePreview: {
    alignItems: 'center',
    gap: 8,
  },
  offlinePreview: {
    alignItems: 'center',
    gap: 8,
  },
  previewEmoji: { fontSize: 64 },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  previewSub: {
    fontSize: 14,
    color: '#aaa',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  durationBadge: {
    position: 'absolute',
    top: 16,
    right: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  viewersBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewersText: {
    color: '#fff',
    fontSize: 13,
  },
  flipBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipText: { fontSize: 22 },
  controls: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    gap: 14,
  },
  parkInfo: { gap: 4 },
  parkName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  parkStatus: {
    fontSize: 13,
    color: '#aaa',
  },
  startBtn: {
    backgroundColor: '#cc0000',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnIcon: { fontSize: 18 },
  startBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  stopBtn: {
    backgroundColor: '#333',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cc0000',
  },
  stopBtnText: {
    color: '#cc0000',
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    padding: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#888',
    fontSize: 14,
  },
});

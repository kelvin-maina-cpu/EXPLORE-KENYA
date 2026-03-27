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
import {
  ClientRoleType,
  RenderModeType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import {
  getLiveStream,
  getLiveStreamSession,
  updateLiveStreamViewerPresence,
} from '../../services/api';
import { useLocale } from '../../context/LocalizationContext';
import { configureAgoraRole, getAgoraEngine, releaseAgoraEngine } from '../../utils/agora';

export default function LiveViewerScreen() {
  const { streamId } = useLocalSearchParams();
  const normalizedStreamId = Array.isArray(streamId) ? streamId[0] : streamId;
  const router = useRouter();
  const { t } = useLocale();
  const rtcEngineRef = useRef(null);
  const eventHandlerRef = useRef(null);
  const joinedRef = useRef(false);
  const presenceSentRef = useRef(false);

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remoteUid, setRemoteUid] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [joiningText, setJoiningText] = useState(t('live_waiting') || 'Waiting for park camera...');

  useEffect(() => {
    void joinLiveSession();

    return () => {
      void leaveLiveSession();
    };
  }, [normalizedStreamId]);

  const unregisterAgoraEvents = () => {
    if (rtcEngineRef.current && eventHandlerRef.current) {
      rtcEngineRef.current.unregisterEventHandler(eventHandlerRef.current);
      eventHandlerRef.current = null;
    }
  };

  const leaveLiveSession = async () => {
    unregisterAgoraEvents();

    if (rtcEngineRef.current) {
      try {
        rtcEngineRef.current.leaveChannel();
      } catch {
        // Ignore cleanup errors.
      }
    }

    releaseAgoraEngine();
    rtcEngineRef.current = null;
    joinedRef.current = false;

    if (normalizedStreamId && presenceSentRef.current) {
      presenceSentRef.current = false;
      try {
        await updateLiveStreamViewerPresence(normalizedStreamId, 'leave');
      } catch {
        // Best-effort analytics.
      }
    }
  };

  const registerAudienceEvents = () => {
    const handler = {
      onJoinChannelSuccess: async () => {
        joinedRef.current = true;
        setJoiningText(t('live_waiting') || 'Waiting for park camera...');

        if (normalizedStreamId && !presenceSentRef.current) {
          presenceSentRef.current = true;
          try {
            const response = await updateLiveStreamViewerPresence(normalizedStreamId, 'join');
            setViewerCount(response.viewerCount || 0);
          } catch {
            // Ignore viewer count sync failures.
          }
        }
      },
      onUserJoined: (uid) => {
        setRemoteUid(uid);
      },
      onUserOffline: () => {
        setRemoteUid(0);
        setJoiningText(t('live_waiting') || 'Waiting for park camera...');
      },
      onLeaveChannel: () => {
        joinedRef.current = false;
      },
      onError: (errorCode, message) => {
        console.log('Agora viewer error:', errorCode, message);
      },
    };

    rtcEngineRef.current.registerEventHandler(handler);
    eventHandlerRef.current = handler;
  };

  const joinLiveSession = async () => {
    try {
      setLoading(true);
      if (!normalizedStreamId) {
        throw new Error('Live stream id is missing');
      }

      const [streamData, session] = await Promise.all([
        getLiveStream(normalizedStreamId),
        getLiveStreamSession(normalizedStreamId),
      ]);

      if (session.status !== 'live') {
        throw new Error('This live session has already ended');
      }

      setStream(streamData);
      setViewerCount(streamData.viewerCount || 0);

      const rtcEngine = getAgoraEngine(session.appId);
      rtcEngineRef.current = rtcEngine;
      unregisterAgoraEvents();
      registerAudienceEvents();

      configureAgoraRole(rtcEngine, ClientRoleType.ClientRoleAudience);
      rtcEngine.joinChannel(session.token || '', session.channelName, session.uid || 0, {
        clientRoleType: ClientRoleType.ClientRoleAudience,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
        publishCameraTrack: false,
        publishMicrophoneTrack: false,
      });
    } catch (error) {
      console.error('Live viewer join error:', error);
      Alert.alert(t('error') || 'Error', error.response?.data?.message || error.message || t('live_failed_join'));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.leaveBtn}>
          <Text style={styles.leaveBtnText}>{t('live_leave') || 'Leave'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {stream?.title || t('live_title') || 'Live Stream'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {stream?.locationName || stream?.attractionName || 'Explore Kenya'}
          </Text>
        </View>
        <Text style={styles.viewerCount}>{viewerCount} watching</Text>
      </View>

      <View style={styles.videoWrap}>
        {loading ? (
          <ActivityIndicator size="large" color="#0FA37F" />
        ) : remoteUid ? (
          <RtcSurfaceView
            style={styles.videoSurface}
            canvas={{
              uid: remoteUid,
              renderMode: RenderModeType.RenderModeHidden,
              sourceType: VideoSourceType.VideoSourceRemote,
            }}
          />
        ) : (
          <View style={styles.waitingState}>
            <Text style={styles.waitingTitle}>{joiningText}</Text>
            <Text style={styles.waitingCopy}>
              The session is live, but the broadcaster has not published video yet.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>{stream?.hostName ? `Hosted by ${stream.hostName}` : 'Live session'}</Text>
        <Text style={styles.footerCopy}>
          Audio and video are streamed directly inside the app so viewers can join from different devices and locations.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030303',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leaveBtn: {
    backgroundColor: '#173457',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  leaveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: '#9A9A9A',
    fontSize: 12,
    marginTop: 2,
  },
  viewerCount: {
    color: '#0FA37F',
    fontSize: 12,
    fontWeight: '800',
  },
  videoWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSurface: {
    width: '100%',
    height: '100%',
  },
  waitingState: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  waitingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  waitingCopy: {
    color: '#9A9A9A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
  },
  footer: {
    padding: 16,
    gap: 6,
  },
  footerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  footerCopy: {
    color: '#9A9A9A',
    fontSize: 13,
    lineHeight: 20,
  },
});

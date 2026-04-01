import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import {
  ClientRoleType,
  LocalVideoStreamState,
  RenderModeType,
  RtcSurfaceView,
  RtcTextureView,
  VideoSourceType,
} from 'react-native-agora';
import { createLiveStream, getLiveStream, getLiveStreamSession, stopLiveStream } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocalizationContext';
import { configureAgoraRole, getAgoraEngine, releaseAgoraEngine } from '../../utils/agora';

const { height } = Dimensions.get('window');
const AgoraVideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;

export default function BroadcastScreen() {
  const { attractionId, attractionName } = useLocalSearchParams();
  const normalizedAttractionId = Array.isArray(attractionId) ? attractionId[0] : attractionId;
  const normalizedAttractionName = Array.isArray(attractionName) ? attractionName[0] : attractionName;
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  const rtcEngineRef = useRef(null);
  const timerRef = useRef(null);
  const eventHandlerRef = useRef(null);
  const stoppingRef = useRef(false);
  const viewerSyncRef = useRef(null);

  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamId, setStreamId] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDesc, setStreamDesc] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    return () => {
      void cleanupStreamingSession(false);
    };
  }, []);

  useEffect(() => {
    if (!streaming || !streamId) {
      if (viewerSyncRef.current) {
        clearInterval(viewerSyncRef.current);
        viewerSyncRef.current = null;
      }
      return undefined;
    }

    const syncViewerCount = async () => {
      try {
        const liveStream = await getLiveStream(streamId);
        setViewers(liveStream.viewerCount || 0);
      } catch {
        // Best-effort UI refresh while live.
      }
    };

    void syncViewerCount();
    viewerSyncRef.current = setInterval(() => {
      void syncViewerCount();
    }, 3000);

    return () => {
      if (viewerSyncRef.current) {
        clearInterval(viewerSyncRef.current);
        viewerSyncRef.current = null;
      }
    };
  }, [streaming, streamId]);

  const startDurationTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setDuration((value) => value + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopViewerSync = () => {
    if (viewerSyncRef.current) {
      clearInterval(viewerSyncRef.current);
      viewerSyncRef.current = null;
    }
  };

  const unregisterAgoraEvents = () => {
    if (rtcEngineRef.current && eventHandlerRef.current) {
      rtcEngineRef.current.unregisterEventHandler(eventHandlerRef.current);
      eventHandlerRef.current = null;
    }
  };

  const leaveAgoraChannel = () => {
    if (rtcEngineRef.current) {
      try {
        rtcEngineRef.current.leaveChannel();
      } catch {
        // Ignore cleanup errors during shutdown.
      }
    }
  };

  const cleanupStreamingSession = async (notifyBackend = true) => {
    stopDurationTimer();
    stopViewerSync();
    unregisterAgoraEvents();
    leaveAgoraChannel();
    releaseAgoraEngine();
    rtcEngineRef.current = null;
    setJoined(false);
    setJoinError('');
    setSessionInfo(null);

    if (notifyBackend && streamId && !stoppingRef.current) {
      stoppingRef.current = true;
      try {
        await stopLiveStream(streamId);
      } catch {
        // Best-effort stop; the host may have already ended the session.
      } finally {
        stoppingRef.current = false;
      }
    }

    setStreaming(false);
    setViewers(0);
    setDuration(0);
    setStreamId('');
  };

  const requestMediaPermissions = async () => {
    const [cameraPermission, microphonePermission] = await Promise.all([
      Camera.requestCameraPermissionsAsync(),
      Camera.requestMicrophonePermissionsAsync(),
    ]);

    if (cameraPermission.status !== 'granted' || microphonePermission.status !== 'granted') {
      throw new Error(t('broadcast_permissions_required'));
    }
  };

  const registerBroadcasterEvents = () => {
    const handler = {
      onJoinChannelSuccess: () => {
        setJoined(true);
        setJoinError('');
        setStreaming(true);
        startDurationTimer();
      },
      onUserJoined: () => {
        setViewers((value) => value + 1);
      },
      onUserOffline: () => {
        setViewers((value) => Math.max(0, value - 1));
      },
      onLocalVideoStateChanged: (_source, state, reason) => {
        console.log('Agora local video state:', state, 'reason:', reason);
        if (state !== LocalVideoStreamState.LocalVideoStreamStateCapturing) {
          setJoinError(`${t('broadcast_camera_not_ready')} (state ${state}, reason ${reason}).`);
        } else {
          setJoinError('');
        }
      },
      onError: (errorCode, message) => {
        console.log('Agora broadcast error:', errorCode, message);
        const resolvedMessage =
          errorCode === 109 || errorCode === 110
            ? 'Agora rejected the channel token. Restart the backend and try a fresh live session.'
            : message || `Agora error: ${errorCode}`;
        setJoinError(resolvedMessage);
      },
    };

    rtcEngineRef.current.registerEventHandler(handler);
    eventHandlerRef.current = handler;
  };

  const handleGoLive = async () => {
    if (!streamTitle.trim()) {
      Alert.alert(t('error'), t('broadcast_stream_title_required'));
      return;
    }

    let createdStreamId = '';

    try {
      setLoading(true);
      await requestMediaPermissions();

      const liveStream = await createLiveStream({
        title: streamTitle.trim(),
        description: streamDesc.trim() || streamTitle.trim(),
        locationName: normalizedAttractionName || 'Kenya',
        category: 'wildlife',
        status: 'live',
        ...(normalizedAttractionId && normalizedAttractionId !== 'general'
          ? { attractionId: normalizedAttractionId }
          : {}),
      });
      createdStreamId = liveStream._id;

      const session = await getLiveStreamSession(liveStream._id, 'publisher');
      setSessionInfo({
        channelName: session.channelName,
        uid: session.uid,
        role: session.role,
        hasToken: Boolean(session.token),
      });

      if (!session.token) {
        throw new Error(t('broadcast_missing_token'));
      }

      const rtcEngine = getAgoraEngine(session.appId);
      rtcEngineRef.current = rtcEngine;
      unregisterAgoraEvents();
      registerBroadcasterEvents();
      setJoinError('');

      configureAgoraRole(rtcEngine, ClientRoleType.ClientRoleBroadcaster);
      rtcEngine.enableVideo();
      rtcEngine.enableAudio();
      rtcEngine.enableLocalVideo(true);
      rtcEngine.enableLocalAudio(true);
      rtcEngine.startPreview();
      rtcEngine.muteLocalVideoStream(!cameraEnabled);
      rtcEngine.muteLocalAudioStream(!micEnabled);
      rtcEngine.joinChannel(session.token || '', session.channelName, session.uid || 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      setStreamId(liveStream._id);
    } catch (err) {
      console.error('Broadcast start error:', err);
      await cleanupStreamingSession(false);
      if (createdStreamId) {
        try {
          await stopLiveStream(createdStreamId);
        } catch {
          // Ignore cleanup failure if the stream never fully started.
        }
      }
      Alert.alert(
        t('error'),
        err.response?.data?.message || err.message || t('broadcast_start_failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStopStream = async () => {
    try {
      setLoading(true);
      await cleanupStreamingSession(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleCamera = (value) => {
    setCameraEnabled(value);
    if (rtcEngineRef.current) {
      rtcEngineRef.current.muteLocalVideoStream(!value);
      rtcEngineRef.current.enableLocalVideo(value);
    }
  };

  const toggleMicrophone = (value) => {
    setMicEnabled(value);
    if (rtcEngineRef.current) {
      rtcEngineRef.current.muteLocalAudioStream(!value);
      rtcEngineRef.current.enableLocalAudio(value);
    }
  };

  const switchCamera = () => {
    try {
      rtcEngineRef.current?.switchCamera();
    } catch (error) {
      Alert.alert(t('error'), error.message || t('broadcast_switch_camera_failed'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (streaming) {
                Alert.alert(
                  t('broadcast_stop_title'),
                  t('broadcast_stop_copy'),
                  [
                    { text: t('back'), style: 'cancel' },
                    {
                      text: t('broadcast_stop_stream'),
                      style: 'destructive',
                      onPress: () => {
                        void handleStopStream().finally(() => router.back());
                      },
                    },
                  ]
                );
                return;
              }

              router.back();
            }}
            style={styles.backBtn}
          >
            <Text style={styles.backBtnText}>{t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('broadcast_go_live')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.preview}>
          {joined ? (
            <>
              <AgoraVideoView
                style={styles.videoSurface}
                canvas={{
                  uid: 0,
                  renderMode: RenderModeType.RenderModeHidden,
                  sourceType: VideoSourceType.VideoSourceCamera,
                }}
              />
              <View style={styles.overlayTop}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{t('broadcast_live')}</Text>
                </View>
                <Text style={styles.viewerPill}>
                  {viewers} {t('broadcast_viewers_watching')}
                </Text>
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.previewTitle}>{streamTitle}</Text>
                <Text style={styles.previewMeta}>
                  {formatDuration(duration)} | {normalizedAttractionName || t('app_name')}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.offlinePreview}>
              <Text style={styles.previewEmoji}>CAM</Text>
              <Text style={styles.previewText}>{t('broadcast_camera_ready')}</Text>
              <Text style={styles.previewSub}>
                {t('broadcast_tap_start')}
              </Text>
            </View>
          )}
        </View>

        {!streaming ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('broadcast_stream_details')}</Text>
            <Text style={styles.label}>{t('broadcast_stream_title')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('broadcast_stream_title_placeholder')}
              placeholderTextColor="#666"
              value={streamTitle}
              onChangeText={setStreamTitle}
            />

            <Text style={styles.label}>{t('broadcast_description')}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder={t('broadcast_stream_desc_placeholder')}
              placeholderTextColor="#666"
              value={streamDesc}
              onChangeText={setStreamDesc}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.locationNote}>{t('broadcast_location_prefix')}: {normalizedAttractionName || t('app_name')}</Text>
            <Text style={styles.helperCopy}>{t('broadcast_helper_copy')}</Text>
          </View>
        ) : null}

        <View style={styles.controls}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCard}>
              <Text style={styles.toggleLabel}>{t('broadcast_camera_label')}</Text>
              <Switch value={cameraEnabled} onValueChange={toggleCamera} trackColor={{ true: '#0FA37F' }} />
            </View>
            <View style={styles.toggleCard}>
              <Text style={styles.toggleLabel}>{t('broadcast_microphone_label')}</Text>
              <Switch value={micEnabled} onValueChange={toggleMicrophone} trackColor={{ true: '#0FA37F' }} />
            </View>
          </View>

          {streaming ? (
            <>
              <TouchableOpacity style={styles.secondaryBtn} onPress={switchCamera}>
                <Text style={styles.secondaryBtnText}>{t('broadcast_switch_camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stopBtn}
                onPress={() =>
                  Alert.alert(
                    t('broadcast_stop_title'),
                    t('broadcast_stop_copy'),
                    [
                      { text: t('back'), style: 'cancel' },
                      {
                        text: t('broadcast_stop_stream'),
                        style: 'destructive',
                        onPress: () => {
                          void handleStopStream();
                        },
                      },
                    ]
                  )
                }
                disabled={loading}
              >
                <Text style={styles.stopBtnText}>{t('broadcast_stop_stream') || 'Stop stream'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={handleGoLive} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startBtnText}>{t('broadcast_go_live')}</Text>
              )}
            </TouchableOpacity>
          )}

          {streaming && normalizedAttractionId && normalizedAttractionId !== 'general' ? (
            <TouchableOpacity style={styles.navBtn} onPress={() => router.push(`/map/${normalizedAttractionId}`)}>
              <Text style={styles.navBtnText}>{t('broadcast_gps_navigation')}</Text>
            </TouchableOpacity>
          ) : null}

          {streaming ? (
            <Text style={styles.liveNote}>
              {user?.name ? `${t('broadcast_live_as')} ${user.name}.` : t('broadcast_you_are_live')}
            </Text>
          ) : null}

          {joinError ? <Text style={styles.errorNote}>{joinError}</Text> : null}

          {sessionInfo ? (
            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>{t('broadcast_session_debug')}</Text>
              <Text style={styles.debugText}>{t('broadcast_debug_channel')}: {sessionInfo.channelName}</Text>
              <Text style={styles.debugText}>{t('broadcast_debug_uid')}: {sessionInfo.uid}</Text>
              <Text style={styles.debugText}>{t('broadcast_debug_role')}: {sessionInfo.role}</Text>
              <Text style={styles.debugText}>{t('broadcast_debug_token')}: {sessionInfo.hasToken ? t('broadcast_token_received') : t('broadcast_token_missing')}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030303',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    minWidth: 60,
  },
  backBtnText: {
    color: '#0FA37F',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 60,
  },
  preview: {
    height: height * 0.42,
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSurface: {
    width: '100%',
    height: '100%',
  },
  overlayTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(204,0,0,0.92)',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  viewerPill: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.58)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  previewMeta: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 4,
  },
  offlinePreview: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  previewEmoji: {
    color: '#0FA37F',
    fontSize: 32,
    fontWeight: '900',
  },
  previewText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  previewSub: {
    color: '#9A9A9A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  form: {
    margin: 16,
    marginBottom: 10,
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#232323',
  },
  formTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    color: '#A1A1A1',
    fontSize: 13,
    marginTop: 14,
    marginBottom: 6,
    fontWeight: '700',
  },
  input: {
    borderRadius: 14,
    backgroundColor: '#1E1E1E',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#303030',
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  locationNote: {
    marginTop: 14,
    color: '#0FA37F',
    fontSize: 13,
    fontWeight: '700',
  },
  helperCopy: {
    marginTop: 8,
    color: '#9A9A9A',
    fontSize: 13,
    lineHeight: 20,
  },
  controls: {
    paddingHorizontal: 16,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#232323',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  startBtn: {
    borderRadius: 18,
    backgroundColor: '#CC0000',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderRadius: 18,
    backgroundColor: '#173457',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  stopBtn: {
    borderRadius: 18,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#CC0000',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '800',
  },
  navBtn: {
    borderRadius: 18,
    backgroundColor: '#264E86',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  liveNote: {
    color: '#A1A1A1',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorNote: {
    color: '#FF8A8A',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  debugCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#232323',
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  debugTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  debugText: {
    color: '#B9C0C8',
    fontSize: 12,
    lineHeight: 18,
  },
});

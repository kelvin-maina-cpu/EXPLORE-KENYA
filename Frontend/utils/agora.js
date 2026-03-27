import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
} from 'react-native-agora';

let engine = null;
let initializedAppId = '';

export const getAgoraEngine = (appId) => {
  if (!appId) {
    throw new Error('Agora App ID is missing');
  }

  if (!engine) {
    engine = createAgoraRtcEngine();
  }

  if (initializedAppId !== appId) {
    if (initializedAppId) {
      engine.release();
      engine = createAgoraRtcEngine();
    }

    engine.initialize({ appId });
    engine.enableVideo();
    engine.enableAudio();
    engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
    initializedAppId = appId;
  }

  return engine;
};

export const configureAgoraRole = (rtcEngine, role) => {
  rtcEngine.setClientRole(role);

  const isBroadcaster = role === ClientRoleType.ClientRoleBroadcaster;
  rtcEngine.enableLocalVideo(isBroadcaster);
  rtcEngine.enableLocalAudio(isBroadcaster);
  rtcEngine.muteLocalVideoStream(!isBroadcaster);
  rtcEngine.muteLocalAudioStream(!isBroadcaster);
};

export const releaseAgoraEngine = () => {
  if (engine) {
    engine.release();
    engine = null;
    initializedAppId = '';
  }
};

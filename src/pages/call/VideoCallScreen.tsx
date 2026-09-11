import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Animated, PanResponder } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useAppSelector } from '../../store/app/hooks';
import { IconApp } from '../../components/app/IconApp';
import { callManager, ActiveCallData } from '../../services/call/CallManager';
import { strings } from '../../lang/lang';
import { media_url, formatPhoneInternational } from '../../../GlobalVariables';
import { TUser } from '../../types/types';
import { useProximity } from '../../components/hooks/useProximity';
import { useObject } from '@realm/react';
import { UserContacts } from '../../store/database/Models';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

export const VideoCallScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  useKeepAwake();
  const app_theme = useAppSelector((state) => state.app_theme);
  const contacts = useAppSelector((state) => state.app.raw_contacts);
  const [callData, setCallData] = useState<ActiveCallData | null>(callManager.getCallData());

  const handleMinimize = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Screen Tap Fade Animation for Overlay Controls & Counter View
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const toggleControlsVisibility = () => {
    const toValue = areControlsVisible ? 0 : 1;
    Animated.timing(controlsOpacity, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setAreControlsVisible(!areControlsVisible);
  };

  // Draggable Floating Video PanResponder
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const lastCallDataRef = React.useRef<ActiveCallData | null>(callManager.getCallData());

  const handleEndCall = () => {
    callManager.endCall('USER_ENDED');
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  useEffect(() => {
    let timer: any = null;
    const unsubscribe = callManager.subscribe((data) => {
      setCallData(data);
      if (data) {
        lastCallDataRef.current = data;
      }
      if (!data || data.status === 'ENDED' || data.status === 'FAILED' || data.status === 'BUSY') {
        if (!timer) {
          timer = setTimeout(() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }, 800);
        }
      }
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [navigation]);

  const activeCall = callData || lastCallDataRef.current;

  if (!activeCall) {
    return null;
  }

  const targetPhoneNumber = activeCall.isCaller ? activeCall.calleeId : activeCall.callerId;
  const realmContact = useObject(UserContacts, targetPhoneNumber || '');
  const contact = contacts.find((c) => c.phoneNumber === targetPhoneNumber);
  const displayName = contact ? contact.displayName : formatPhoneInternational({ phone_number: targetPhoneNumber } as TUser);
  const peerAvatarFromCallData = activeCall.isCaller ? activeCall.calleeAvatar : activeCall.callerAvatar;
  const avatarUrl = (contact && ((contact as any).imageProfileUrl || (contact as any).avatar)) || peerAvatarFromCallData;
  const isVerified = Boolean(realmContact?.user_verified === 1 || (contact && ((contact as any).user_verified === 1 || (contact as any).isVerified)));

  const localStreamUrl = activeCall.localStream ? activeCall.localStream.toURL() : null;
  const remoteStreamUrl = activeCall.remoteStream ? activeCall.remoteStream.toURL() : null;
  const remoteVideoTrackCount = activeCall.remoteStream ? activeCall.remoteStream.getVideoTracks().length : 0;
  const remoteAudioTrackCount = activeCall.remoteStream ? activeCall.remoteStream.getAudioTracks().length : 0;
  const remoteRtcKey = `remote_rtc_${remoteStreamUrl}_v${remoteVideoTrackCount}_a${remoteAudioTrackCount}`;
  const localVideoTrackCount = activeCall.localStream ? activeCall.localStream.getVideoTracks().length : 0;
  const localRtcKey = `local_rtc_${localStreamUrl}_v${localVideoTrackCount}`;

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (activeCall.status) {
      case 'OUTGOING_CALLING':
        return strings.calling || 'Calling...';
      case 'OUTGOING_RINGING':
        return strings.ringing || 'Ringing...';
      case 'INCOMING_RINGING':
        return strings.incoming_call || 'Incoming call...';
      case 'CONNECTING':
        return activeCall.isCaller ? (strings.loading || 'Connecting...') : (strings.incoming_call || 'Incoming call...');
      case 'CONNECTED':
        return formatDuration(activeCall.durationSeconds);
      case 'RECONNECTING':
        return strings.reconnecting || 'Reconnecting...';
      case 'BUSY':
        return strings.user_busy || 'User Busy';
      case 'FAILED':
        return strings.call_failed || 'Call Failed';
      case 'ENDED':
        return strings.call_ended || 'Call Ended';
      default:
        return '';
    }
  };

  const isConnected = activeCall.status === 'CONNECTED';
  const isProximityActive = isConnected && !activeCall.isSpeaker;
  const isNear = useProximity(isProximityActive);


  const primaryColor = app_theme.colors.primary || '#34C759';
  const activeBtnBg = app_theme.colors.button_background_color || primaryColor;
  const activeBtnFg = app_theme.colors.button_foreground_color || '#FFFFFF';

  return (
    <AnimatedReanimated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={{ flex: 1 }}
    >
      <Pressable
        style={[styles.container, { backgroundColor: app_theme.dark ? '#000000' : '#1C1C1E' }]}
        onPress={toggleControlsVisibility}
      >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Screen Lock Pitch-Black Overlay when phone is close to ear */}
      {isNear && isProximityActive && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', zIndex: 999999 }]} />
      )}

      {/* Main Remote Video View */}
      {((activeCall.remoteStream && activeCall.remoteStream.getVideoTracks().length > 0) || remoteStreamUrl) && isConnected ? (
        <RTCView
          key={remoteRtcKey}
          streamURL={remoteStreamUrl}
          style={styles.fullScreenVideo}
          objectFit="cover"
          mirror={false}
          zOrder={0}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={[styles.placeholderAvatarCircle, { borderColor: primaryColor + '60' }]}>
            <ExpoImage
              source={avatarUrl ? { uri: avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}` } : require('../../assets/profile_black.jpg')}
              style={styles.placeholderAvatarImage}
              contentFit="cover"
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={styles.remotePlaceholderText}>{displayName}</Text>
            {isVerified && (
              <IconApp pack="MT" name="verified" size={20} color={primaryColor} styles={{ marginLeft: 6 }} />
            )}
          </View>
          <View style={[styles.statusPill, { backgroundColor: isConnected ? primaryColor + '25' : '#FFFFFF20' }]}>
            {isConnected && <View style={[styles.activeDot, { backgroundColor: primaryColor }]} />}
            <Text style={[styles.remotePlaceholderStatus, { color: isConnected ? primaryColor : '#FFFFFF' }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      )}

      {/* Floating Local Camera Preview (Draggable) */}
      {localStreamUrl && !activeCall.isCameraOff ? (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.localVideoContainer,
            {
              transform: pan.getTranslateTransform(),
            },
          ]}
        >
          <View pointerEvents="none" style={styles.localVideoWrapper}>
            <RTCView
              key={localRtcKey}
              streamURL={localStreamUrl}
              style={styles.localVideo}
              objectFit="cover"
              mirror={true}
              zOrder={1}
            />
          </View>
        </Animated.View>
      ) : null}

      {/* Centered Overlay Header with Fade Animation */}
      <Animated.View
        pointerEvents={areControlsVisible ? 'auto' : 'none'}
        style={[styles.overlayHeader, { opacity: controlsOpacity }]}
      >
        <View style={styles.headerGlassCard}>
          <Pressable
            style={styles.headerMinimizeBtn}
            onPress={handleMinimize}
          >
            <IconApp pack="MC" name="chevron-down" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleRow}>
            <Text style={styles.callerName}>{displayName}</Text>
            {isConnected && <View style={[styles.activeDot, { backgroundColor: primaryColor }]} />}
          </View>
          <Text style={[styles.callStatus, { color: isConnected ? primaryColor : '#E5E5EA' }]}>
            {getStatusText()}
          </Text>
        </View>
      </Animated.View>

      {/* Floating Action Controls with Fade Animation */}
      <Animated.View
        pointerEvents={areControlsVisible ? 'auto' : 'none'}
        style={[styles.overlayFooter, { opacity: controlsOpacity }]}
      >
        <View style={styles.controlsGlassCard}>
          {/* Mute Microphone */}
          <Pressable
            style={[
              styles.controlBtn,
              activeCall.isMuted
                ? { backgroundColor: activeBtnBg, borderColor: activeBtnBg }
                : { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
            ]}
            onPress={() => callManager.toggleMute()}
          >
            <IconApp
              pack="MC"
              name={activeCall.isMuted ? 'microphone-off' : 'microphone'}
              size={24}
              color={activeCall.isMuted ? activeBtnFg : '#FFFFFF'}
            />
          </Pressable>

          {/* Toggle Video Camera */}
          <Pressable
            style={[
              styles.controlBtn,
              activeCall.isCameraOff
                ? { backgroundColor: activeBtnBg, borderColor: activeBtnBg }
                : { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
            ]}
            onPress={() => callManager.toggleCamera()}
          >
            <IconApp
              pack="MC"
              name={activeCall.isCameraOff ? 'camera-off' : 'camera'}
              size={24}
              color={activeCall.isCameraOff ? activeBtnFg : '#FFFFFF'}
            />
          </Pressable>

          {/* Switch Front/Back Camera */}
          <Pressable
            style={styles.controlBtn}
            onPress={() => callManager.switchCamera()}
          >
            <IconApp pack="MC" name="camera-flip" size={24} color="#FFFFFF" />
          </Pressable>

          {/* Speaker Button */}
          <Pressable
            style={[
              styles.controlBtn,
              activeCall.isSpeaker
                ? { backgroundColor: activeBtnBg, borderColor: activeBtnBg }
                : { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
            ]}
            onPress={() => callManager.toggleSpeaker()}
          >
            <IconApp
              pack="MC"
              name={activeCall.isSpeaker ? 'volume-high' : 'volume-medium'}
              size={24}
              color={activeCall.isSpeaker ? activeBtnFg : '#FFFFFF'}
            />
          </Pressable>

          {/* Hangup Red Button */}
          <Pressable
            style={styles.hangupBtn}
            onPress={handleEndCall}
          >
            <IconApp pack="MC" name="phone-hangup" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </Animated.View>
    </Pressable>
  </AnimatedReanimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121214',
  },
  placeholderAvatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  placeholderAvatarImage: {
    width: '100%',
    height: '100%',
  },
  remotePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  remotePlaceholderStatus: {
    fontSize: 15,
    fontWeight: '600',
  },
  localVideoContainer: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 36) + 70,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    zIndex: 10,
  },
  localVideoWrapper: {
    width: '100%',
    height: '100%',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  overlayHeader: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 36) + 16,
    left: 16,
    right: 16,
    zIndex: 5,
  },
  headerGlassCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerMinimizeBtn: {
    padding: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  callStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  overlayFooter: {
    position: 'absolute',
    bottom: 54,
    left: 16,
    right: 16,
    zIndex: 5,
  },
  controlsGlassCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    elevation: 10,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default VideoCallScreen;


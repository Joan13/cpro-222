import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';
import AnimatedReanimated, {
  ZoomIn,
  ZoomOut,
  Layout,
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { RTCView } from 'react-native-webrtc';
import { useAppSelector } from '../../store/app/hooks';
import { IconApp } from '../app/IconApp';
import { callManager, ActiveCallData } from '../../services/call/CallManager';
import { media_url, formatPhoneInternational } from '../../../GlobalVariables';
import { strings } from '../../lang/lang';
import { TUser } from '../../types/types';

export const ActiveCallFloatingPIP: React.FC<{ navigation: any }> = ({ navigation }) => {
  const app_theme = useAppSelector((state) => state.app_theme);
  const contacts = useAppSelector((state) => state.app.raw_contacts);
  const [callData, setCallData] = useState<ActiveCallData | null>(callManager.getCallData());
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);

  // Floating Draggable Position
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
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

  useEffect(() => {
    const unsubscribe = callManager.subscribe((data) => {
      setCallData(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkRoute = () => {
      try {
        if (navigation && navigation.current) {
          const route = navigation.current.getCurrentRoute();
          if (route) {
            setCurrentRoute(route.name);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    checkRoute();
    const interval = setInterval(checkRoute, 400);
    return () => clearInterval(interval);
  }, [navigation]);

  // Only show floating PIP widget if there is an ongoing (CONNECTED / RECONNECTING) call and user is NOT on call screens
  const isOngoingCall =
    callData &&
    (callData.status === 'CONNECTED' || callData.status === 'RECONNECTING');

  const isVisibleInUi = Boolean(
    isOngoingCall &&
      currentRoute !== 'AudioCallScreen' &&
      currentRoute !== 'VideoCallScreen'
  );

  if (!callData || !isVisibleInUi) {
    return null;
  }

  const targetPhoneNumber = callData.isCaller ? callData.calleeId : callData.callerId;
  const contact = contacts.find((c) => c.phoneNumber === targetPhoneNumber);
  const displayName = contact ? contact.displayName : formatPhoneInternational({ phone_number: targetPhoneNumber } as TUser);

  const peerAvatarFromCallData = callData.isCaller ? callData.calleeAvatar : callData.callerAvatar;
  const avatarUrl = (contact && ((contact as any).imageProfileUrl || (contact as any).avatar)) || peerAvatarFromCallData;

  const remoteStreamUrl = callData.remoteStream ? callData.remoteStream.toURL() : null;
  const localStreamUrl = callData.localStream ? callData.localStream.toURL() : null;
  const videoStreamUrl = remoteStreamUrl || localStreamUrl;

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
    switch (callData.status) {
      case 'OUTGOING_CALLING':
        return strings.calling || 'Calling...';
      case 'OUTGOING_RINGING':
        return strings.ringing || 'Ringing...';
      case 'INCOMING_RINGING':
        return strings.incoming_call || 'Incoming call...';
      case 'CONNECTING':
        return callData.isCaller ? (strings.loading || 'Connecting...') : (strings.incoming_call || 'Incoming call...');
      case 'CONNECTED':
        return formatDuration(callData.durationSeconds);
      case 'RECONNECTING':
        return strings.reconnecting || 'Reconnecting...';
      default:
        return '';
    }
  };

  const handleExpandCallScreen = () => {
    if (navigation && navigation.current) {
      if (callData.type === 'audio') {
        navigation.current.navigate('AudioCallScreen');
      } else {
        navigation.current.navigate('VideoCallScreen');
      }
    }
  };

  const isConnected = callData.status === 'CONNECTED';
  const primaryAccent = app_theme.colors.button_background_color || app_theme.colors.primary || '#34C759';
  const cardBg = app_theme.colors.card || app_theme.colors.background || (app_theme.dark ? '#1C1C1E' : '#FFFFFF');
  const textColor = app_theme.colors.text || (app_theme.dark ? '#FFFFFF' : '#000000');
  const activeBtnBg = app_theme.colors.button_background_color || primaryAccent;
  const activeBtnFg = app_theme.colors.button_foreground_color || '#FFFFFF';

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.pipContainer,
        {
          backgroundColor: cardBg,
          borderColor: app_theme.colors.border || 'rgba(0,0,0,0.15)',
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <AnimatedReanimated.View
        entering={ZoomIn.springify().damping(15).stiffness(130).mass(0.7)}
        exiting={ZoomOut.duration(180)}
        layout={Layout.springify()}
      >
        <Pressable style={styles.pipContentRow} onPress={handleExpandCallScreen}>
          {/* Video Thumbnail or Profile Avatar */}
          {callData?.type === 'video' && videoStreamUrl && !callData?.isCameraOff ? (
            <View style={[styles.videoThumbnailWrapper, { borderColor: primaryAccent }]}>
              <RTCView
                streamURL={videoStreamUrl}
                style={styles.videoThumbnail}
                objectFit="cover"
                mirror={!remoteStreamUrl}
                zOrder={2}
              />
            </View>
          ) : (
            <View style={[styles.avatarCircle, { borderColor: primaryAccent }]}>
              <ExpoImage
                source={avatarUrl ? { uri: avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}` } : require('../../assets/profile_black.jpg')}
                style={styles.avatarImg}
                contentFit="cover"
              />
            </View>
          )}

          {/* Name & Timer Details */}
          <View style={styles.infoCol}>
            <Text style={[styles.peerNameText, { color: textColor }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.statusRow}>
              {isConnected && <View style={[styles.activeDot, { backgroundColor: primaryAccent }]} />}
              <Text style={[styles.statusText, { color: isConnected ? primaryAccent : textColor }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            {/* Mute Button */}
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: callData.isMuted
                    ? activeBtnBg
                    : (app_theme.colors.border + '40' || 'rgba(0,0,0,0.06)'),
                },
              ]}
              onPress={() => callManager.toggleMute()}
            >
              <IconApp
                pack="MC"
                name={callData.isMuted ? 'microphone-off' : 'microphone'}
                size={18}
                color={callData.isMuted ? activeBtnFg : textColor}
              />
            </Pressable>

            {/* Expand Fullscreen Button */}
            <Pressable style={styles.actionBtn} onPress={handleExpandCallScreen}>
              <IconApp pack="MC" name="fullscreen" size={20} color={textColor} />
            </Pressable>

            {/* Hangup Red Button */}
            <Pressable
              style={[styles.actionBtn, styles.hangupBtn]}
              onPress={() => callManager.endCall('USER_ENDED')}
            >
              <IconApp pack="MC" name="phone-hangup" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </Pressable>
      </AnimatedReanimated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 9999,
  },
  pipContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoThumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#34C759',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  peerNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupBtn: {
    backgroundColor: '#EA4335',
  },
});

export default ActiveCallFloatingPIP;

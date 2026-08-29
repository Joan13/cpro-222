import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useAppSelector } from '../../store/app/hooks';
import { IconApp } from '../../components/app/IconApp';
import { callManager, ActiveCallData } from '../../services/call/CallManager';
import { media_url, formatPhoneInternational } from '../../../GlobalVariables';
import { strings } from '../../lang/lang';
import { TUser } from '../../types/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAudioModeAsync } from 'expo-audio';
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

const SCREEN_SPRING_CONFIG = {
  damping: 15,
  stiffness: 120,
  mass: 0.8,
};

export const AudioCallScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const app_theme = useAppSelector((state) => state.app_theme);
  const contacts = useAppSelector((state) => state.app.raw_contacts);
  const [callData, setCallData] = useState<ActiveCallData | null>(callManager.getCallData());

  const lastCallDataRef = React.useRef<ActiveCallData | null>(callManager.getCallData());

  const handleMinimize = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

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

  useEffect(() => {
    const updateCallAudioRoute = async () => {
      if (isProximityActive) {
        try {
          if (isNear) {
            await setAudioModeAsync({
              shouldRouteThroughEarpiece: true,
              allowsRecording: true,
            });
          } else {
            await setAudioModeAsync({
              shouldRouteThroughEarpiece: false,
              allowsRecording: true,
            });
          }
        } catch (e) {
          console.warn('Failed to update call audio routing:', e);
        }
      }
    };
    updateCallAudioRoute();
  }, [isNear, isProximityActive]);

  const fullAvatarUri = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}`) : null;
  const primaryColor = app_theme.colors.primary || '#34C759';
  const highColor = app_theme.colors.high_color || primaryColor;
  const activeBtnBg = app_theme.colors.button_background_color || primaryColor;
  const activeBtnFg = app_theme.colors.button_foreground_color || '#FFFFFF';

  const textColor = fullAvatarUri ? '#FFFFFF' : (app_theme.colors.text || (app_theme.dark ? '#FFFFFF' : '#000000'));
  const subtitleColor = fullAvatarUri ? '#E5E5EA' : (app_theme.colors.gray || '#8E8E93');
  const timerColor = fullAvatarUri ? '#FFFFFF' : highColor;
  const iconColor = fullAvatarUri ? '#FFFFFF' : app_theme.colors.text;

  const inactiveBtnBg = fullAvatarUri ? 'rgba(255, 255, 255, 0.2)' : (app_theme.colors.card || app_theme.colors.border + '40');
  const inactiveBtnBorder = fullAvatarUri ? 'rgba(255, 255, 255, 0.3)' : app_theme.colors.border;
  const inactiveBtnIconColor = fullAvatarUri ? '#FFFFFF' : app_theme.colors.text;

  return (
    <AnimatedReanimated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={{ flex: 1, backgroundColor: app_theme.colors.background }}
    >
      {/* Full-Screen Profile Picture Background with Dark Overlay */}
      {fullAvatarUri ? (
        <>
          <ExpoImage
            source={{ uri: fullAvatarUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />
        </>
      ) : null}

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={fullAvatarUri || app_theme.dark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

        {/* Screen Lock Pitch-Black Overlay when phone is close to ear */}
        {isNear && isProximityActive && (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', zIndex: 999999 }]} />
        )}

        {/* Top Header Section */}
        <View style={styles.topSection}>
            <Pressable
              style={styles.minimizeBtn}
              onPress={handleMinimize}
            >
              <IconApp pack="MC" name="chevron-down" size={30} color={iconColor} />
            </Pressable>

          <Text style={[styles.appHeaderSubtitle, { color: subtitleColor }]}>
            {strings.audio_call || 'Audio Call'}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.contactName, { color: textColor }]} numberOfLines={1}>
              {displayName}
            </Text>
            {isVerified && (
              <IconApp pack="MT" name="verified" size={20} color={highColor} styles={{ marginLeft: 6 }} />
            )}
          </View>

        {/* Live Timer Counter & Status */}
        <View style={styles.statusRow}>
          {isConnected && (
            <View style={[styles.hdBadge, { borderColor: subtitleColor }]}>
              <Text style={[styles.hdBadgeText, { color: subtitleColor }]}>HD</Text>
            </View>
          )}
          <Text style={[styles.timerStatusText, { color: timerColor }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Callee Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: isConnected ? primaryColor + '50' : app_theme.colors.border }]}>
            <ExpoImage
              source={avatarUrl ? { uri: avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}` } : require('../../assets/profile_black.jpg')}
              style={styles.avatarImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>

      {/* Bottom Action Controls */}
      <View style={styles.bottomControlsSection}>
        <View style={styles.actionGridRow}>
          {/* Mute Button */}
          <View style={styles.actionItem}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCircleBtn,
                {
                  backgroundColor: activeCall.isMuted
                    ? activeBtnBg
                    : inactiveBtnBg,
                  borderColor: activeCall.isMuted
                    ? activeBtnBg
                    : inactiveBtnBorder,
                },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => callManager.toggleMute()}
            >
              <IconApp
                pack="MC"
                name={activeCall.isMuted ? 'microphone-off' : 'microphone'}
                size={26}
                color={activeCall.isMuted ? activeBtnFg : inactiveBtnIconColor}
              />
            </Pressable>
            <Text style={[styles.actionLabel, { color: textColor }]}>
              {activeCall.isMuted ? strings.unmute || 'Unmute' : strings.mute || 'Mute'}
            </Text>
          </View>

          {/* Speaker Button */}
          <View style={styles.actionItem}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCircleBtn,
                {
                  backgroundColor: activeCall.isSpeaker
                    ? activeBtnBg
                    : inactiveBtnBg,
                  borderColor: activeCall.isSpeaker
                    ? activeBtnBg
                    : inactiveBtnBorder,
                },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => callManager.toggleSpeaker()}
            >
              <IconApp
                pack="MC"
                name={activeCall.isSpeaker ? 'volume-high' : 'volume-medium'}
                size={26}
                color={activeCall.isSpeaker ? activeBtnFg : inactiveBtnIconColor}
              />
            </Pressable>
            <Text style={[styles.actionLabel, { color: textColor }]}>
              {activeCall.isSpeaker ? strings.speaker || 'Speaker' : strings.earpiece || 'Earpiece'}
            </Text>
          </View>
        </View>

        {/* End Call Red Circle Button */}
        <View style={styles.endCallWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.endCallRedCircle,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleEndCall}
          >
            <IconApp pack="MC" name="phone-hangup" size={32} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  </AnimatedReanimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: (StatusBar.currentHeight || 36) + 16,
    paddingBottom: 54,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  minimizeBtn: {
    position: 'absolute',
    left: 0,
    top: -4,
    padding: 8,
    zIndex: 10,
  },
  appHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactName: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  hdBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  hdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timerStatusText: {
    fontSize: 18,
    fontWeight: '500',
  },
  avatarSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  avatarRing: {
    padding: 4,
    borderRadius: 65,
    borderWidth: 2,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControlsSection: {
    alignItems: 'center',
    width: '100%',
  },
  actionGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    marginBottom: 44,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
  endCallWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  endCallRedCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#EA4335',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});

export default AudioCallScreen;


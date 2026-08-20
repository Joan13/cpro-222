import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useAppSelector } from '../../store/app/hooks';
import { IconApp } from '../../components/app/IconApp';
import { callManager, ActiveCallData } from '../../services/call/CallManager';
import { media_url, formatPhoneInternational } from '../../../GlobalVariables';
import { strings } from '../../lang/lang';
import { TUser } from '../../types/types';

export const AudioCallScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const app_theme = useAppSelector((state) => state.app_theme);
  const contacts = useAppSelector((state) => state.app.raw_contacts);
  const [callData, setCallData] = useState<ActiveCallData | null>(callManager.getCallData());

  useEffect(() => {
    const unsubscribe = callManager.subscribe((data) => {
      setCallData(data);
      if (!data || data.status === 'ENDED') {
        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }, 1500);
      }
    });
    return () => unsubscribe();
  }, [navigation]);

  if (!callData) {
    return null;
  }

  const targetPhoneNumber = callData.isCaller ? callData.calleeId : callData.callerId;
  const contact = contacts.find((c) => c.phoneNumber === targetPhoneNumber);
  const displayName = contact ? contact.displayName : formatPhoneInternational({ phone_number: targetPhoneNumber } as TUser);
  const avatarUrl = callData.calleeAvatar || callData.callerAvatar;

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callData.status) {
      case 'OUTGOING_RINGING':
        return strings.calling || 'Calling...';
      case 'INCOMING_RINGING':
        return strings.incoming_call || 'Incoming Call';
      case 'CONNECTING':
        return strings.loading || 'Connecting...';
      case 'CONNECTED':
        return formatDuration(callData.durationSeconds);
      case 'RECONNECTING':
        return strings.reconnecting || 'Reconnecting...';
      case 'BUSY':
        return strings.user_busy || 'User Busy';
      case 'FAILED':
        return callData.errorMessage || strings.call_failed || 'Call Failed';
      case 'ENDED':
        return strings.call_ended || 'Call Ended';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: app_theme.colors.background }]}>
      <StatusBar barStyle={app_theme.dark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.encryptionBadge}>
          <IconApp pack="FI" name="lock" size={14} color={app_theme.colors.gray || '#8E8E93'} />
          <Text style={[styles.encryptionText, { color: app_theme.colors.gray || '#8E8E93' }]}>
            End-to-end encrypted P2P
          </Text>
        </View>
      </View>

      {/* Avatar & User Details */}
      <View style={styles.profileSection}>
        <View style={[styles.avatarContainer, { borderColor: app_theme.colors.border }]}>
          {avatarUrl ? (
            <ExpoImage
              source={{ uri: avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}` }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: app_theme.colors.border }]}>
              <IconApp pack="FA" name="user" size={64} color={app_theme.colors.header_foreground_color} />
            </View>
          )}
        </View>

        <Text style={[styles.userNameText, { color: app_theme.colors.text }]}>{displayName}</Text>
        <Text style={[styles.statusText, { color: app_theme.colors.primary || '#34C759' }]}>
          {getStatusText()}
        </Text>
      </View>

      {/* Action Controls */}
      <View style={styles.controlsSection}>
        <View style={styles.actionRow}>
          {/* Mute Button */}
          <Pressable
            style={[
              styles.controlButton,
              { backgroundColor: callData.isMuted ? app_theme.colors.primary || '#007AFF' : app_theme.colors.border + '60' },
            ]}
            onPress={() => callManager.toggleMute()}
          >
            <IconApp
              pack="MC"
              name={callData.isMuted ? 'microphone-off' : 'microphone'}
              size={28}
              color={callData.isMuted ? '#FFFFFF' : app_theme.colors.header_foreground_color}
            />
            <Text style={[styles.controlLabel, { color: app_theme.colors.text }]}>
              {callData.isMuted ? strings.unmute || 'Unmute' : strings.mute || 'Mute'}
            </Text>
          </Pressable>

          {/* Speaker Button */}
          <Pressable
            style={[
              styles.controlButton,
              { backgroundColor: callData.isSpeaker ? app_theme.colors.primary || '#007AFF' : app_theme.colors.border + '60' },
            ]}
            onPress={() => callManager.toggleSpeaker()}
          >
            <IconApp
              pack="MC"
              name={callData.isSpeaker ? 'volume-high' : 'volume-medium'}
              size={28}
              color={callData.isSpeaker ? '#FFFFFF' : app_theme.colors.header_foreground_color}
            />
            <Text style={[styles.controlLabel, { color: app_theme.colors.text }]}>
              {callData.isSpeaker ? strings.speaker || 'Speaker' : strings.earpiece || 'Earpiece'}
            </Text>
          </Pressable>
        </View>

        {/* End Call Button */}
        <View style={styles.endCallContainer}>
          <Pressable
            style={styles.endCallButton}
            onPress={() => callManager.endCall('USER_ENDED')}
          >
            <IconApp pack="MC" name="phone-hangup" size={34} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.controlLabel, { color: '#FF3B30', marginTop: 8 }]}>
            {strings.end_call || 'End Call'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 16,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  encryptionText: {
    fontSize: 12,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  controlsSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 40,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  endCallContainer: {
    alignItems: 'center',
  },
  endCallButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default AudioCallScreen;

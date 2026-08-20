import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useAppSelector } from '../../store/app/hooks';
import { IconApp } from '../../components/app/IconApp';
import { callManager, ActiveCallData } from '../../services/call/CallManager';
import { strings } from '../../lang/lang';
import { formatPhoneInternational } from '../../../GlobalVariables';
import { TUser } from '../../types/types';

export const VideoCallScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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

  const localStreamUrl = callData.localStream ? callData.localStream.toURL() : null;
  const remoteStreamUrl = callData.remoteStream ? callData.remoteStream.toURL() : null;

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Main Remote Video View */}
      {remoteStreamUrl && callData.status === 'CONNECTED' ? (
        <RTCView
          streamURL={remoteStreamUrl}
          style={styles.fullScreenVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <View style={[styles.fullScreenVideo, { backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' }]}>
          <IconApp pack="FA" name="user" size={80} color="#8E8E93" />
          <Text style={styles.remotePlaceholderText}>{displayName}</Text>
          <Text style={styles.remotePlaceholderStatus}>{getStatusText()}</Text>
        </View>
      )}

      {/* Floating Local Camera Preview */}
      {localStreamUrl && !callData.isCameraOff ? (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={localStreamUrl}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
        </View>
      ) : null}

      {/* Overlay Header */}
      <SafeAreaView style={styles.overlayHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.callerName}>{displayName}</Text>
          <Text style={styles.callStatus}>{getStatusText()}</Text>
        </View>
      </SafeAreaView>

      {/* Overlay Action Controls */}
      <SafeAreaView style={styles.overlayFooter}>
        <View style={styles.controlsRow}>
          {/* Mute Microphone */}
          <Pressable
            style={[styles.controlBtn, callData.isMuted && styles.controlBtnActive]}
            onPress={() => callManager.toggleMute()}
          >
            <IconApp
              pack="MC"
              name={callData.isMuted ? 'microphone-off' : 'microphone'}
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          {/* Toggle Video Camera */}
          <Pressable
            style={[styles.controlBtn, callData.isCameraOff && styles.controlBtnActive]}
            onPress={() => callManager.toggleCamera()}
          >
            <IconApp
              pack="MC"
              name={callData.isCameraOff ? 'camera-off' : 'camera'}
              size={24}
              color="#FFFFFF"
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
            style={[styles.controlBtn, callData.isSpeaker && styles.controlBtnActive]}
            onPress={() => callManager.toggleSpeaker()}
          >
            <IconApp
              pack="MC"
              name={callData.isSpeaker ? 'volume-high' : 'volume-medium'}
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          {/* Hangup Red Button */}
          <Pressable
            style={styles.hangupBtn}
            onPress={() => callManager.endCall('USER_ENDED')}
          >
            <IconApp pack="MC" name="phone-hangup" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
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
  remotePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  remotePlaceholderStatus: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF33',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    zIndex: 10,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  headerContent: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  callStatus: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  overlayFooter: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 36,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: '#007AFF',
  },
  hangupBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default VideoCallScreen;

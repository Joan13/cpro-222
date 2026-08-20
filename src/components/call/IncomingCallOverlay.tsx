import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useAppSelector } from '../../store/app/hooks';
import { IconApp } from '../app/IconApp';
import { callManager, ActiveCallData } from '../../services/call/CallManager';
import { media_url, formatPhoneInternational } from '../../../GlobalVariables';
import { strings } from '../../lang/lang';
import { TUser } from '../../types/types';

export const IncomingCallOverlay: React.FC<{ navigation: any }> = ({ navigation }) => {
  const app_theme = useAppSelector((state) => state.app_theme);
  const contacts = useAppSelector((state) => state.app.raw_contacts);
  const [callData, setCallData] = useState<ActiveCallData | null>(callManager.getCallData());

  useEffect(() => {
    const unsubscribe = callManager.subscribe((data) => {
      setCallData(data);
      if (data && !data.isCaller && (data.status === 'CONNECTING' || data.status === 'CONNECTED')) {
        // Automatically navigate to call screen for recipient upon accepting call
        if (data.type === 'audio') {
          navigation.navigate('AudioCallScreen');
        } else {
          navigation.navigate('VideoCallScreen');
        }
      }
    });
    return () => unsubscribe();
  }, [navigation]);

  if (!callData || callData.status !== 'INCOMING_RINGING') {
    return null;
  }

  const callerPhoneNumber = callData.callerId;
  const contact = contacts.find((c) => c.phoneNumber === callerPhoneNumber);
  const displayName = contact ? contact.displayName : formatPhoneInternational({ phone_number: callerPhoneNumber } as TUser);
  const avatarUrl = callData.callerAvatar;

  const handleAccept = async () => {
    const accepted = await callManager.acceptCall();
    if (accepted) {
      if (callData.type === 'audio') {
        navigation.navigate('AudioCallScreen');
      } else {
        navigation.navigate('VideoCallScreen');
      }
    }
  };

  const handleDecline = () => {
    callManager.rejectCall();
  };

  return (
    <Modal transparent animationType="slide" visible={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.cardContainer, { backgroundColor: app_theme.colors.card || app_theme.colors.background || '#1C1C1E' }]}>
          {/* Header & Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { borderColor: app_theme.colors.border }]}>
              {avatarUrl ? (
                <ExpoImage
                  source={{ uri: avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}` }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: app_theme.colors.border }]}>
                  <IconApp pack="FA" name="user" size={40} color={app_theme.colors.header_foreground_color} />
                </View>
              )}
            </View>
            <View style={styles.infoCol}>
              <Text style={[styles.callerName, { color: app_theme.colors.text }]}>{displayName}</Text>
              <Text style={[styles.callType, { color: app_theme.colors.primary || '#34C759' }]}>
                {callData.type === 'audio'
                  ? strings.incoming_audio_call || 'Incoming Audio Call'
                  : strings.incoming_video_call || 'Incoming Video Call'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {/* Decline */}
            <Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline}>
              <IconApp pack="MC" name="phone-hangup" size={28} color="#FFFFFF" />
            </Pressable>

            {/* Accept */}
            <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept}>
              <IconApp pack="MC" name="phone" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    paddingTop: 50,
    alignItems: 'center',
  },
  cardContainer: {
    width: '92%',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
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
    marginLeft: 16,
    flex: 1,
  },
  callerName: {
    fontSize: 20,
    fontWeight: '700',
  },
  callType: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  declineBtn: {
    backgroundColor: '#FF3B30',
  },
  acceptBtn: {
    backgroundColor: '#34C759',
  },
});

export default IncomingCallOverlay;

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, StatusBar } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../store/app/hooks';
import { IconApp } from '../app/IconApp';
import { callManager, ActiveCallData } from '../../services/call/CallManager';
import { media_url, formatPhoneInternational } from '../../../GlobalVariables';
import { strings } from '../../lang/lang';
import { TUser } from '../../types/types';

import AnimatedReanimated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useObject } from '@realm/react';
import { UserContacts } from '../../store/database/Models';

export const IncomingCallOverlay: React.FC<{ navigation: any }> = ({ navigation }) => {
  const app_theme = useAppSelector((state) => state.app_theme);
  const contacts = useAppSelector((state) => state.app.raw_contacts);
  const [callData, setCallData] = useState<ActiveCallData | null>(callManager.getCallData());
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = callManager.subscribe((data) => {
      setCallData(data);
      if (!data || data.status === 'ENDED' || data.status === 'FAILED' || data.status === 'BUSY') {
        setIsAccepting(false);
      }
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
    const interval = setInterval(checkRoute, 300);
    return () => clearInterval(interval);
  }, [navigation]);

  const callerPhoneNumber = callData?.callerId || '';
  const realmContact = useObject(UserContacts, callerPhoneNumber);

  const isRinging = callData && (callData.status === 'INCOMING_RINGING' || (isAccepting && callData.status === 'CONNECTING'));

  if (!isRinging) {
    return null;
  }

  if (currentRoute === 'AudioCallScreen' || currentRoute === 'VideoCallScreen') {
    return null;
  }

  const contact = contacts.find((c) => c.phoneNumber === callerPhoneNumber);
  const displayName = contact ? contact.displayName : formatPhoneInternational({ phone_number: callerPhoneNumber } as TUser);
  const avatarUrl = (contact && ((contact as any).imageProfileUrl || (contact as any).avatar)) || callData.callerAvatar;
  const fullAvatarUri = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}`) : null;
  const isVerified = Boolean(realmContact?.user_verified === 1 || (contact && ((contact as any).user_verified === 1 || (contact as any).isVerified)));

  const isVideo = callData.type === 'video';
  const acceptGreen = '#34C759';
  const declineRed = '#FF3B30';
  const highColor = app_theme.colors.high_color || acceptGreen;
  const hasCustomBackground = Boolean(fullAvatarUri || isVideo);

  const backgroundColor = isVideo
    ? (app_theme.dark ? '#000000' : '#1C1C1E')
    : (app_theme.colors.background || (app_theme.dark ? '#000000' : '#FFFFFF'));
  const textColor = hasCustomBackground ? '#FFFFFF' : (app_theme.colors.text || (app_theme.dark ? '#FFFFFF' : '#000000'));
  const subtitleColor = hasCustomBackground ? '#E5E5EA' : highColor;

  const handleAccept = async () => {
    setIsAccepting(true);
    if (callData.type === 'audio') {
      navigation.navigate('AudioCallScreen');
    } else {
      navigation.navigate('VideoCallScreen');
    }
    await callManager.acceptCall();
  };

  const handleDecline = () => {
    setIsAccepting(false);
    callManager.rejectCall();
  };

  return (
    <AnimatedReanimated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(250)}
      style={[styles.absoluteOverlay, { backgroundColor }]}
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

      <SafeAreaView style={styles.fullContainer}>
        <StatusBar
          barStyle={fullAvatarUri || isVideo || app_theme.dark ? 'light-content' : 'dark-content'}
          translucent
          backgroundColor="transparent"
        />

        {/* Top Header Section */}
        <View style={styles.topSection}>
          <Text style={[styles.callTypeSubtitle, { color: subtitleColor }]}>
            {isVideo
              ? (strings.incoming_video_call || 'Incoming Video Call')
              : (strings.incoming_audio_call || 'Incoming Audio Call')}
          </Text>

          <View style={styles.nameWithBadgeRow}>
            <Text style={[styles.contactNameText, { color: textColor }]} numberOfLines={1}>
              {displayName}
            </Text>
            {isVerified && (
              <IconApp pack="MT" name="verified" size={22} color={highColor} styles={{ marginLeft: 6 }} />
            )}
          </View>

          {/* Caller Profile Avatar Ring */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarRing, { borderColor: acceptGreen + '60' }]}>
              <ExpoImage
                source={avatarUrl ? { uri: avatarUrl.startsWith('http') ? avatarUrl : `${media_url}/profile_pictures/${avatarUrl}` } : require('../../assets/profile_black.jpg')}
                style={styles.avatarImg}
                contentFit="cover"
              />
            </View>
          </View>
        </View>

        {/* Bottom Action Controls */}
        <View style={styles.bottomSection}>
          <View style={styles.actionsRow}>
            {/* Decline Action */}
            <View style={styles.actionCol}>
              <Pressable
                style={({ pressed }) => [
                  styles.circleBtn,
                  { backgroundColor: declineRed },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleDecline}
              >
                <IconApp pack="MC" name="phone-hangup" size={34} color="#FFFFFF" />
              </Pressable>
              <Text style={[styles.actionLabelText, { color: textColor }]}>
                {strings.decline || 'Decline'}
              </Text>
            </View>

            {/* Accept Action */}
            <View style={styles.actionCol}>
              <Pressable
                style={({ pressed }) => [
                  styles.circleBtn,
                  { backgroundColor: acceptGreen },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleAccept}
              >
                <IconApp pack="MC" name={isVideo ? 'video' : 'phone'} size={34} color="#FFFFFF" />
              </Pressable>
              <Text style={[styles.actionLabelText, { color: textColor }]}>
                {strings.accept || 'Accept'}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </AnimatedReanimated.View>
  );
};

const styles = StyleSheet.create({
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
  },
  fullContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: (StatusBar.currentHeight || 36) + 24,
    paddingBottom: 54,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  callTypeSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  nameWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  contactNameText: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatarRing: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 3.5,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 68,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  actionCol: {
    alignItems: 'center',
  },
  circleBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  declineCircle: {
    backgroundColor: '#FF3B30',
  },
  actionLabelText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
});

export default IncomingCallOverlay;

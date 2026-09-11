import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { useQuery, useRealm } from '@realm/react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { CallHistory } from '../../store/database/Models';
import { CallHistoryItem } from '../../components/lists/call/CallHistoryItem';
import { IconApp } from '../../components/app/IconApp';
import { strings } from '../../lang/lang';
import { callManager } from '../../services/call/CallManager';
import { YambiText } from '../../components/app/Text';
import { setCallsBadge } from '../../store/reducers/persistedAppSlice';

export const CallHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useAppSelector((state) => state.app_theme);
  const myUser = useAppSelector((state) => state.user_data);
  const dispatch = useAppDispatch();
  const realm = useRealm();

  const callLogs = useQuery(CallHistory, (logs) => logs.sorted('timestamp', true));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(setCallsBadge(0));
  }, [dispatch]);

  const handlePressItem = (item: CallHistory) => {
    navigation.navigate('Call', { callId: item._id });
  };

  const handleAudioCall = (peerPhone: string, peerName: string, avatar: string) => {
    callManager.startCall(peerPhone, 'audio', peerName, avatar);
    navigation.navigate('AudioCallScreen');
  };

  const handleVideoCall = (peerPhone: string, peerName: string, avatar: string) => {
    callManager.startCall(peerPhone, 'video', peerName, avatar);
    navigation.navigate('VideoCallScreen');
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert(
      strings.delete_log || 'Delete Log',
      strings.delete_log_confirm || 'Remove this call entry from history?',
      [
        { text: strings.cancel || 'Cancel', style: 'cancel' },
        {
          text: strings.delete || 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              realm.write(() => {
                const target = realm.objectForPrimaryKey(CallHistory, logId);
                if (target) {
                  realm.delete(target);
                }
              });
            } catch (e) {
              console.error('Error deleting call log:', e);
            }
          },
        },
      ]
    );
  };

  const handleClearAllHistory = () => {
    if (callLogs.length === 0) return;
    Alert.alert(
      strings.clear_call_history || 'Clear Call History',
      strings.clear_history_confirm || 'Are you sure you want to delete all call logs?',
      [
        { text: strings.cancel || 'Cancel', style: 'cancel' },
        {
          text: strings.clear || 'Clear All',
          style: 'destructive',
          onPress: () => {
            try {
              realm.write(() => {
                realm.delete(callLogs);
              });
            } catch (e) {
              console.error('Error clearing call history:', e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
      {/* Performant LegendList for Call History Items */}
      <LegendList
        data={Array.from(callLogs)}
        keyExtractor={(item: CallHistory) => item._id}
        estimatedItemSize={72}
        renderItem={({ item }: { item: CallHistory }) => (
          <CallHistoryItem
            item={item}
            myPhone={myUser.phone_number}
            onPressItem={handlePressItem}
            onAudioCall={handleAudioCall}
            onVideoCall={handleVideoCall}
            onDeleteLog={handleDeleteLog}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 500);
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.high_color + '15' }]}>
              <IconApp pack="MC" name="phone-log-outline" size={48} color={theme.colors.high_color} />
            </View>
            <YambiText
              text={strings.no_calls_yet || 'No call history yet'}
              size="normal"
              bold
              color="default"
              style={{ marginTop: 16, textAlign: 'center' }}
            />
            <YambiText
              text={strings.no_calls_empty_hint || 'Your audio and video calls will appear here.'}
              size="small"
              color="gray"
              style={{ marginTop: 6, textAlign: 'center' }}
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  clearHeaderBtn: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CallHistoryScreen;

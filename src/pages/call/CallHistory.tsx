import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { LegendList } from '@legendapp/list';
import { useQuery, useRealm } from '@realm/react';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { CallHistory, UserContacts } from '../../store/database/Models';
import { CallHistoryItem } from '../../components/lists/call/CallHistoryItem';
import { IconApp } from '../../components/app/IconApp';
import { strings } from '../../lang/lang';
import { callManager } from '../../services/call/CallManager';
import { YambiText } from '../../components/app/Text';
import { setCallsBadge } from '../../store/reducers/persistedAppSlice';
import { setSearchCallHistory } from '../../store/reducers/appSlice';

type CallFilterType = 'all' | 'missed' | 'incoming' | 'outgoing' | 'audio' | 'video';

export const CallHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useAppSelector((state) => state.app_theme);
  const myUser = useAppSelector((state) => state.user_data);
  const contacts = useAppSelector((state) => state.app.raw_contacts);
  const search_call_history = useAppSelector((state) => state.app.search_call_history);
  const call_active = useAppSelector((state) => state.app.call_active);
  const dispatch = useAppDispatch();
  const realm = useRealm();

  const callLogs = useQuery(CallHistory, (logs) => logs.sorted('timestamp', true));
  const realmContacts = useQuery(UserContacts);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<CallFilterType>('all');

  useEffect(() => {
    dispatch(setCallsBadge(0));
    callManager.syncCallHistory();
  }, [dispatch]);

  useEffect(() => {
    if (!search_call_history) {
      setSearchText('');
      setFilterType('all');
    }
  }, [search_call_history]);

  const filteredLogs = useMemo(() => {
    let result = Array.from(callLogs);

    // Filter by call category
    if (filterType === 'missed') {
      result = result.filter(
        (item) =>
          (item.direction === 'missed' ||
            item.status === 'MISSED' ||
            (item.durationSeconds === 0 &&
              item.direction !== 'outgoing' &&
              item.callerId !== myUser.phone_number)) &&
          item.direction !== 'rejected' &&
          item.status !== 'REJECTED'
      );
    } else if (filterType === 'incoming') {
      result = result.filter(
        (item) =>
          item.direction === 'incoming' ||
          (item.callerId !== myUser.phone_number && item.direction !== 'outgoing')
      );
    } else if (filterType === 'outgoing') {
      result = result.filter(
        (item) =>
          item.direction === 'outgoing' ||
          item.callerId === myUser.phone_number
      );
    } else if (filterType === 'audio') {
      result = result.filter((item) => item.type === 'audio');
    } else if (filterType === 'video') {
      result = result.filter((item) => item.type === 'video');
    }

    // Filter by text search query
    const cleanQuery = searchText.toLowerCase().trim();
    if (cleanQuery.length > 0) {
      result = result.filter((item) => {
        const peerPhone =
          item.callerId === myUser.phone_number ? item.calleeId : item.callerId;
        const contact = contacts.find((c: any) => c.phoneNumber === peerPhone);
        const realmContact = realmContacts.find((c: any) => c.phone_number === peerPhone);
        const name = (
          contact?.displayName ||
          realmContact?.user_names ||
          (item.callerId === myUser.phone_number
            ? item.calleeName
            : item.callerName) ||
          ''
        ).toLowerCase();

        return name.includes(cleanQuery) || (peerPhone && peerPhone.includes(cleanQuery));
      });
    }

    return result;
  }, [callLogs, filterType, searchText, contacts, realmContacts, myUser.phone_number]);

  const handlePressItem = (item: CallHistory) => {
    navigation.navigate('Call', { callId: item._id });
  };

  const handleAudioCall = (peerPhone: string, peerName: string, avatar: string) => {
    if (call_active) return;
    callManager.startCall(peerPhone, 'audio', peerName, avatar);
  };

  const handleVideoCall = (peerPhone: string, peerName: string, avatar: string) => {
    if (call_active) return;
    callManager.startCall(peerPhone, 'video', peerName, avatar);
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

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
      {/* Animated Search and Filter Header */}
      {search_call_history && (
        <Animated.View
          entering={SlideInUp.duration(200)}
          exiting={SlideOutUp.duration(150)}
          style={[
            styles.searchSection,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          {/* Search Input Bar */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.border + '30',
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={theme.colors.gray}
              style={{ marginRight: 8 }}
            />
            <TextInput
              autoFocus
              value={searchText}
              onChangeText={setSearchText}
              placeholder={strings.search_calls}
              placeholderTextColor={theme.colors.gray}
              style={[
                styles.searchInput,
                { color: theme.colors.text },
              ]}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable
                onPress={() => setSearchText('')}
                style={styles.clearBtn}
              >
                <Feather name="x" size={16} color={theme.colors.gray} />
              </Pressable>
            )}
          </View>

          {/* Quick Filter Options in Horizontal ScrollView */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
            style={styles.chipsScrollView}
          >
            {[
              { key: 'all', label: strings.filter_all },
              { key: 'missed', label: strings.filter_missed },
              { key: 'incoming', label: strings.filter_incoming },
              { key: 'outgoing', label: strings.filter_outgoing },
              { key: 'audio', label: strings.filter_audio },
              { key: 'video', label: strings.filter_video },
            ].map((chip) => {
              const isSelected = filterType === chip.key;
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => setFilterType(chip.key as CallFilterType)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.high_color
                        : theme.colors.border + '20',
                      borderColor: isSelected
                        ? theme.colors.high_color
                        : theme.colors.border,
                    },
                  ]}
                >
                  <YambiText
                    text={chip.label}
                    size="small"
                    color={isSelected ? 'white' : 'default'}
                    bold={isSelected}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* Performant LegendList for Call History Items */}
      <LegendList
        data={filteredLogs}
        keyboardShouldPersistTaps='handled'
        keyExtractor={(item: CallHistory) => item._id}
        estimatedItemSize={80}
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
              callManager.syncCallHistory().finally(() => setRefreshing(false));
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          searchText.trim().length > 0 || filterType !== 'all' ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.high_color + '15' }]}>
                <IconApp pack="FI" name="search" size={40} color={theme.colors.high_color} />
              </View>
              <YambiText
                text={strings.no_calls_found}
                size="normal"
                bold
                color="default"
                style={{ marginTop: 16, textAlign: 'center' }}
              />
              <YambiText
                text={strings.no_calls_found_desc}
                size="small"
                color="gray"
                style={{ marginTop: 6, textAlign: 'center' }}
              />
            </View>
          ) : (
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
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsScrollView: {
    marginTop: 10,
  },
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CallHistoryScreen;

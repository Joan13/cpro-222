import { AppState, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from '../../store/app/store';
import { setCallsBadge } from '../../store/reducers/persistedAppSlice';
import { setCallActive } from '../../store/reducers/appSlice';
import { openRealmInstance, safeRealmWrite } from '../RealmInstance';
import Realm from 'realm';
import YambiCall, { NativeCallHistoryEntry } from 'yambi-call';
import { syncNativeCallStrings } from '../../lang/lang';

export type CallState =
  | 'IDLE'
  | 'OUTGOING_CALLING'
  | 'OUTGOING_RINGING'
  | 'INCOMING_RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ENDING'
  | 'ENDED'
  | 'FAILED'
  | 'BUSY'
  | 'REJECTED';

export interface ActiveCallData {
  callId: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  callerAvatar?: string;
  calleeName: string;
  calleeAvatar?: string;
  type: 'audio' | 'video';
  isCaller: boolean;
  status: CallState;
  durationSeconds: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isCameraOff: boolean;
  localStream: any | null;
  remoteStream: any | null;
  errorMessage?: string;
}

type CallStateListener = (callData: ActiveCallData | null) => void;

class CallManager {
  private currentUserPhoneNumber: string = '';
  private currentUserName: string = '';
  private currentUserAvatar: string = '';
  private listeners: Set<CallStateListener> = new Set();
  private nativeListenersAttached: boolean = false;
  private isSyncing: boolean = false;

  constructor() {
    this.setupNativeCallListeners();
  }

  /**
   * Initialise le numéro de l'utilisateur et synchronise l'historique.
   */
  public async init(userPhoneNumber: string, userName: string = '', userAvatar: string = '') {
    if (!userPhoneNumber) return;
    this.currentUserPhoneNumber = userPhoneNumber;
    this.currentUserName = userName || userPhoneNumber;
    this.currentUserAvatar = userAvatar;

    try {
      YambiCall.setUserPhone(userPhoneNumber);
      syncNativeCallStrings();
      const active = await YambiCall.isCallActive();
      store.dispatch(setCallActive(active));
    } catch (e) {
      console.warn('[CallManager] Error initializing native module:', e);
    }

    this.setupNativeCallListeners();
    await this.syncCallHistory();
  }

  /**
   * Attache les écouteurs d'événements du module natif YambiCall.
   */
  public setupNativeCallListeners() {
    if (this.nativeListenersAttached) return;
    this.nativeListenersAttached = true;

    try {
      YambiCall.initialize();

      YambiCall.addListener('onCallStarted', (event: any) => {
        console.log('[CallManager] Native call started:', event);
        store.dispatch(setCallActive(true));
      });

      YambiCall.addListener('onCallEnded', async (event: any) => {
        console.log('[CallManager] Native call ended, syncing call history:', event);
        store.dispatch(setCallActive(false));
        await this.syncCallHistory();
      });

      YambiCall.addListener('onCallAnswered', (event: any) => {
        console.log('[CallManager] Native call answered:', event);
        store.dispatch(setCallActive(true));
      });

      YambiCall.addListener('onCallRejected', async (event: any) => {
        console.log('[CallManager] Native call rejected:', event);
        store.dispatch(setCallActive(false));
        await this.syncCallHistory();
      });

      YambiCall.addListener('onVoIPTokenReceived', (event: { token: string }) => {
        console.log('[CallManager] VoIP token received from native:', event.token);
      });

      AppState.addEventListener('change', async (state) => {
        if (state === 'active') {
          try {
            const active = await YambiCall.isCallActive();
            store.dispatch(setCallActive(active));
          } catch (e) {}
        }
      });
    } catch (err) {
      console.error('[CallManager] Error attaching native call listeners:', err);
    }
  }

  /**
   * Demande les permissions microphone et caméra.
   */
  private async requestCallPermissions(type: 'audio' | 'video'): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (type === 'video') {
        permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const micGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      const camGranted =
        type === 'video'
          ? granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED
          : true;

      return micGranted && camGranted;
    } catch (err) {
      console.error('[CallManager] Error requesting permissions:', err);
      return false;
    }
  }

  /**
   * Démarre un appel sortant en déléguant intégralement au module natif (ActiveCallActivity / CallKit).
   */
  public async startCall(
    calleeId: string,
    type: 'audio' | 'video',
    calleeName = '',
    calleeAvatar = ''
  ): Promise<string | null> {
    if (!calleeId) {
      console.warn('[CallManager] Cannot start call: missing calleeId');
      return null;
    }

    if (store.getState()?.app?.call_active) {
      console.warn('[CallManager] Cannot start call: another call is already active');
      return null;
    }

    try {
      const nativeActive = await YambiCall.isCallActive();
      if (nativeActive) {
        store.dispatch(setCallActive(true));
        console.warn('[CallManager] Cannot start call: native call session is already active');
        return null;
      }
    } catch (e) {}

    if (!this.currentUserPhoneNumber) {
      await this.resolveConnectedUserAsync();
    }

    const hasPermissions = await this.requestCallPermissions(type);
    if (!hasPermissions) {
      console.warn('[CallManager] Cannot start call: permissions denied');
      return null;
    }

    try {
      let finalCalleeAvatar = calleeAvatar || '';
      let finalCalleeName = calleeName || '';
      try {
        const realm = await openRealmInstance();
        if (realm && !realm.isClosed && calleeId) {
          const contact = realm.objects('UserContacts').filtered('phone_number == $0', calleeId)[0] as any;
          if (contact) {
            if (!finalCalleeAvatar && contact.user_profile) {
              finalCalleeAvatar = contact.user_profile;
            }
            if (!finalCalleeName && (contact.user_names || contact.displayName)) {
              finalCalleeName = contact.displayName || contact.user_names;
            }
          }
        }
      } catch (_e) {}

      if (
        finalCalleeAvatar &&
        (finalCalleeAvatar === 'null' ||
          finalCalleeAvatar === 'undefined' ||
          finalCalleeAvatar === 'none' ||
          finalCalleeAvatar.includes('profile_black'))
      ) {
        finalCalleeAvatar = '';
      }

      if (finalCalleeAvatar && !finalCalleeAvatar.startsWith('http')) {
        const cleanAvatar = finalCalleeAvatar.startsWith('/') ? finalCalleeAvatar.slice(1) : finalCalleeAvatar;
        finalCalleeAvatar = cleanAvatar.startsWith('profile_pictures/')
          ? `https://server.yambi.net/media/${cleanAvatar}`
          : `https://server.yambi.net/media/profile_pictures/${cleanAvatar}`;
      }

      console.log(`[CallManager] Starting native ${type} call to ${calleeId} (${finalCalleeName}) avatar=${finalCalleeAvatar}`);
      store.dispatch(setCallActive(true));
      const callId = await YambiCall.startOutgoingCall({
        calleeId,
        calleeName: finalCalleeName || calleeId,
        calleeAvatar: finalCalleeAvatar,
        callerId: this.currentUserPhoneNumber,
        callerName: this.currentUserName,
        callerAvatar: this.currentUserAvatar,
        callType: type,
      });

      if (!callId) {
        store.dispatch(setCallActive(false));
        return null;
      }

      return callId;
    } catch (err) {
      store.dispatch(setCallActive(false));
      console.error('[CallManager] Error starting native outgoing call:', err);
      return null;
    }
  }

  /**
   * Synchronise l'historique d'appels natif (SQLite) vers la base Realm locale de l'application.
   */
  public async syncCallHistory(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const entries: NativeCallHistoryEntry[] = await YambiCall.getUnsyncedCallHistory();
      if (!entries || entries.length === 0) {
        return;
      }

      console.log(`[CallManager] Syncing ${entries.length} call history entries from SQLite to Realm...`);
      const realm = await openRealmInstance();
      const syncedIds: string[] = [];
      let missedCount = 0;

      await safeRealmWrite(realm, () => {
        for (const entry of entries) {
          realm.create(
            'CallHistory',
            {
              _id: entry.id,
              callId: entry.callId,
              callerId: entry.callerId,
              calleeId: entry.calleeId,
              callerName: entry.callerName || entry.callerId,
              callerAvatar: entry.callerAvatar || '',
              calleeName: entry.calleeName || entry.calleeId,
              calleeAvatar: entry.calleeAvatar || '',
              type: entry.type || 'audio',
              direction: entry.direction,
              status: entry.status,
              durationSeconds: entry.durationSeconds || 0,
              createdAt: entry.createdAt || new Date().toISOString(),
              timestamp: entry.timestamp || Date.now(),
            },
            Realm.UpdateMode.Modified
          );

          if (entry.direction === 'missed') {
            missedCount++;
          }
          syncedIds.push(entry.id);
        }
      });

      await YambiCall.markCallHistorySynced(syncedIds);
      console.log(`[CallManager] Successfully synced and marked ${syncedIds.length} entries`);

      if (missedCount > 0) {
        const currentBadge = store.getState()?.persisted_app?.calls_badge || 0;
        store.dispatch(setCallsBadge(currentBadge + missedCount));
      }
    } catch (err) {
      console.error('[CallManager] Error syncing call history:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  private async resolveConnectedUserAsync(): Promise<{ phone?: string; name?: string } | null> {
    try {
      const state = store.getState();
      const phone = state?.user_data?.phone_number;
      const name = state?.user_data?.user_names;
      if (phone) {
        this.currentUserPhoneNumber = phone;
        this.currentUserName = name || phone;
        YambiCall.setUserPhone(phone);
        return { phone, name };
      }

      const cachedUser = await AsyncStorage.getItem('user_data');
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        if (parsed?.phone_number) {
          this.currentUserPhoneNumber = parsed.phone_number;
          this.currentUserName = parsed.user_names || parsed.phone_number;
          YambiCall.setUserPhone(parsed.phone_number);
          return { phone: parsed.phone_number, name: parsed.user_names };
        }
      }
    } catch (e) {
      console.error('[CallManager] Error resolving connected user:', e);
    }
    return null;
  }

  // ─── Rétrocompatibilité UI React Native ─────────────────────────────────────

  public getCallData(): ActiveCallData | null {
    return null;
  }

  public subscribe(listener: CallStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public async checkPendingCall(): Promise<boolean> {
    await this.syncCallHistory();
    return false;
  }

  public async acceptCall(): Promise<boolean> {
    return true;
  }

  public rejectCall(_payload?: any) {}

  public endCall(_reason?: string) {}

  public toggleMute(): boolean {
    return false;
  }

  public toggleSpeaker(): boolean {
    return false;
  }

  public toggleCamera(): boolean {
    return false;
  }

  public switchCamera(): boolean {
    return false;
  }

  public handleIncomingInviteFromNotification(_payload: any) {}
}

export const callManager = new CallManager();

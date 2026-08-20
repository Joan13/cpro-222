import { webRTCManager } from './WebRTCManager';
import { callSignaling, CallInvitePayload, CallSignalPayload } from './CallSignaling';
import { MediaStream } from 'react-native-webrtc';
import { PermissionsAndroid, Platform } from 'react-native';
import store from '../../store/app/store';
import { setCallState } from '../../store/reducers/appSlice';

export type CallState =
  | 'IDLE'
  | 'OUTGOING_RINGING'
  | 'INCOMING_RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ENDING'
  | 'ENDED'
  | 'FAILED'
  | 'BUSY';

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
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  errorMessage?: string;
}

type CallStateListener = (callData: ActiveCallData | null) => void;

class CallManager {
  private currentCall: ActiveCallData | null = null;
  private currentUserPhoneNumber: string = '';
  private currentUserName: string = '';
  private currentUserAvatar: string = '';
  private isStartingCall: boolean = false;

  private listeners: Set<CallStateListener> = new Set();
  private durationTimer: any = null;
  private ringTimeoutTimer: any = null;

  public init(userPhoneNumber: string, userName: string = '', userAvatar: string = '') {
    this.currentUserPhoneNumber = userPhoneNumber;
    this.currentUserName = userName || userPhoneNumber;
    this.currentUserAvatar = userAvatar;

    callSignaling.init(userPhoneNumber);
    callSignaling.registerListeners({
      onInvite: this.handleIncomingInvite.bind(this),
      onRinging: this.handleCallRinging.bind(this),
      onAccept: this.handleCallAccepted.bind(this),
      onReject: this.handleCallRejected.bind(this),
      onCancel: this.handleCallCancelled.bind(this),
      onOffer: this.handleCallOffer.bind(this),
      onAnswer: this.handleCallAnswer.bind(this),
      onIceCandidate: this.handleRemoteIceCandidate.bind(this),
      onBusy: this.handleCallBusy.bind(this),
      onEnd: this.handleCallEnded.bind(this),
    });
  }

  public subscribe(listener: CallStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentCall);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const status = this.currentCall ? this.currentCall.status : 'IDLE';
    console.log(`[CallManager] State updated -> ${status}`);
    try {
      store.dispatch(setCallState(status));
    } catch (e) {
      console.error('[CallManager] Error dispatching setCallState to store:', e);
    }
    this.listeners.forEach((listener) => listener(this.currentCall ? { ...this.currentCall } : null));
  }

  public getCallData(): ActiveCallData | null {
    return this.currentCall;
  }

  public async requestCallPermissions(type: 'audio' | 'video'): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (type === 'video') {
          permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const micGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const camGranted = type === 'video' ? granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED : true;

        return micGranted && camGranted;
      } catch (err) {
        console.error('[CallManager] Android permission request error:', err);
        return false;
      }
    }
    return true;
  }

  public async startCall(
    calleeId: string,
    type: 'audio' | 'video',
    calleeName: string = '',
    calleeAvatar: string = ''
  ): Promise<boolean> {
    const isReduxCallActive = store.getState().app.call_active;
    if (this.isStartingCall || isReduxCallActive || (this.currentCall && this.currentCall.status !== 'IDLE' && this.currentCall.status !== 'ENDED')) {
      console.warn('[CallManager] Cannot start new call: Another call is already active or starting');
      return false;
    }

    this.isStartingCall = true;

    const hasPermissions = await this.requestCallPermissions(type);
    if (!hasPermissions) {
      console.warn('[CallManager] Call cancelled: Required media permissions not granted');
      this.isStartingCall = false;
      return false;
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.currentCall = {
      callId,
      callerId: this.currentUserPhoneNumber,
      calleeId,
      callerName: this.currentUserName,
      callerAvatar: this.currentUserAvatar,
      calleeName: calleeName || calleeId,
      calleeAvatar,
      type,
      isCaller: true,
      status: 'OUTGOING_RINGING',
      durationSeconds: 0,
      isMuted: false,
      isSpeaker: type === 'video',
      isCameraOff: false,
      localStream: null,
      remoteStream: null,
    };

    this.notifyListeners();

    try {
      // Get local stream
      const localStream = await webRTCManager.getLocalStream(type);
      if (this.currentCall) {
        this.currentCall.localStream = localStream;
        this.notifyListeners();
      }

      // Send signaling invite
      const invitePayload: CallInvitePayload = {
        callId,
        callerId: this.currentUserPhoneNumber,
        calleeId,
        callerName: this.currentUserName,
        callerAvatar: this.currentUserAvatar,
        type,
        timestamp: Date.now(),
      };

      callSignaling.sendInvite(invitePayload);

      // Start 45s ringing timeout
      this.clearRingTimeout();
      const currentCallId = callId;
      this.ringTimeoutTimer = setTimeout(() => {
        if (this.currentCall && this.currentCall.callId === currentCallId && this.currentCall.status === 'OUTGOING_RINGING') {
          console.log(`[CallManager] Outgoing call (${currentCallId}) timed out (no answer)`);
          this.endCall('NO_ANSWER');
        }
      }, 45000);

      return true;
    } catch (error: any) {
      console.error('[CallManager] Error starting call:', error);
      this.currentCall.status = 'FAILED';
      this.currentCall.errorMessage = error?.message || 'Failed to acquire media stream';
      this.notifyListeners();
      setTimeout(() => this.cleanupCallState(), 3000);
      return false;
    } finally {
      this.isStartingCall = false;
    }
  }

  private handleIncomingInvite(payload: CallInvitePayload) {
    if (this.currentCall && this.currentCall.status !== 'IDLE' && this.currentCall.status !== 'ENDED') {
      console.log(`[CallManager] Incoming call from ${payload.callerId} rejected: User is busy`);
      callSignaling.sendBusy({
        callId: payload.callId,
        callerId: payload.callerId,
        calleeId: payload.calleeId,
      });
      return;
    }

    console.log(`[CallManager] Receiving incoming call invite from ${payload.callerName || payload.callerId}`);

    this.currentCall = {
      callId: payload.callId,
      callerId: payload.callerId,
      calleeId: payload.calleeId,
      callerName: payload.callerName || payload.callerId,
      callerAvatar: payload.callerAvatar,
      calleeName: this.currentUserName,
      calleeAvatar: this.currentUserAvatar,
      type: payload.type,
      isCaller: false,
      status: 'INCOMING_RINGING',
      durationSeconds: 0,
      isMuted: false,
      isSpeaker: payload.type === 'video',
      isCameraOff: false,
      localStream: null,
      remoteStream: null,
    };

    this.notifyListeners();

    // Send ringing confirmation back to caller
    callSignaling.sendRinging({
      callId: payload.callId,
      callerId: payload.callerId,
      calleeId: payload.calleeId,
    });

    // 45s incoming ring timeout
    this.clearRingTimeout();
    this.ringTimeoutTimer = setTimeout(() => {
      if (this.currentCall && this.currentCall.status === 'INCOMING_RINGING') {
        console.log('[CallManager] Incoming call timed out');
        this.cleanupCallState();
      }
    }, 45000);
  }

  private handleCallRinging(payload: CallSignalPayload) {
    if (this.currentCall && this.currentCall.callId === payload.callId) {
      console.log('[CallManager] Outgoing call is ringing on callee device');
    }
  }

  public async acceptCall(): Promise<boolean> {
    if (!this.currentCall || this.currentCall.status !== 'INCOMING_RINGING') {
      return false;
    }

    this.clearRingTimeout();

    const hasPermissions = await this.requestCallPermissions(this.currentCall.type);
    if (!hasPermissions) {
      console.warn('[CallManager] Cannot accept call: Permissions not granted');
      this.rejectCall();
      return false;
    }

    this.currentCall.status = 'CONNECTING';
    this.notifyListeners();

    try {
      const localStream = await webRTCManager.getLocalStream(this.currentCall.type);
      this.currentCall.localStream = localStream;

      this.setupWebRTCListeners();
      webRTCManager.createPeerConnection();

      // Send accept signal to caller
      callSignaling.sendAccept({
        callId: this.currentCall.callId,
        callerId: this.currentCall.callerId,
        calleeId: this.currentCall.calleeId,
      });

      this.notifyListeners();
      return true;
    } catch (error: any) {
      console.error('[CallManager] Error accepting call:', error);
      this.endCall('FAILED');
      return false;
    }
  }

  public rejectCall() {
    if (!this.currentCall) return;

    this.clearRingTimeout();

    callSignaling.sendReject({
      callId: this.currentCall.callId,
      callerId: this.currentCall.callerId,
      calleeId: this.currentCall.calleeId,
    });

    this.currentCall.status = 'ENDED';
    this.notifyListeners();
    this.cleanupCallState();
  }

  private async handleCallAccepted(payload: CallSignalPayload) {
    if (!this.currentCall || this.currentCall.callId !== payload.callId || !this.currentCall.isCaller) {
      return;
    }

    console.log('[CallManager] Callee accepted call. Initiating WebRTC offer...');
    this.clearRingTimeout();
    this.currentCall.status = 'CONNECTING';
    this.notifyListeners();

    try {
      this.setupWebRTCListeners();
      webRTCManager.createPeerConnection();

      const offer = await webRTCManager.createOffer();
      callSignaling.sendOffer({
        callId: this.currentCall.callId,
        callerId: this.currentCall.callerId,
        calleeId: this.currentCall.calleeId,
        offer,
      });
    } catch (error) {
      console.error('[CallManager] Error generating SDP offer:', error);
      this.endCall('FAILED');
    }
  }

  private async handleCallOffer(payload: CallSignalPayload) {
    if (!this.currentCall || this.currentCall.callId !== payload.callId || this.currentCall.isCaller) {
      return;
    }

    console.log('[CallManager] Received SDP offer. Generating SDP answer...');
    try {
      const answer = await webRTCManager.handleOfferAndCreateAnswer(payload.offer);
      callSignaling.sendAnswer({
        callId: this.currentCall.callId,
        callerId: this.currentCall.callerId,
        calleeId: this.currentCall.calleeId,
        answer,
      });
    } catch (error) {
      console.error('[CallManager] Error creating SDP answer:', error);
      this.endCall('FAILED');
    }
  }

  private async handleCallAnswer(payload: CallSignalPayload) {
    if (!this.currentCall || this.currentCall.callId !== payload.callId || !this.currentCall.isCaller) {
      return;
    }

    console.log('[CallManager] Received SDP answer from callee.');
    try {
      await webRTCManager.handleAnswer(payload.answer);
    } catch (error) {
      console.error('[CallManager] Error handling SDP answer:', error);
    }
  }

  private async handleRemoteIceCandidate(payload: CallSignalPayload) {
    if (this.currentCall && this.currentCall.callId === payload.callId && payload.candidate) {
      await webRTCManager.addIceCandidate(payload.candidate);
    }
  }

  private setupWebRTCListeners() {
    webRTCManager.setCallbacks({
      onIceCandidate: (candidate) => {
        if (this.currentCall) {
          callSignaling.sendIceCandidate({
            callId: this.currentCall.callId,
            callerId: this.currentCall.callerId,
            calleeId: this.currentCall.calleeId,
            candidate,
          });
        }
      },
      onRemoteStream: (stream) => {
        console.log('[CallManager] Remote stream received and attached to active call');
        if (this.currentCall) {
          this.currentCall.remoteStream = stream;
          this.notifyListeners();
        }
      },
      onConnectionStateChange: (state) => {
        console.log(`[CallManager] WebRTC Peer Connection State: ${state}`);
        if (!this.currentCall) return;

        if (state === 'connected') {
          this.currentCall.status = 'CONNECTED';
          this.startDurationCounter();
          this.notifyListeners();
        } else if (state === 'connecting') {
          this.currentCall.status = 'CONNECTING';
          this.notifyListeners();
        } else if (state === 'disconnected') {
          this.currentCall.status = 'RECONNECTING';
          this.notifyListeners();
        } else if (state === 'failed') {
          this.currentCall.status = 'FAILED';
          this.currentCall.errorMessage = 'PeerConnection failed (P2P direct connection could not be established)';
          this.notifyListeners();
          setTimeout(() => this.cleanupCallState(), 4000);
        }
      },
      onIceConnectionStateChange: (state) => {
        console.log(`[CallManager] WebRTC ICE Connection State: ${state}`);
        if (!this.currentCall) return;

        if (state === 'disconnected' || state === 'checking') {
          if (this.currentCall.status === 'CONNECTED') {
            this.currentCall.status = 'RECONNECTING';
            this.notifyListeners();
          }
        } else if (state === 'completed' || state === 'connected') {
          if (this.currentCall.status === 'RECONNECTING' || this.currentCall.status === 'CONNECTING') {
            this.currentCall.status = 'CONNECTED';
            this.startDurationCounter();
            this.notifyListeners();
          }
        } else if (state === 'failed') {
          this.currentCall.status = 'FAILED';
          this.currentCall.errorMessage = 'Direct P2P connection failed over STUN.';
          this.notifyListeners();
          setTimeout(() => this.cleanupCallState(), 4000);
        }
      },
    });
  }

  private handleCallRejected(payload: CallSignalPayload) {
    if (this.currentCall && this.currentCall.callId === payload.callId) {
      console.log('[CallManager] Call was declined by recipient');
      this.clearRingTimeout();
      this.currentCall.status = 'ENDED';
      this.notifyListeners();
      setTimeout(() => this.cleanupCallState(), 2000);
    }
  }

  private handleCallCancelled(payload: CallSignalPayload) {
    if (this.currentCall && this.currentCall.callId === payload.callId) {
      console.log('[CallManager] Call was cancelled by caller');
      this.clearRingTimeout();
      this.currentCall.status = 'ENDED';
      this.notifyListeners();
      this.cleanupCallState();
    }
  }

  private handleCallBusy(payload: CallSignalPayload) {
    if (this.currentCall && this.currentCall.callId === payload.callId) {
      console.log('[CallManager] Target user is busy');
      this.clearRingTimeout();
      this.currentCall.status = 'BUSY';
      this.notifyListeners();
      setTimeout(() => this.cleanupCallState(), 3000);
    }
  }

  private handleCallEnded(payload: CallSignalPayload) {
    if (this.currentCall && this.currentCall.callId === payload.callId) {
      console.log('[CallManager] Call ended by remote peer');
      this.endCall('REMOTE_ENDED', false);
    }
  }

  public toggleMute(): boolean {
    if (!this.currentCall) return false;
    const newMuted = !this.currentCall.isMuted;
    webRTCManager.toggleMute(newMuted);
    this.currentCall.isMuted = newMuted;
    this.notifyListeners();
    return newMuted;
  }

  public toggleSpeaker(): boolean {
    if (!this.currentCall) return false;
    const newSpeaker = !this.currentCall.isSpeaker;
    this.currentCall.isSpeaker = newSpeaker;
    this.notifyListeners();
    return newSpeaker;
  }

  public toggleCamera(): boolean {
    if (!this.currentCall) return false;
    const newCameraOff = !this.currentCall.isCameraOff;
    webRTCManager.toggleCamera(newCameraOff);
    this.currentCall.isCameraOff = newCameraOff;
    this.notifyListeners();
    return newCameraOff;
  }

  public switchCamera(): void {
    webRTCManager.switchCamera();
  }

  public endCall(reason: string = 'USER_ENDED', sendSignal: boolean = true) {
    if (!this.currentCall) return;

    console.log(`[CallManager] Ending call (${this.currentCall.callId}) - Reason: ${reason}`);

    this.clearRingTimeout();
    this.stopDurationCounter();

    if (sendSignal && this.currentCall.status !== 'IDLE' && this.currentCall.status !== 'ENDED') {
      if (this.currentCall.status === 'OUTGOING_RINGING') {
        callSignaling.sendCancel({
          callId: this.currentCall.callId,
          callerId: this.currentCall.callerId,
          calleeId: this.currentCall.calleeId,
        });
      } else {
        callSignaling.sendEnd({
          callId: this.currentCall.callId,
          callerId: this.currentCall.callerId,
          calleeId: this.currentCall.calleeId,
        });
      }
    }

    this.currentCall.status = 'ENDED';
    this.notifyListeners();
    this.cleanupCallState();
  }

  private startDurationCounter() {
    this.stopDurationCounter();
    this.durationTimer = setInterval(() => {
      if (this.currentCall && this.currentCall.status === 'CONNECTED') {
        this.currentCall.durationSeconds += 1;
        this.notifyListeners();
      }
    }, 1000);
  }

  private stopDurationCounter() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }

  private clearRingTimeout() {
    if (this.ringTimeoutTimer) {
      clearTimeout(this.ringTimeoutTimer);
      this.ringTimeoutTimer = null;
    }
  }

  private cleanupCallState() {
    console.log('[CallManager] Cleaning up call state and WebRTC connections');
    this.stopDurationCounter();
    this.clearRingTimeout();
    webRTCManager.closePeerConnection();
    this.currentCall = null;
    this.notifyListeners();
  }
}

export const callManager = new CallManager();

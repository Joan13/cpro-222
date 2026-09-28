export type CallType = 'audio' | 'video';

export interface IncomingCallData {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  calleeId?: string;
  callType: CallType;
  hasVideo?: boolean;
  isVerified?: boolean;
  extra?: Record<string, any>;
}

export interface CallEndedData {
  callId: string;
  reason?: string;
}

export interface OutgoingCallOptions {
  calleeId: string;
  calleeName?: string;
  calleeAvatar?: string;
  callerId?: string;
  callerName?: string;
  callerAvatar?: string;
  callType: CallType;
}

export interface NativeCallHistoryEntry {
  id: string;
  callId: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  callerAvatar: string;
  calleeName: string;
  calleeAvatar: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed' | 'rejected';
  status: string;
  durationSeconds: number;
  createdAt: string;
  timestamp: number;
}

export type YambiCallEvents = {
  [event: string]: any;
  onVoIPTokenReceived: (event: { token: string }) => void;
  onCallStarted: (data: { callId: string; callerId?: string; calleeId?: string; type?: string }) => void;
  onCallAnswered: (call: IncomingCallData) => void;
  onCallRejected: (call: IncomingCallData) => void;
  onCallEnded: (call: CallEndedData) => void;
  onCallMuted: (event: { isMuted: boolean }) => void;
};

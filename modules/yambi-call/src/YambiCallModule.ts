import { NativeModule, requireNativeModule } from 'expo';
import { IncomingCallData, CallEndedData, YambiCallEvents, OutgoingCallOptions, NativeCallHistoryEntry } from './YambiCall.types';

declare class YambiCallNativeModule extends NativeModule<YambiCallEvents> {
  initialize(): void;
  setUserPhone(phone: string): void;
  getPendingCall(): Promise<IncomingCallData | null>;
  clearPendingCall(): Promise<void>;
  startOutgoingCall(options: OutgoingCallOptions): Promise<string | null>;
  getUnsyncedCallHistory(): Promise<NativeCallHistoryEntry[]>;
  markCallHistorySynced(ids: string[]): Promise<void>;
  reportIncomingCall(data: IncomingCallData): Promise<void>;
  reportOutgoingCall(callId: string, calleeName: string, hasVideo: boolean): Promise<void>;
  reportCallConnected(callId: string): Promise<void>;
  reportCallEnded(callId: string, reason?: string): Promise<void>;
  setMuted(callId: string, muted: boolean): Promise<void>;
  setSpeaker(callId: string, enabled: boolean): Promise<void>;
  dismissNotification(callId: string): Promise<void>;
  startRingtone(): Promise<void>;
  stopRingtone(): Promise<void>;
  setCallStrings(strings: Record<string, string>): void;
  wasCallAnswered(callId: string): Promise<boolean>;
  isCallActive(): Promise<boolean>;
}

export default requireNativeModule<YambiCallNativeModule>('YambiCall');

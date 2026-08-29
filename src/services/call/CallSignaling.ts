import { SocketApp } from '../../../GlobalVariables';

export interface CallInvitePayload {
  callId: string;
  callerId: string;
  calleeId: string;
  callerName?: string;
  callerAvatar?: string;
  type: 'audio' | 'video';
  timestamp: number;
  senderId?: string;
}

export interface CallSignalPayload {
  callId: string;
  callerId: string;
  calleeId: string;
  senderId?: string;
  [key: string]: any;
}

export class CallSignaling {
  private userPhoneNumber: string = '';
  private listenersAttached: boolean = false;

  public init(userPhoneNumber: string) {
    this.userPhoneNumber = userPhoneNumber;
    console.log(`[CallSignaling] Initialized signaling for user: ${userPhoneNumber}`);
  }

  public sendInvite(payload: CallInvitePayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:invite to callee ${payload.calleeId}`, fullPayload);
    SocketApp.emit('call:invite', fullPayload);
  }

  public sendRinging(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:ringing`, fullPayload);
    SocketApp.emit('call:ringing', fullPayload);
  }

  public sendAccept(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:accept`, fullPayload);
    SocketApp.emit('call:accept', fullPayload);
  }

  public sendReject(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:reject`, fullPayload);
    SocketApp.emit('call:reject', fullPayload);
  }

  public sendCancel(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:cancel`, fullPayload);
    SocketApp.emit('call:cancel', fullPayload);
  }

  public sendOffer(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:offer`, fullPayload);
    SocketApp.emit('call:offer', fullPayload);
  }

  public sendAnswer(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:answer`, fullPayload);
    SocketApp.emit('call:answer', fullPayload);
  }

  public sendIceCandidate(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:ice-candidate`, fullPayload);
    SocketApp.emit('call:ice-candidate', fullPayload);
  }

  public sendBusy(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:busy`, fullPayload);
    SocketApp.emit('call:busy', fullPayload);
  }

  public sendEnd(payload: CallSignalPayload) {
    const fullPayload = { ...payload, senderId: this.userPhoneNumber };
    console.log(`[CallSignaling] Emitting call:end`, fullPayload);
    SocketApp.emit('call:end', fullPayload);
  }

  public registerListeners(handlers: {
    onInvite: (payload: CallInvitePayload) => void;
    onRinging: (payload: CallSignalPayload) => void;
    onAccept: (payload: CallSignalPayload) => void;
    onReject: (payload: CallSignalPayload) => void;
    onCancel: (payload: CallSignalPayload) => void;
    onOffer: (payload: CallSignalPayload) => void;
    onAnswer: (payload: CallSignalPayload) => void;
    onIceCandidate: (payload: CallSignalPayload) => void;
    onBusy: (payload: CallSignalPayload) => void;
    onEnd: (payload: CallSignalPayload) => void;
  }) {
    if (this.listenersAttached) {
      this.removeListeners();
    }

    console.log('[CallSignaling] Registering Socket.IO call listeners');

    const handleInvite = (payload: CallInvitePayload) => {
      if (payload.callerId === this.userPhoneNumber || payload.senderId === this.userPhoneNumber) {
        return;
      }
      if (payload.calleeId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:invite for current user', payload);
        handlers.onInvite(payload);
      }
    };

    const handleRinging = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber) return;
      if (payload.callerId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:ringing from callee', payload);
        handlers.onRinging(payload);
      }
    };

    const handleAccept = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber) return;
      if (payload.callerId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:accept from callee', payload);
        handlers.onAccept(payload);
      }
    };

    const handleReject = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber) return;
      if (payload.callerId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:reject from callee', payload);
        handlers.onReject(payload);
      }
    };

    const handleCancel = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber || payload.callerId === this.userPhoneNumber) return;
      if (payload.calleeId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:cancel from caller', payload);
        handlers.onCancel(payload);
      }
    };

    const handleOffer = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber || payload.callerId === this.userPhoneNumber) return;
      if (payload.calleeId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:offer from caller', payload);
        handlers.onOffer(payload);
      }
    };

    const handleAnswer = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber) return;
      if (payload.callerId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:answer from callee', payload);
        handlers.onAnswer(payload);
      }
    };

    const handleIceCandidate = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber) return;
      if (payload.callerId === this.userPhoneNumber || payload.calleeId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:ice-candidate from peer', payload);
        handlers.onIceCandidate(payload);
      }
    };

    const handleBusy = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber) return;
      if (payload.callerId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:busy from callee', payload);
        handlers.onBusy(payload);
      }
    };

    const handleEnd = (payload: CallSignalPayload) => {
      if (payload.senderId === this.userPhoneNumber) return;
      if (payload.callerId === this.userPhoneNumber || payload.calleeId === this.userPhoneNumber) {
        console.log('[CallSignaling] Received call:end from peer', payload);
        handlers.onEnd(payload);
      }
    };

    // Socket call events
    SocketApp.on('call:invite', handleInvite);
    SocketApp.on('call:ringing', handleRinging);
    SocketApp.on('call:accept', handleAccept);
    SocketApp.on('call:reject', handleReject);
    SocketApp.on('call:cancel', handleCancel);
    SocketApp.on('call:offer', handleOffer);
    SocketApp.on('call:answer', handleAnswer);
    SocketApp.on('call:ice-candidate', handleIceCandidate);
    SocketApp.on('call:busy', handleBusy);
    SocketApp.on('call:end', handleEnd);

    this.listenersAttached = true;
  }

  public removeListeners() {
    console.log('[CallSignaling] Removing Socket.IO call listeners');
    SocketApp.off('call:invite');
    SocketApp.off('call:ringing');
    SocketApp.off('call:accept');
    SocketApp.off('call:reject');
    SocketApp.off('call:cancel');
    SocketApp.off('call:offer');
    SocketApp.off('call:answer');
    SocketApp.off('call:ice-candidate');
    SocketApp.off('call:busy');
    SocketApp.off('call:end');

    this.listenersAttached = false;
  }
}

export const callSignaling = new CallSignaling();

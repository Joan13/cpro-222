import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Centralized ICE Server configuration.
 * STUN only for Phase 2. Architecture allows seamless future TURN addition.
 */
export const getIceServers = (): RTCIceServer[] => {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: string) => void) | null = null;
  private onIceConnectionStateChangeCallback: ((state: string) => void) | null = null;

  public setCallbacks(callbacks: {
    onIceCandidate?: (candidate: RTCIceCandidate) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onConnectionStateChange?: (state: string) => void;
    onIceConnectionStateChange?: (state: string) => void;
  }) {
    if (callbacks.onIceCandidate) this.onIceCandidateCallback = callbacks.onIceCandidate;
    if (callbacks.onRemoteStream) this.onRemoteStreamCallback = callbacks.onRemoteStream;
    if (callbacks.onConnectionStateChange) this.onConnectionStateChangeCallback = callbacks.onConnectionStateChange;
    if (callbacks.onIceConnectionStateChange) this.onIceConnectionStateChangeCallback = callbacks.onIceConnectionStateChange;
  }

  public async getLocalStream(type: 'audio' | 'video'): Promise<MediaStream> {
    try {
      console.log(`[WebRTCManager] Requesting local media stream for call type: ${type}`);
      const isVideo = type === 'video';
      const constraints = {
        audio: true,
        video: isVideo
          ? {
              mandatory: {
                minWidth: 500,
                minHeight: 300,
                minFrameRate: 30,
              },
              facingMode: 'user',
            }
          : false,
      };

      const stream = (await mediaDevices.getUserMedia(constraints as any)) as unknown as MediaStream;
      this.localStream = stream;
      console.log(`[WebRTCManager] Local stream acquired successfully. Audio tracks: ${stream.getAudioTracks().length}, Video tracks: ${stream.getVideoTracks().length}`);
      return stream;
    } catch (error) {
      console.error('[WebRTCManager] Error getting local stream:', error);
      throw error;
    }
  }

  public createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      console.log('[WebRTCManager] PeerConnection already exists. Cleaning up old connection.');
      this.closePeerConnection();
    }

    const configuration = {
      iceServers: getIceServers(),
      iceTransportPolicy: 'all' as const,
    };

    console.log('[WebRTCManager] Creating RTCPeerConnection with STUN servers');
    this.peerConnection = new RTCPeerConnection(configuration);
    this.remoteStream = new MediaStream([]);

    // Attach local stream tracks to PeerConnection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection) {
          console.log(`[WebRTCManager] Adding local track (${track.kind}) to PeerConnection`);
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });
    }

    // Handle ICE candidates
    (this.peerConnection as any).addEventListener('icecandidate', (event: any) => {
      if (event.candidate && this.onIceCandidateCallback) {
        console.log('[WebRTCManager] Generated ICE candidate:', event.candidate.candidate);
        this.onIceCandidateCallback(event.candidate);
      }
    });

    // Handle remote tracks
    (this.peerConnection as any).addEventListener('track', (event: any) => {
      console.log(`[WebRTCManager] Received remote track (${event.track?.kind})`);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else if (event.track) {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream([]);
        }
        this.remoteStream.addTrack(event.track);
      }

      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    });

    // Connection state monitoring
    (this.peerConnection as any).addEventListener('connectionstatechange', () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState;
        console.log(`[WebRTCManager] PeerConnection state changed: ${state}`);
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }
      }
    });

    (this.peerConnection as any).addEventListener('iceconnectionstatechange', () => {
      if (this.peerConnection) {
        const state = this.peerConnection.iceConnectionState;
        console.log(`[WebRTCManager] ICE Connection state changed: ${state}`);
        if (this.onIceConnectionStateChangeCallback) {
          this.onIceConnectionStateChangeCallback(state);
        }
      }
    });

    return this.peerConnection;
  }

  public async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('[WebRTCManager] PeerConnection not initialized when creating offer');
    }
    console.log('[WebRTCManager] Creating SDP Offer...');
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection.setLocalDescription(offer);
    console.log('[WebRTCManager] SDP Offer created & set as local description');
    return offer;
  }

  public async handleOfferAndCreateAnswer(offerSdp: RTCSessionDescription): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }
    console.log('[WebRTCManager] Setting remote description (Offer)...');
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offerSdp));
    console.log('[WebRTCManager] Creating SDP Answer...');
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    console.log('[WebRTCManager] SDP Answer created & set as local description');
    return answer;
  }

  public async handleAnswer(answerSdp: RTCSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      console.error('[WebRTCManager] PeerConnection not found when handling answer');
      return;
    }
    console.log('[WebRTCManager] Setting remote description (Answer)...');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
  }

  public async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      console.warn('[WebRTCManager] PeerConnection not initialized when adding ICE candidate');
      return;
    }
    try {
      console.log('[WebRTCManager] Adding remote ICE candidate');
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('[WebRTCManager] Error adding ICE candidate:', error);
    }
  }

  public toggleMute(muted: boolean): boolean {
    if (!this.localStream) return false;
    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !muted;
    });
    console.log(`[WebRTCManager] Audio muted state: ${muted}`);
    return muted;
  }

  public toggleCamera(disabled: boolean): boolean {
    if (!this.localStream) return false;
    const videoTracks = this.localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !disabled;
    });
    console.log(`[WebRTCManager] Video disabled state: ${disabled}`);
    return disabled;
  }

  public switchCamera(): void {
    if (!this.localStream) return;
    const videoTracks = this.localStream.getVideoTracks();
    videoTracks.forEach((track: any) => {
      if (typeof track._switchCamera === 'function') {
        track._switchCamera();
        console.log('[WebRTCManager] Switched camera');
      }
    });
  }

  public getLocalStreamInstance(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStreamInstance(): MediaStream | null {
    return this.remoteStream;
  }

  public closePeerConnection(): void {
    console.log('[WebRTCManager] Cleaning up WebRTC PeerConnection & media tracks...');
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[WebRTCManager] Stopped local track: ${track.kind}`);
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[WebRTCManager] Stopped remote track: ${track.kind}`);
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.onIceCandidateCallback = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.onIceConnectionStateChangeCallback = null;
    console.log('[WebRTCManager] Cleanup completed');
  }
}

export const webRTCManager = new WebRTCManager();

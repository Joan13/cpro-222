import { createAudioPlayer, AudioPlayer } from 'expo-audio';

class CallSoundManager {
  private activePlayer: AudioPlayer | null = null;
  private currentSoundType: 'outgoing' | 'incoming' | 'end' | null = null;

  public async playOutgoingSound() {
    if (this.currentSoundType === 'outgoing') return;
    this.stopAll();
    try {
      this.currentSoundType = 'outgoing';
      this.activePlayer = createAudioPlayer(
        require('../../assets/sounds/outgoing_call.mp3'),
        { keepAudioSessionActive: true }
      );
      this.activePlayer.loop = true;
      this.activePlayer.play();
      console.log('[CallSoundManager] Playing outgoing call sound');
    } catch (e) {
      console.error('[CallSoundManager] Error playing outgoing sound:', e);
    }
  }

  public async playIncomingSound() {
    if (this.currentSoundType === 'incoming') return;
    this.stopAll();
    try {
      this.currentSoundType = 'incoming';
      this.activePlayer = createAudioPlayer(
        require('../../assets/sounds/incoming_call.mp3'),
        { keepAudioSessionActive: true }
      );
      this.activePlayer.loop = true;
      this.activePlayer.play();
      console.log('[CallSoundManager] Playing incoming call ringtone');
    } catch (e) {
      console.error('[CallSoundManager] Error playing incoming sound:', e);
    }
  }

  public async playEndSound() {
    if (this.currentSoundType === 'end') return;
    this.stopAll();
    try {
      this.currentSoundType = 'end';
      const player = createAudioPlayer(
        require('../../assets/sounds/end_call.mp3'),
        { keepAudioSessionActive: false }
      );
      this.activePlayer = player;
      player.loop = false;
      player.play();
      console.log('[CallSoundManager] Playing end call sound');
    } catch (e) {
      console.error('[CallSoundManager] Error playing end sound:', e);
    }
  }

  public stopSound() {
    if (this.currentSoundType === 'end') {
      // Don't stop end call sound prematurely; let it finish playing
      return;
    }
    this.stopAll();
  }

  public stopAll() {
    if (this.activePlayer) {
      try {
        this.activePlayer.pause();
        this.activePlayer.remove();
      } catch (e) {
        // ignore cleanup errors
      }
      this.activePlayer = null;
    }
    this.currentSoundType = null;
  }
}

export const callSoundManager = new CallSoundManager();

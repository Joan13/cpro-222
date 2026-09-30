import LocalizedStrings from 'react-native-localization';

import ENG from './locales/en.json';
import FRC from './locales/fr.json';
import SW_CD from './locales/swcd.json';
import YambiCall from 'yambi-call';

export let strings = new LocalizedStrings({
  en: ENG,
  fr: FRC,
  sw_drc: SW_CD,
});

export const syncNativeCallStrings = (lang?: string) => {
  try {
    const rawL = (lang || strings.getLanguage() || 'fr').toLowerCase();
    const isEnglish = rawL === 'en' || rawL.startsWith('en-') || rawL.startsWith('en_');
    const isSwahili = rawL === 'sw_drc' || rawL === 'swcd' || rawL === 'sw' || rawL.startsWith('sw-') || rawL.startsWith('sw_');
    const dict = (isEnglish ? ENG : (isSwahili ? SW_CD : FRC)) as any;
    const callStrings: Record<string, string> = {
      incoming_call: dict.incoming_call || 'Appel entrant',
      incoming_audio_call: dict.incoming_audio_call || 'Appel audio entrant',
      incoming_video_call: dict.incoming_video_call || 'Appel vidéo entrant',
      ongoing_audio_call: dict.ongoing_audio_call || 'Appel audio en cours...',
      ongoing_video_call: dict.ongoing_video_call || 'Appel vidéo en cours...',
      tap_to_return: dict.tap_to_return || "Appuyez pour revenir à l'appel",
      calling: dict.calling || 'Appel...',
      ringing: dict.ringing || 'Appel en cours...',
      connecting: dict.connecting || 'Connexion...',
      reconnecting: dict.reconnecting || 'Reconnexion...',
      call_connected: dict.call_connected || 'Connecté',
      call_ended: dict.call_ended || 'Appel terminé',
      call_rejected: dict.call_rejected || 'Appel refusé',
      user_busy: dict.user_busy || 'Utilisateur occupé',
      no_answer: dict.no_answer || 'Pas de réponse',
      decline: dict.decline || 'Refuser',
      accept: dict.accept || 'Accepter',
      mute: dict.mute || 'Muet',
      unmute: dict.unmute || 'Activer micro',
      speaker: dict.btn_speaker || 'HP',
      earpiece: dict.earpiece || 'Écouteur',
      end_call: dict.end_call || dict.btn_end || 'Raccrocher',
      btn_end: dict.btn_end || dict.end_call || 'Fin',
      switch_camera: dict.btn_flip || 'Bascule',
      video_paused: dict.video_paused || 'Vidéo en pause',
      pause_video: dict.pause_video || 'Pause',
      resume_video: dict.resume_video || 'Reprendre',
      camera: dict.camera || 'Caméra',
      camera_off: dict.camera_off || 'Caméra désactivée',
    };
    YambiCall.setCallStrings(callStrings);
  } catch (e) {
    // Non-blocking if native module is not ready yet
  }
};

export const changeLanguage = (languageKey: string) => {
  strings.setLanguage(languageKey);
  syncNativeCallStrings(languageKey);
};

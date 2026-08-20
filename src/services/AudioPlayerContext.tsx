import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { media_url } from '../../GlobalVariables';
import { useAppDispatch, useAppSelector } from '../store/app/hooks';
import { setVoiceNoteBeingPlayed } from '../store/reducers/appSlice';
import { strings } from '../lang/lang';

interface AudioPlayerContextType {
    sound: AudioPlayer;
    activeAudioToken: string;
    activeAudioUri: string;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    didJustFinish: boolean;
    progressPercent: number;
    playAudio: (token: string, uri: string) => Promise<void>;
    pauseAudio: () => void;
    resumeAudio: () => void;
    seekTo: (seconds: number) => Promise<void>;
    closeAudio: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useAppDispatch();
    const voice_note_being_played = useAppSelector(state => state.app.voice_note_being_played);

    const activeAudioTokenRef = useRef<string>('');
    const activeAudioUriRef = useRef<string>('');
    const [activeAudioToken, setActiveAudioToken] = useState<string>('');
    const [activeAudioUri, setActiveAudioUri] = useState<string>('');

    const sound = useMemo(() => createAudioPlayer(null, { updateInterval: 1000 / 60, keepAudioSessionActive: true }), []);
    const status = useAudioPlayerStatus(sound);

    const isPlaying = status?.isLoaded ? status.playing : false;
    const currentTime = status?.isLoaded ? status.currentTime : 0;
    const duration = status?.isLoaded ? status.duration : 0;
    const didJustFinish = status?.isLoaded ? status.didJustFinish : false;
    const progressPercent = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;

    // Resolve audio URI to local or remote path
    const resolveAudioUri = async (rawUri: string): Promise<string> => {
        let audioUri = rawUri;
        if (!audioUri.startsWith('file://') && !audioUri.startsWith('http://') && !audioUri.startsWith('https://') && !audioUri.startsWith('/')) {
            const fileName = audioUri.split('/').pop() || '';
            const localPath = FileSystem.documentDirectory + "YambiVoiceNotes/" + fileName;
            const info = await FileSystem.getInfoAsync(localPath).catch(() => ({ exists: false }));
            if (info.exists) {
                audioUri = localPath;
            } else {
                audioUri = media_url + "/voice_notes/" + fileName;
            }
        }
        return audioUri;
    };

    const playAudio = useCallback(async (token: string, uri: string) => {
        if (!uri || !token) return;
        try {
            if (activeAudioTokenRef.current === token) {
                if (status?.isLoaded) {
                    if (!status.playing) {
                        if (status.didJustFinish) {
                            await sound.seekTo(0);
                        }
                        sound.play();
                    }
                }
                return;
            }

            activeAudioTokenRef.current = token;
            activeAudioUriRef.current = uri;
            setActiveAudioToken(token);
            setActiveAudioUri(uri);
            if (voice_note_being_played !== uri) {
                dispatch(setVoiceNoteBeingPlayed(uri));
            }

            const resolved = await resolveAudioUri(uri);
            sound.replace({ uri: resolved });
            sound.play();
        } catch (e) {
            console.warn('AudioPlayerProvider playAudio error:', e);
        }
    }, [voice_note_being_played, status, sound, dispatch]);

    const pauseAudio = useCallback(() => {
        try {
            if (status?.isLoaded && isPlaying) {
                sound.pause();
            }
        } catch (e) {
            console.warn('AudioPlayerProvider pauseAudio error:', e);
        }
    }, [status, isPlaying, sound]);

    const resumeAudio = useCallback(() => {
        try {
            if (status?.isLoaded) {
                if (didJustFinish) {
                    sound.seekTo(0);
                }
                sound.play();
            }
        } catch (e) {
            console.warn('AudioPlayerProvider resumeAudio error:', e);
        }
    }, [status, didJustFinish, sound]);

    const seekTo = useCallback(async (seconds: number) => {
        try {
            if (status?.isLoaded) {
                await sound.seekTo(seconds);
            }
        } catch (e) {
            console.warn('AudioPlayerProvider seekTo error:', e);
        }
    }, [status, sound]);

    const closeAudio = useCallback(() => {
        try {
            if (status?.isLoaded) {
                sound.pause();
            }
        } catch (e) { }
        activeAudioTokenRef.current = '';
        activeAudioUriRef.current = '';
        setActiveAudioToken('');
        setActiveAudioUri('');
        if (voice_note_being_played !== '') {
            dispatch(setVoiceNoteBeingPlayed(''));
        }
    }, [status, voice_note_being_played, sound, dispatch]);

    // Sync state if Redux voice_note_being_played changes externally
    useEffect(() => {
        if (voice_note_being_played && voice_note_being_played !== activeAudioUriRef.current) {
            playAudio(voice_note_being_played, voice_note_being_played);
        } else if (!voice_note_being_played && activeAudioUriRef.current) {
            closeAudio();
        }
    }, [voice_note_being_played]);

    // Configure lock screen audio mode when playing
    useEffect(() => {
        const setupLockScreen = async () => {
            if (!sound || !activeAudioTokenRef.current) return;
            if (isPlaying) {
                try {
                    await setAudioModeAsync({
                        playsInSilentMode: true,
                        shouldPlayInBackground: true,
                        interruptionMode: 'doNotMix',
                    });
                    sound.setActiveForLockScreen(true, {
                        title: strings.voice_note || 'Voice Note',
                        artist: 'Yambi',
                    });
                } catch (e) {
                    console.warn('Failed to configure lock screen audio:', e);
                }
            } else if (didJustFinish) {
                try {
                    sound.setActiveForLockScreen(false);
                } catch (e) { }
            }
        };
        setupLockScreen();
    }, [isPlaying, activeAudioToken, didJustFinish, sound]);

    const contextValue = useMemo(() => ({
        sound,
        activeAudioToken,
        activeAudioUri,
        isPlaying,
        currentTime,
        duration,
        didJustFinish,
        progressPercent,
        playAudio,
        pauseAudio,
        resumeAudio,
        seekTo,
        closeAudio,
    }), [
        sound,
        activeAudioToken,
        activeAudioUri,
        isPlaying,
        currentTime,
        duration,
        didJustFinish,
        progressPercent,
        playAudio,
        pauseAudio,
        resumeAudio,
        seekTo,
        closeAudio,
    ]);

    return (
        <AudioPlayerContext.Provider value={contextValue}>
            {children}
        </AudioPlayerContext.Provider>
    );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
    }
    return context;
};


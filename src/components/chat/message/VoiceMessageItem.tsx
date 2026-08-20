import { View, Pressable } from 'react-native'
import { useAppDispatch, useAppSelector } from '../../../store/app/hooks';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { TMessage } from '../../../types/types';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AudioStatus, createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useProximity } from '../../hooks/useProximity';
import { setVoiceNoteBeingPlayed } from '../../../store/reducers/appSlice';
import { useAudioPlayer } from '../../../services/AudioPlayerContext';
// import { SocketApp } from '../../../../App';
import { useRealm } from '@realm/react';
import { strings } from '../../../lang/lang';
import { remote_host, SocketApp, media_url } from '../../../../GlobalVariables';
import { IconApp } from '../../app/IconApp';
import axios from 'axios';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming, useSharedValue, withRepeat, SharedValue, interpolateColor, runOnJS } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { TextSmallYambi, TextSmallYambiGray, TextSmallYambiHighColor2 } from '../../app/Text';
import moment from 'moment';

const getWaveformHeights = (token: string, count: number) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
        hash = token.charCodeAt(i) + ((hash << 5) - hash);
    }
    const heights: number[] = [];
    const minHeight = 4;
    const maxHeight = 26;
    for (let i = 0; i < count; i++) {
        const t = i / count;
        // Speech envelope creates word gaps dynamically based on the hash
        const envelope = Math.max(0, Math.sin(hash + t * Math.PI * 3.5));
        const speechSignal = 0.3 + 0.7 * Math.abs(Math.sin(hash * 2 + i * 1.8));
        const normalizedVal = envelope * speechSignal;
        heights.push(minHeight + normalizedVal * (maxHeight - minHeight));
    }
    return heights;
};

const WaveformPlayer = ({ message, progressValue, pulseValue, isPlaying, app_theme, waveformGesture }: { message: TMessage, progressValue: SharedValue<number>, pulseValue: SharedValue<number>, isPlaying: boolean, app_theme: any, waveformGesture: any }) => {
    const BARS_COUNT = 18;
    const heights = useMemo(() => getWaveformHeights(message.token, BARS_COUNT), [message.token]);

    return (
        <GestureDetector gesture={waveformGesture}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 35, width: 110 }}>
                {heights.map((barHeight, i) => {
                    const animatedStyle = useAnimatedStyle(() => {
                        const barProgress = i / BARS_COUNT;
                        
                        const color = interpolateColor(
                            progressValue.value,
                            [barProgress - 0.08, barProgress],
                            [app_theme.colors.border + 'A0', app_theme.colors.high_color]
                        );
                        
                        let scale = 1.0;
                        if (isPlaying) {
                            const dist = Math.abs(progressValue.value - barProgress);
                            if (dist < 0.15) {
                                const ripple = Math.sin((0.15 - dist) / 0.15 * Math.PI);
                                scale = 1.0 + ripple * 0.25 * Math.sin(pulseValue.value * Math.PI * 2);
                            }
                        }

                        return {
                            height: barHeight * scale,
                            backgroundColor: color,
                        };
                    });

                    return (
                        <Animated.View
                            key={i}
                            style={[
                                animatedStyle,
                                {
                                    width: 3,
                                    marginHorizontal: 1,
                                    borderRadius: 1.5,
                                }
                            ]}
                        />
                    );
                })}
            </View>
        </GestureDetector>
    );
};

const VoiceMessageItem = ({ message }: { message: TMessage }) => {

    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const voice_note_being_played = useAppSelector(state => state.app.voice_note_being_played);

    // const [pause, setPause] = useState(false);
    // const [playTime, setPlayTime] = useState(0);
    const [downloadingAudio, setDownloadingAudio] = useState<boolean>(false);
    // const [progress, setProgress] = useState(0);
    // const [duration, setDuration] = useState(1);
    // const [playing, setPlaying] = useState(false);
    // const [volume, setVolume] = useState(0);

    const dispatch = useAppDispatch();
    const realm = useRealm();

    const {
        sound,
        activeAudioToken,
        activeAudioUri,
        isPlaying: globalIsPlaying,
        currentTime: globalCurrentTime,
        duration: globalDuration,
        didJustFinish,
        playAudio,
        pauseAudio,
        seekTo: globalSeekTo,
    } = useAudioPlayer();

    const isCurrentlyActive = activeAudioToken === message.token;
    const isPlaying = isCurrentlyActive && globalIsPlaying;

    const [fileSize, setFileSize] = useState<string>();
    const [itemDuration, setItemDuration] = useState<number>(0);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

    const isNear = useProximity(isPlaying);

    const wasNearRef = useRef(false);

    useEffect(() => {
        const updateAudioRoute = async () => {
            if (isCurrentlyActive && globalIsPlaying) {
                try {
                    if (isNear) {
                        await setAudioModeAsync({
                            shouldRouteThroughEarpiece: true,
                            allowsRecording: true,
                        });
                    } else {
                        if (wasNearRef.current) {
                            pauseAudio();
                        }
                        await setAudioModeAsync({
                            shouldRouteThroughEarpiece: false,
                            allowsRecording: false,
                        });
                    }
                } catch (e) {
                    console.warn('Failed to update audio routing:', e);
                }
            }
            wasNearRef.current = isNear;
        };
        updateAudioRoute();

        return () => {
            setAudioModeAsync({
                shouldRouteThroughEarpiece: false,
                allowsRecording: false,
            }).catch(() => {});
        };
    }, [isNear, globalIsPlaying, isCurrentlyActive]);

    const ensureDirExists = async () => {
        try {
            const dir = FileSystem.documentDirectory + "YambiVoiceNotes/";
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
        } catch (e) { }
    };

    const getAudioFileUri = (): string => {
        const raw = message.main_text_message || '';
        if (raw.startsWith('file://') || raw.startsWith('/')) {
            return raw;
        }
        const fileName = raw.split('/').pop() || '';
        return FileSystem.documentDirectory + "YambiVoiceNotes/" + fileName;
    };

    const loadSoundFile = async (targetPath: string) => {
        try {
            const info = await FileSystem.getInfoAsync(targetPath);
            if (info.exists && info.size && info.size > 100) {
                const sizeInBytes = info.size;
                const sizeInKB = sizeInBytes / 1024;
                const sizeInMB = sizeInKB / 1024;
                setFileSize(sizeInKB > 1023 ? sizeInMB.toFixed(1) + "MB" : sizeInKB.toFixed(1) + "KB");

                try {
                    const tempPlayer = createAudioPlayer({ uri: targetPath });
                    setTimeout(() => {
                        try {
                            if (tempPlayer.duration && tempPlayer.duration > 0) {
                                setItemDuration(tempPlayer.duration * 1000);
                            }
                            tempPlayer.remove();
                        } catch (e) { }
                    }, 100);
                } catch (e) { }
            }
        } catch (error) {
            console.warn('loadSoundFile error:', error);
        }
    };

    const UploadVoiceNote = async () => {
        if (!message.main_text_message) return;
        setDownloadingAudio(true);
        await ensureDirExists();

        let base_url = remote_host + "/yambi/API/upload_voice_note";
        const fileName = message.main_text_message.split('/').pop() || '';

        const formData = new FormData();
        formData.append('voice_note', { uri: message.main_text_message, name: fileName, type: 'audio/m4a' } as never);

        try {
            const response = await axios.post(base_url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const serverFileName = response.data?.file_name || response.data?.message || response.data?.file;
            if (serverFileName && typeof serverFileName === 'string' && serverFileName !== '1' && serverFileName !== '0') {
                const newPath = FileSystem.documentDirectory + "YambiVoiceNotes/" + serverFileName;

                const localExists = await FileSystem.getInfoAsync(message.main_text_message);
                if (localExists.exists && localExists.size && localExists.size > 100) {
                    await FileSystem.copyAsync({
                        from: message.main_text_message,
                        to: newPath,
                    }).catch(() => { });
                }

                const msg: TMessage = {
                    sender: message.sender,
                    receiver: message.receiver,
                    main_text_message: serverFileName,
                    caption: message.caption,
                    message_type: 1,
                    reactions: message.reactions,
                    response_to: message.response_to,
                    message_read: 0,
                    read_once: message.read_once,
                    flag: message.flag,
                    message_effect: message.message_effect,
                    token: message.token,
                    deleted: message.deleted,
                    platform: message.platform,
                    createdAt: message.createdAt,
                    receivedAt: message.receivedAt,
                    readAt: message.readAt,
                    playedAt: message.playedAt,
                    cc: message.cc,
                    alignment: message.alignment
                };

                realm.write(() => {
                    try {
                        realm.create('UsersMessages', msg, true);
                    } catch (error) { }
                });

                SocketApp.emit('newMessage', msg);
                await loadSoundFile(newPath);
            }
        } catch (error) {
            console.warn('Upload voice note failed:', error);
        } finally {
            setDownloadingAudio(false);
        }
    };

    const DownloadAudio = async () => {
        setDownloadingAudio(true);
        setDownloadProgress(0);
        await ensureDirExists();

        const fileName = message.main_text_message ? message.main_text_message.split('/').pop() || '' : '';
        if (!fileName) {
            setDownloadingAudio(false);
            return;
        }

        const downloadUrl = media_url + "/voice_notes/" + fileName;
        const targetPath = FileSystem.documentDirectory + "YambiVoiceNotes/" + fileName;

        try {
            const res = await FileSystem.downloadAsync(downloadUrl, targetPath);
            if (res.status === 200) {
                const info = await FileSystem.getInfoAsync(targetPath);
                if (info.exists && info.size && info.size > 100) {
                    await loadSoundFile(targetPath);
                } else {
                    await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => { });
                }
            } else {
                await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => { });
            }
        } catch (e) {
            console.warn('Download audio failed:', e);
        } finally {
            setDownloadingAudio(false);
        }
    };

    const loadSound = async () => {
        const targetPath = getAudioFileUri();
        await loadSoundFile(targetPath);
    };

    const FirstActions = async () => {
        try {
            await ensureDirExists();
            const targetPath = getAudioFileUri();
            const fileInfo = await FileSystem.getInfoAsync(targetPath);

            if (fileInfo.exists && fileInfo.size && fileInfo.size > 100) {
                await loadSoundFile(targetPath);
            } else {
                if (message.sender === user_data.phone_number) {
                    UploadVoiceNote();
                } else {
                    DownloadAudio();
                }
            }
        } catch (e) {
            console.warn('FirstActions error:', e);
        }
    };

    const markAsPlayed = () => {
        if (message.receiver === user_data.phone_number && (message.message_read < 4 || !message.playedAt)) {
            const playedTime = moment().format();
            const updatedMsg: TMessage = {
                sender: message.sender,
                receiver: message.receiver,
                main_text_message: message.main_text_message,
                caption: message.caption,
                message_type: message.message_type,
                reactions: message.reactions,
                response_to: message.response_to,
                message_read: 4,
                read_once: message.read_once,
                flag: message.flag,
                message_effect: message.message_effect,
                token: message.token,
                deleted: message.deleted,
                platform: message.platform,
                createdAt: message.createdAt,
                receivedAt: message.receivedAt,
                readAt: message.readAt || playedTime,
                playedAt: playedTime,
                cc: message.cc,
                alignment: message.alignment
            };

            realm.write(() => {
                try {
                    realm.create('UsersMessages', updatedMsg, true);
                } catch (error) { }
            });

            SocketApp.emit('messagePlayed', updatedMsg);
            axios.post(remote_host + '/yambi/API/set_message_played', { token: message.token }).catch(() => { });
        }
    };

    const PlayVoice = async () => {
        const targetPath = getAudioFileUri();
        const fileInfo = await FileSystem.getInfoAsync(targetPath).catch(() => ({ exists: false, size: 0 }));

        if (!fileInfo.exists || (fileInfo.size || 0) <= 100) {
            if (message.sender === user_data.phone_number) {
                UploadVoiceNote();
            } else {
                DownloadAudio();
            }
            return;
        }

        markAsPlayed();

        if (isCurrentlyActive && globalIsPlaying) {
            pauseAudio();
        } else {
            await playAudio(message.token, message.main_text_message);
        }
    };

    const stopVoice = async () => {
        pauseAudio();
    };

    // const onVoice = async (index: number) => {

    //     // playActionSound(5);

    //     // console.log(uri);


    //     if (index === 0) {

    //         // //   sound.current.setOnPlaybackStatusUpdate((status) => updatePlayTime(status));

    //         // try {
    //         //     const result = await sound.current.getStatusAsync();

    //         //     if (result.isLoaded) {
    //         //         if (!result.isPlaying) {
    //         //             await sound.current.playAsync()
    //         //                 .then((s) => {
    //         //                     dispatch(setPlayingVoiceNote(true));
    //         //                     // startCounter(result.durationMillis);

    //         //                     setPause(true);

    //         //                     setTimeout(async () => {
    //         //                         dispatch(setPlayingVoiceNote(false));
    //         //                         setPause(false);

    //         //                         await sound.current.unloadAsync();
    //         //                     }, result.durationMillis);
    //         //                 });
    //         //         }
    //         //     } else {
    //         //         try {

    //         //             // const result = await sound.current.loadAsync({ uri: media_url + "/voice_notes/" + message.main_text_message + ".mp3" });

    //         //             const result = await sound.current.loadAsync({ uri: audioPath });

    //         //             if (result.isLoaded) {
    //         //                 if (!result.isPlaying) {
    //         //                     await sound.current.playAsync()
    //         //                         .then((s) => {
    //         //                             dispatch(setPlayingVoiceNote(true));
    //         //                             // startCounter(result.durationMillis);

    //         //                             setPause(true);

    //         //                             setTimeout(async () => {
    //         //                                 dispatch(setPlayingVoiceNote(false));
    //         //                                 setPause(false);

    //         //                                 await sound.current.unloadAsync();
    //         //                             }, result.durationMillis);
    //         //                         });
    //         //                 }
    //         //             }
    //         //         } catch (error) {
    //         //             // console.log(error + "!")
    //         //             DownloadAudio();
    //         //             // uploadVoiceNote();
    //         //         }
    //         //     }
    //         // } catch (error) {
    //         //     // console.log("error 2");
    //         // }
    //     }

    //     else if (index === 1) {
    //         // await sound.current.pauseAsync();
    //         // setPause(false);
    //     }

    //     else if (index === 2) {
    //         // await sound.current.stopAsync();
    //         // await sound.current.unloadAsync();
    //         // dispatch(setPlayingVoiceNote(false))
    //         // setPause(false);
    //         // setPlayTime(0);
    //     }

    //     else {
    //         // try {

    //         //     // const result = await sound.current.loadAsync({ uri: media_url + "/voice_notes/" + message.main_text_message + ".mp3" });

    //         //     const result = await sound.current.loadAsync({ uri: audioPath });

    //         //     if (result.isLoaded) {
    //         //         // if (!result.isPlaying) {
    //         //         //     await sound.current.playAsync()
    //         //         //         .then((s) => {
    //         //         //             dispatch(setPlayingVoiceNote(true));
    //         //         //             // startCounter(result.durationMillis);

    //         //         //             setPause(true);

    //         //         //             setTimeout(async () => {
    //         //         //                 dispatch(setPlayingVoiceNote(false));
    //         //         //                 setPause(false);

    //         //         //                 await sound.current.unloadAsync();
    //         //         //             }, result.durationMillis);
    //         //         //         });
    //         //         // }

    //         //         // const pro = (result.positionMillis / result.durationMillis) * 100;
    //         //         setPlayTime(result.durationMillis);
    //         //         setVolume(result.volume);

    //         //         // console.log(result.positionMillis)
    //         //     }
    //         // } catch (error) {
    //         //     // console.log(error + "!")
    //         //     // DownloadAudio();
    //         //     // uploadVoiceNote();
    //         // }

    //         const { sound } = await Audio.Sound.createAsync({ uri: audioPath });
    //         setSound(sound);
    //     }
    // };

    useEffect(() => {
        if (message.message_read === 5 && message.sender === user_data.phone_number) {
            const timeout = setTimeout(() => {
                UploadVoiceNote();
            }, 200);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                FirstActions();
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [message.message_read, message.main_text_message]);

    const PlaybackRate = async () => {
        let rate = 1;

        if (sound) {
            try {
                const currentRate = (sound as any).playbackRate || 1;
                rate = currentRate === 2 ? 1 : currentRate + 0.5;
                sound.setPlaybackRate(rate);
            } catch (e) {}
        }
    }

    const position = isCurrentlyActive ? globalCurrentTime * 1000 : 0;
    const duration = (isCurrentlyActive && globalDuration > 0) ? globalDuration * 1000 : itemDuration;
    const progress = (duration > 0) ? position / duration : 0;

    const formatMilliseconds = (milliseconds: number) => {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        return `${minutes}:${seconds < 10 ? 0 : ""}${seconds}`;
    }

    const progressStyle = useAnimatedStyle(() => ({
        width: progress * 100
    }))

    const progressValue = useSharedValue(0);
    const pulseValue = useSharedValue(0);

    useEffect(() => {
        if (isCurrentlyActive && globalDuration > 0) {
            progressValue.value = globalCurrentTime / globalDuration;
        } else {
            progressValue.value = 0;
        }
    }, [globalCurrentTime, globalDuration, isCurrentlyActive]);

    useEffect(() => {
        if (isPlaying) {
            pulseValue.value = withRepeat(
                withTiming(1, { duration: 500 }),
                -1,
                true
            );
        } else {
            pulseValue.value = 0;
        }
    }, [isPlaying]);

    const seekAudio = (seconds: number) => {
        if (isCurrentlyActive && globalDuration > 0) {
            try {
                progressValue.value = seconds / globalDuration;
                globalSeekTo(seconds);
            } catch (e) {}
        }
    };

    const tapGesture = Gesture.Tap().onStart((event) => {
        if (isCurrentlyActive && globalDuration > 0) {
            const ratio = Math.max(0, Math.min(1, event.x / 110));
            const targetSeconds = ratio * globalDuration;
            runOnJS(seekAudio)(targetSeconds);
        }
    });

    const panGesture = Gesture.Pan().onUpdate((event) => {
        if (isCurrentlyActive && globalDuration > 0) {
            const ratio = Math.max(0, Math.min(1, event.x / 110));
            const targetSeconds = ratio * globalDuration;
            runOnJS(seekAudio)(targetSeconds);
        }
    });

    const waveformGesture = Gesture.Simultaneous(tapGesture, panGesture);

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 4,
            width: 235,
        }}>
            {/* Play/Pause Button / Download Progress */}
            {downloadingAudio ?
                <Pressable
                    onPress={FirstActions}
                    style={{
                        height: 42,
                        width: 42,
                        borderRadius: 21,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.border,
                    }}>
                    <TextSmallYambiHighColor2 text={downloadProgress.toFixed() + "%"} styles={{ fontSize: 11, fontWeight: 'bold' }} />
                </Pressable> :
                <Pressable
                    onPress={PlayVoice}
                    style={{
                        height: 42,
                        width: 42,
                        borderRadius: 21,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.high_color,
                        shadowColor: app_theme.colors.high_color,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.5,
                        elevation: 3,
                    }}>
                    {!isPlaying ?
                        <IconApp pack='FA6' name="play" color="#ffffff" size={16} />
                        :
                        <IconApp pack='FA6' name="pause" color="#ffffff" size={16} />}
                </Pressable>
            }

            {/* Waveform & Playback Status */}
            <View style={{
                marginLeft: 14,
                flexDirection: 'column',
                justifyContent: 'center',
                width: 110,
            }}>
                <WaveformPlayer
                    message={message}
                    progressValue={progressValue}
                    pulseValue={pulseValue}
                    isPlaying={isPlaying}
                    app_theme={app_theme}
                    waveformGesture={waveformGesture}
                />

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 5,
                    height: 18,
                }}>
                    <TextSmallYambiGray text={isPlaying ? formatMilliseconds(position || 0) : formatMilliseconds(duration || 0)} />
                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: app_theme.colors.gray + '40', marginHorizontal: 6 }} />
                    <TextSmallYambiGray 
                        styles={{ maxWidth: 65 }} 
                        numberLines={1} 
                        text={!downloadingAudio ? (fileSize ? fileSize : "") : strings.downloading.toLowerCase()} 
                    />
                </View>
            </View>

            {/* Playback Rate / Speed Badge */}
            {isCurrentlyActive ?
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{
                        flex: 1,
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                    }}>
                    <Pressable
                        onPress={PlaybackRate}
                        style={{
                            height: 24,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: app_theme.colors.high_color + '15',
                            borderWidth: 1,
                            borderColor: app_theme.colors.high_color + '25',
                            marginLeft: 10,
                        }}>
                        <TextSmallYambi text="1x" styles={{ color: app_theme.colors.high_color, fontWeight: '600' }} />
                    </Pressable>
                </Animated.View> : null}
        </View>
    )
}

export default VoiceMessageItem;

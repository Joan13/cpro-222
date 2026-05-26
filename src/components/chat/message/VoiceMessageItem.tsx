import { View, Pressable } from 'react-native'
import { useAppDispatch, useAppSelector } from '../../../store/app/hooks';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { TMessage } from '../../../types/types';
import { useState, useEffect } from 'react';
import { AVPlaybackStatus, Audio } from 'expo-av';
import { setVoiceNoteBeingPlayed } from '../../../store/reducers/appSlice';
// import { SocketApp } from '../../../../App';
import { useRealm } from '@realm/react';
import { strings } from '../../../lang/lang';
import { remote_host, SocketApp, media_url } from '../../../../GlobalVariables';
import { IconApp } from '../../app/IconApp';
import axios from 'axios';
import { Sound } from 'expo-av/build/Audio';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import { TextSmallYambi, TextSmallYambiGray, TextSmallYambiHighColor2 } from '../../app/Text';

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
    // const sound = useRef(new Audio.Sound());
    const [sound, setSound] = useState<Sound>();
    const [status, setStatus] = useState<AVPlaybackStatus>();
    const [fileSize, setFileSize] = useState<string>();
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

    // const audioPath = RNFS.DocumentDirectoryPath + "YambiVoiceNotes/" + message.main_text_message;

    const audioPath = FileSystem.documentDirectory + "YambiVoiceNotes/" + message.main_text_message;

    // console.log(audioPath)
    // FileSystem.documentDirectory + "/YambiDownloadedVoiceNotes/" + message.main_text_message;
    // RNFS.DocumentDirectoryPath + "/YambiDownloadedVoiceNotes/" + message.main_text_message;

    // console.log(message)

    // const updateProgress = (status: AVPlaybackStatus) => {
    //     if (status.isLoaded) {
    //         // setPlaybackStatus(status);
    //         if (status.isPlaying) {
    //             const pro = status.positionMillis / status.playableDurationMillis;
    //             setProgress(pro);

    //             setVolume(status.volume);
    //         }

    //         dispatch(setPlayingVoiceNote(status.isPlaying));
    //         if (status.isPlaying) {
    //             setPlayTime(status.positionMillis);
    //         }

    //         setPlaying(status.isPlaying);
    //     }
    // };

    // sound.current.setOnPlaybackStatusUpdate(updateProgress);

    const UploadVoiceNote = async () => {

        let base_url = remote_host + "/yambi/API/upload_voice_note";

        setDownloadingAudio(true);

        // const fileInfo = await FileSystem.getInfoAsync(message.main_text_message);
        const fileName = message.main_text_message.split('/').pop();

        const formData = new FormData();
        formData.append('voice_note', { uri: message.main_text_message, name: fileName, type: 'audio/m4a' } as never);

        // console.log(message.main_text_message)

        try {
            const response = await axios.post(base_url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // console.error('✅ Upload réussi:', response.data.message);
            // const json = JSON.parse(response.data);
            if (parseInt(response.data.success) === 1) {

                const newPath = FileSystem.documentDirectory + "YambiVoiceNotes/" + response.data.message;

                await FileSystem.moveAsync({
                    from: message.main_text_message,
                    to: newPath,
                });

                const msg: TMessage = {
                    sender: message.sender,
                    receiver: message.receiver,
                    // main_text_message: message.main_text_message,
                    main_text_message: response.data.message,//message.main_text_message,
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
                }

                realm.write(() => {
                    try {
                        realm.create('UsersMessages', msg, true);
                    } catch (error) { }
                });

                //   dispatch(setMessageInbox(""));
                //   dispatch(setResponseTo(""));

                //   if (type === 0) {
                SocketApp.emit('newMessage', msg);

                // DownloadAudio(json.message);
            }

            setDownloadingAudio(false);


        } catch (error) {
            // console.error('❌ Upload échoué:', error.message || error);
        }

        // try {
        //     const response = await fetch(base_url, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'multipart/form-data',
        //         },
        //         body: formData,
        //     });

        //     const result = await response.json();
        //     console.log('Upload result:', result);

        //     console.log(message.main_text_message);
        // } catch (error) {
        //     console.log(error)
        // }

        // try {
        //     // console.log("Upload start")
        //     const filePath = message.main_text_message;//FileSystem.documentDirectory + "YambiVoiceNotes/" + message.main_text_message + ".mp3";
        //     const fileData = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });

        //     const formData = new FormData();
        //     // formData.append('voice_note', ... from fileData / file URI per platform)

        //     axios.post(base_url, formData, {
        //         headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
        //     }).then(async (response) => {
        //         // console.log(response.data);
        //         const json = JSON.parse(response.data);
        //         if (parseInt(json.success) === 1) {

        //             const newPath = FileSystem.documentDirectory + "YambiVoiceNotes/" + json.message;

        //             await FileSystem.moveAsync({
        //                 from: message.main_text_message,
        //                 to: newPath,
        //             });

        //             const msg: TMessage = {
        //                 sender: message.sender,
        //                 receiver: message.receiver,
        //                 // main_text_message: message.main_text_message,
        //                 main_text_message: json.message,//message.main_text_message,
        //                 caption: message.caption,
        //                 message_type: 1,
        //                 reactions: message.reactions,
        //                 response_to: message.response_to,
        //                 message_read: 0,
        //                 read_once: message.read_once,
        //                 flag: message.flag,
        //                 message_effect: message.message_effect,
        //                 token: message.token,
        //                 deleted: message.deleted,
        //                 platform: message.platform,
        //                 createdAt: message.createdAt,
        //                 receivedAt: message.receivedAt,
        //                 readAt: message.readAt,
        //                 playedAt: message.playedAt,
        //                 cc: message.cc,
        //                 alignment: message.alignment
        //             }

        //             realm.write(() => {
        //                 try {
        //                     realm.create('UsersMessages', msg, true);
        //                 } catch (error) { }
        //             });

        //             //   dispatch(setMessageInbox(""));
        //             //   dispatch(setResponseTo(""));

        //             //   if (type === 0) {
        //             SocketApp.emit('newMessage', msg);

        //             // DownloadAudio(json.message);
        //         }

        //         setDownloadingAudio(false);
        //     })
        //         .catch(e => {
        //             console.log(e);
        //         })

        // } catch (error) {
        //     setDownloadingAudio(false);
        //     console.log(error)
        // }
    };

    // const DownloadAudio = () => {
    //     // const filePath = RNFS.DocumentDirectoryPath + "/YambiDownloadedVoiceNotes/" + +".pdf";

    //     // console.log("Download start" + " " + message.main_text_message);

    //     setDownloadingAudio(true);

    //     // RNFS.downloadFile({
    //     //     fromUrl: media_url + "/voice_notes/" + audioFile,
    //     //     toFile: RNFS.DocumentDirectoryPath + "/YambiDownloadedVoiceNotes/" + audioFile,
    //     //     // toFile: audioPath,
    //     //     //   background: true, // Enable downloading in the background (iOS only)
    //     //     //   discretionary: true, // Allow the OS to control the timing and speed (iOS only)
    //     //     progress: (res) => {
    //     //         // Handle download progress updates if needed
    //     //         const progress = (res.bytesWritten / res.contentLength) * 100;
    //     //         // console.log(`Progress: ${progress.toFixed(2)}%`);
    //     //     },
    //     // })
    //     RNFS.downloadFile({
    //         fromUrl: media_url + "/voice_notes/" + message.main_text_message,
    //         toFile: FileSystem.documentDirectory + "YambiVoiceNotes/" + message.main_text_message,
    //         // RNFS.DocumentDirectoryPath + "YambiVoiceNotes/" + audioFile,
    //         // FileSystem.documentDirectory + "/YambiDownloadedVoiceNotes/" + audioFile,
    //         // toFile: audioPath,
    //         //   background: true, // Enable downloading in the background (iOS only)
    //         //   discretionary: true, // Allow the OS to control the timing and speed (iOS only)
    //         progress: (res) => {
    //             // Handle download progress updates if needed
    //             const progress = (res.bytesWritten / res.contentLength) * 100;
    //             setDownloadProgress(progress);
    //         },
    //     })
    //         .promise.then((response) => {
    //             if (response.statusCode === 200) {

    //                 loadSound();
    //             console.log('File downloaded!', response);
    //             setDownloadingAudio(false);
    //             }

    //             if (response.statusCode === 404) {
    //                 console.log(message.main_text_message);
    //                 UploadVoiceNote();
    //             }
    //         })
    //         .catch((err) => {
    //             setDownloadingAudio(false);
    //             // console.log('Download error:', err);
    //         });
    // };


    const DownloadAudio = async () => {

        // console.log(media_url + "/voice_notes/" + message.main_text_message.split('/').pop())

        setDownloadingAudio(true);
        const uri = media_url + "/voice_notes/" + message.main_text_message
        const fileUri = FileSystem.documentDirectory + "YambiVoiceNotes/" + message.main_text_message

        const downloadResumable = FileSystem.createDownloadResumable(
            uri, fileUri, {},
            progress => {
                // console.log('Download progress:', progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
                setDownloadProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
            }
        );

        try {
            const { uri } = await downloadResumable.downloadAsync();
            // console.log('Finished downloading to:', uri);

            loadSound();

            setDownloadingAudio(false);
            // return uri;
        } catch (e) {
            // console.error('Download failed:', e);
            setDownloadingAudio(false);
        }
    };

    const loadSound = async () => {
        // console.log(audioPath);
        try {
            const { sound } = await Audio.Sound.createAsync({ uri: audioPath }, { progressUpdateIntervalMillis: 1000 / 60 }, onPlaybackStatusUpdate);

            // if (message.receiver === user_data.phone_number) {
            //     console.log(sound);
            // }

            setSound(sound);
        } catch (error) {
            // console.log(error)
        }
    }

    const FirstActions = async () => {
        try {
            // Check if the file exists
            // const exists = await RNFS.exists(RNFS.DocumentDirectoryPath + "YambiVoiceNotes/" + message.main_text_message);

            // console.log("okok")
            // if (exists) {
            const fileInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + "YambiVoiceNotes/" + message.main_text_message.split('/').pop());

            // console.log(fileInfo)

            // const fileInfo = message.main_text_message.split('/').pop();
            if (fileInfo.exists) {

                // console.log("okok")

                // if (message.receiver === user_data.phone_number) {
                //     console.log(fileInfo);
                // }

                loadSound();

                const sizeInBytes = fileInfo.size || 0;
                const sizeInKB = sizeInBytes / 1024;
                const sizeInMB = sizeInKB / 1024;

                setFileSize(sizeInKB > 1023 ? sizeInMB.toFixed(1) + "MB" : sizeInKB.toFixed(1) + "KB");
            }
            // console.log("File exists, can be loadeddd");

            //   console.log(`File Size: ${sizeInKB.toFixed(2)} KB (${sizeInMB.toFixed(2)} MB)`);
            // console.log('File exists:', message.main_text_message);
            // }
            // 
            else {
                // console.log("No file", message.main_text_message);

                if (message.sender === user_data.phone_number) {
                    // console.log("Im the sender I upload it");
                    UploadVoiceNote();
                } else {
                    // console.log("I'm the receiver, I Download it");
                    DownloadAudio();
                }
            }
        } catch (e) {

            console.log(e)

        }

        // loadSound();
    }

    const PlayVoice = async () => {
        if (!sound) {
            // console.log("No sound")
            return;
        }

        if (voice_note_being_played === message.main_text_message) { } else {
            dispatch(setVoiceNoteBeingPlayed(message.main_text_message));
            // console.log("Set sound")
        }

        // console.log(status)

        // try {

        //     // Check if the file exists
        //     const exists = await RNFS.exists(RNFS.DocumentDirectoryPath + "/YambiDownloadedVoiceNotes/" + message.main_text_message);
        //     console.log('File exists:', message.main_text_message);

        //     if (exists) {
        //         // console.log("File exists, can be played");

        //         if (playing) {
        //             onVoice(1);
        //         } else {
        //             onVoice(0);
        //         }

        //     } else {
        //         // console.log("No file");

        //         if (message.sender === user_data.phone_number) {
        //             // console.log("Im the sender I upload it")
        //             UploadVoiceNote();
        //         } else {
        //             // console.log("I'm the receiver, I Download it");
        //             DownloadAudio();
        //         }
        //     }
        // } catch (e) {

        //     // console.log("Nooo")

        // }

        // console.log(sound)

        // console.log(status)

        // console.log(voice_note_being_played);

        if (status?.isLoaded && status?.isPlaying === false && status?.didJustFinish === true) {
            setIsPaused(false);
            // setPlayingVoiceNote(true);
            // if (voice_note_being_played != message.main_text_message) {
            // dispatch(setVoiceNoteBeingPlayed(message.main_text_message));
            // }

            // dispatch(setPlayingVoiceNote(true));
            await sound.replayAsync();
        }
        else if (status?.isLoaded && status?.isPlaying && isPaused === false) {
            // console.log("Pause sound");
            // console.log("Is paused")
            setIsPaused(true);
            await sound.pauseAsync();
            // if (voice_note_being_played == message.main_text_message) {
            // dispatch(setVoiceNoteBeingPlayed(""));
            // }
            // setPlayingVoiceNote(false);
        } else if (status?.isLoaded && (status?.isPlaying === false && status?.didJustFinish === false && isPaused === false)) {

            setIsPaused(false);
            // setPlayingVoiceNote(true);
            // if (voice_note_being_played != message.main_text_message) {
            // console.log(status);
            // dispatch(setVoiceNoteBeingPlayed(message.main_text_message));
            // console.log(voice_note_being_played);
            // }
            await sound.replayAsync();
        }
        // else if (status?.isLoaded && !status?.isPlaying && !status?.didJustFinish) {
        //     console.log(!status.isPlaying)
        //     await sound.replayAsync();
        // }
        else {
            setIsPaused(false);
            // console.log("Playing sound: ");
            // setPlayingVoiceNote(true);
            // if (voice_note_being_played != message.main_text_message) {
            // dispatch(setVoiceNoteBeingPlayed(message.main_text_message));
            // console.log("ok")
            // }
            await sound.playAsync();
        }

        // console.log(voice_note_being_played);
    }

    const stopVoice = async () => {
        if (!sound) {
            return;
        }

        await sound.stopAsync();
        setIsPaused(false);
        // setPlayingVoiceNote(false);
        // if (voice_note_being_played == message.main_text_message) {
        // dispatch(setVoiceNoteBeingPlayed(""));
        // }
    }

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

    const pauseBecauseAnotherVoiceStartedPlaying = async () => {
        if (voice_note_being_played !== message.main_text_message) {
            await sound?.pauseAsync();
            setIsPaused(true);
        }
    }

    useEffect(() => {
        pauseBecauseAnotherVoiceStartedPlaying();
    }, [voice_note_being_played]);

    useEffect(() => {

        const timeout = setTimeout(()=>{
            FirstActions();
        }, 150);

        // pauseBecauseAnotherVoiceStartedPlaying();

        // console.log(message.main_text_message);

        // // return () => {
        // //     if (sound) {
        // //         sound.current.unloadAsync();
        // //     }
        // // };
        // return sound
        //     ? () => {
        //         // console.log('Unloading Sound');
        //         sound.current.unloadAsync();
        //     }
        //     : undefined;
        return sound
            ? () => {
                // console.log('Unloading Sound');
                sound.unloadAsync();
                clearTimeout(timeout);
            }
            : undefined;
    }, [message.main_text_message]);

    const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {

        // if (voice_note_being_played !== message.main_text_message) {
        //     // return;
        //     // console.log("Njo ayo")

        //     await sound?.pauseAsync();
        // }

        setStatus(status);

        if (!status?.isLoaded) {
            return;
        }

        // console.log(status)

        // console.log(voice_note_being_played);

        // if (status?.didJustFinish===true) {
        // //     console.log("Did just finished");
        // //     // setStatus(status);
        // //     // console.log(sound)
        // //     // status?.isLoaded?status.positionMillis=0:status.positionMillis=;
        //     await sound?.setPositionAsync(0);
        //     // await sound?.stopAsync();
        //     // setSound(null);
        // //     // console.log(status)
        // //     // await sound?.setStatusAsync(isPlaying)
        // }
    };

    const PlaybackRate = async () => {
        if (!sound) {
            return;
        }

        let rate = 1;

        if (status?.isLoaded) {
            if (status?.rate === 2) {
                rate = 1;
            } else {
                rate = status?.rate + 0.5;
            }
        }

        await sound.setRateAsync(rate, true);
    }

    const isPlaying = status?.isLoaded ? status.isPlaying : false;
    const position = status?.isLoaded ? status.positionMillis : 0;
    const duration = status?.isLoaded ? status.durationMillis : 1;
    const progress = position / duration;

    const formatMilliseconds = (milliseconds: number) => {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        return `${minutes}:${seconds < 10 ? 0 : ""}${seconds}`;
    }

    const progressStyle = useAnimatedStyle(() => ({
        width: progress * 100
        // withTiming(progress * 100, { duration: 100 })
    }))

    return (
        <View style={{
            flexDirection: 'row',
            // justifyContent: 'center',
            // alignItems: 'center',
            marginBottom: -18,
            marginTop: 2
        }}>
            {/* <Text>{message.main_text_message}</Text> */}
            {downloadingAudio ?
                <Pressable
                    onPress={FirstActions}
                    style={{
                        height: 50,
                        width: 50,
                        borderRadius: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.border,
                    }}>
                    {/* <ActivityIndicator color={app_theme.colors.high_color} size={20} /> */}

                    <TextSmallYambiHighColor2 text={downloadProgress.toFixed() + "%"} styles={{}} />
                </Pressable> :
                <Pressable
                    onPress={PlayVoice}
                    style={{
                        height: 50,
                        width: 50,
                        borderRadius: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.border,
                    }}>
                    {!isPlaying ?
                        <IconApp pack='FA6' name="play" color={app_theme.colors.high_color} size={20} />
                        :
                        <IconApp pack='FA6' name="pause" color={app_theme.colors.high_color} size={20} />}
                </Pressable>}

            <View style={{
                marginLeft: 10,
                width: 'auto',
                // flex:1
            }}>
                <View style={{
                    height: 8,
                    width: 102,
                    backgroundColor: app_theme.colors.border,
                    borderColor: app_theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 10
                }}>
                    <Animated.View style={[{
                        height: 6,
                        backgroundColor: status?.isLoaded && status?.isPlaying ? app_theme.colors.high_color : app_theme.colors.gray,
                        borderRadius: 15
                    }, progressStyle]}></Animated.View>
                </View>

                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 25,
                    marginBottom: -2
                }}>
                    <TextSmallYambiGray text={isPlaying ? formatMilliseconds(position || 0) : formatMilliseconds(duration || 0)} />

                    {isPlaying ?
                        <Animated.View entering={FadeIn} exiting={FadeOut}>
                            <Pressable
                                onPress={stopVoice}
                                style={{
                                    height: 20,
                                    width: 20,
                                    justifyContent: 'center'
                                }}>
                                <FontAwesome6 name="stop" color={app_theme.colors.text} size={20} />
                            </Pressable>
                        </Animated.View> : null}

                    {/* <Text style={{ color: app_theme.colors.gray }}>
                        {formatMilliseconds(position || 0)} / {formatMilliseconds(duration || 0)}
                    </Text> */}

                </View>

                <TextSmallYambiGray styles={{ marginBottom: -5, width: 90 }} numberLines={1} text={!downloadingAudio ? fileSize ? fileSize : "" : strings.downloading.toLowerCase()} />
            </View>

            {/* {status?.isLoaded && isPlaying ? */}
            {sound && status?.isLoaded ?
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{
                        // backgroundColor:'green',
                        flex: 1,
                        alignItems: 'flex-end'
                    }}>
                    <Pressable
                        onPress={PlaybackRate}
                        style={{
                            height: 30,
                            width: 60,
                            borderRadius: 5,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: app_theme.colors.border
                        }}>
                        {/* <TextSmallYambi text={status?.rate === 1 ? "1.5x" : status?.rate === 1.5 ? "2x" : status?.rate === 2 ? "1x" : "1x"} /> */}
                        <TextSmallYambi text={status?.rate + "x"} />
                    </Pressable>
                </Animated.View> : null}
        </View>
    )
}

export default VoiceMessageItem;

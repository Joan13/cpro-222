import { View, Text, TouchableOpacity, Platform, TextInput, Keyboard, useWindowDimensions, BackHandler } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import Animated, { BounceIn, BounceOut, FadeIn, FadeInDown, FadeInUp, FadeOut, useAnimatedStyle } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { strings } from '../../lang/lang';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { setCurrentUser, setMessageInbox, setPlayingRecorded, setRecordingAudio, setResponseTo, setShowCustomKeyboard, setVoiceNoteBeingPlayed } from '../../store/reducers/appSlice';
import { TChat, TMessage } from '../../types/types';
// import { SocketApp } from '../../../App';
import moment from 'moment';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats, UsersMessages } from '../../store/database/Models';
import AudioRecorderPlayer, { AVEncoderAudioQualityIOSType, AVEncodingOption, AVModeIOSOption, AudioEncoderAndroidType, AudioSet, AudioSourceAndroidType } from 'react-native-audio-recorder-player';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS, { stat } from 'react-native-fs';
import { AVPlaybackStatus, Audio } from 'expo-av';
import { YambiText } from '../app/Text';
import * as RootNavigation from './../../services/Navigation_ref';
import YambiEmojiKeyboard from '../app/YambiEmojiKeyboard';
import TextInputComponent from '../app/TextInputMessage';
import { PlayActionSound, randomString, renderDateUpToMilliseconds, SocketApp } from '../../../GlobalVariables';
import { IconApp } from '../app/IconApp';
import { Sound } from 'expo-av/build/Audio';
// const KeyboardRegistry = Keyboard.KeyboardRegistry;

const audioRecorderPlayer = AudioRecorderPlayer;

const emojiis = ['😊', '👍', '❤️', '🫴🏽', '😢', '😍', '😎', '🫠', '😶‍🌫️', '☹', '🇿🇦', '👩🏿‍❤️‍👩🏿', '😎', '😎', '😎', '😎'];


const FooterChat = ({ user }: { user: string }) => {
  // const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const contacts = useAppSelector(state => state.app.raw_contacts);
  // const current_user = useAppSelector(state => state.current_user);
  const user_data = useAppSelector(state => state.user_data);
  const app_theme = useAppSelector(state => state.app_theme);
  const message_inbox = useAppSelector(state => state.app.message_inbox);
  const response_to = useAppSelector(state => state.app.response_to);
  // const contacts = useAppSelector(state => state.contacts);
  const app_description = useAppSelector(state => state.persisted_app.app_description);
  const recordingAudio = useAppSelector(state => state.app.recordingAudio);
  const playingRecorded = useAppSelector(state => state.app.playingRecorded);
  const show_custom_keyboard = useAppSelector(state => state.app.show_custom_keyboard);
  const voice_note_being_played = useAppSelector(state => state.app.voice_note_being_played);
  const current_user = useAppSelector(state => state.app.current_user);
  const realm = useRealm();
  const width = useWindowDimensions().width;
  const message = useObject(UsersMessages, response_to);
  const [enterCaption, setEnterCaption] = useState(false);

  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00.00.00');
  const [currentPositionSec, setCurrentPositionSec] = useState(0);
  const [currentDurationSec, setCurrentDurationSec] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [text, setText] = useState("");
  const [playTime, setPlayTime] = useState<number>(0);
  // const [duration, setDuration] = useState('00:00:00');
  const [openPlaySurface, setOpenPlaySurface] = useState(false);
  const [emojis, setEmojis] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [audioFileName, setAudioFileName] = useState("");
  const [caption, setCaption] = useState<string>("");
  // const [pause, setPause] = useState<boolean>(false);
  const [uri, setUri] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
  const [status, setStatus] = useState<AVPlaybackStatus>();
  const [fileSize, setFileSize] = useState<number>();
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [tk, setTk] = useState(randomString(30) + renderDateUpToMilliseconds());
  const audioPath = RNFS.DocumentDirectoryPath + "/YambiVoiceNotes/" + tk + ".mp3";
  const [readyToSendVoiceNote, setReadyToSendVoiceNote] = useState<boolean>(false);
  // const [sound, setSound] = useState();
  // const sound = useRef(new Audio.Sound());

  const chats = useQuery(UserChats);

  const [sound, setSound] = useState<Sound>();

  const renderResponseTo = () => {
    if(message===null) return;
    if (message.message_type === 0) {
      // return(<Text>{message.main_text_message}</Text>)
      return (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}>
          {/* {message.sender === user_data.phone_number ? IconMessageRead(message.message_read) : null} */}
          {/* {message.sender !== user_data.phone_number?<IconApp pack="FA6" name="microphone" size={14} color={app_theme.colors.high_color} styles={{marginRight: 5}} />:null} */}
          <YambiText text={message.main_text_message} size="normal" color="default" numberLines={1} style={{ marginRight: 10, flex: 1 }} />
        </View>
      );
    } else if (message.message_type === 1) {
      return (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}>
          {/* {message.sender === user_data.phone_number ? IconMessageRead(message.message_read) : null} */}
          <IconApp pack="FA6" name="microphone" size={14} color={app_theme.colors.high_color} styles={{ marginRight: 8 }} />
          <YambiText text={strings.voice_note} size="normal" color="default" numberLines={1} style={{ marginRight: 10 }} />
        </View>

      );
    } else {
      return (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}>
          {/* {message.sender === user_data.phone_number ? IconMessageRead(message.message_read) : null} */}
          <IconApp pack="FI" name="image" size={14} color={app_theme.colors.high_color} styles={{ marginRight: 8 }} />
          <YambiText text={strings.picture} size="normal" color="default" numberLines={1} style={{ marginRight: 10 }} />
        </View>

      );
    }
  }

  // const audioPath = RNFS.DocumentDirectoryPath + "/YambiVoiceNotes/sample_rec_audio.mp4";

  // const audioPath = RNFS.DocumentDirectoryPath + "/YambiVoiceNotes/" + randomString(30) + renderDateUpToMilliseconds() + ".mp3";

  const ShowUserName = (user_names: string, phone_number: string) => {
    const contact = contacts.find((cc) => cc.phoneNumber === phone_number);
    if (contact !== undefined) {
      return contact.displayName;
    } else {
      return user_names;
    }
  }

  const loadSound = async () => {

    try {
      const exists = await RNFS.exists(uri);

      if (exists) {
        // console.log('Loading Sound');
        const { sound } = await Audio.Sound.createAsync({ uri: uri }, { progressUpdateIntervalMillis: 1000 / 60 }, onPlaybackStatusUpdate);

        // if (sound) {
        //     console.log("Sound loaded");
        // }
        setSound(sound);
      }
    } catch (error) {

    }


  }

  const PlayVoice = async () => {
    if (!sound) {
      return;
    }

    if (voice_note_being_played === uri) { } else {
      dispatch(setVoiceNoteBeingPlayed(uri));
    }


    if (status?.isLoaded && status?.isPlaying === false && status?.didJustFinish === true) {
      setIsPaused(false);

      // dispatch(setPlayingVoiceNote(true));
      await sound.replayAsync();
    }
    else if (status?.isLoaded && status?.isPlaying && isPaused === false) {
      setIsPaused(true);
      await sound.pauseAsync();
    } else if (status?.isLoaded && (status?.isPlaying === false && status?.didJustFinish === false && isPaused === false)) {

      setIsPaused(false);
      await sound.replayAsync();
    }
    else {
      setIsPaused(false);
      await sound.playAsync();
    }
  }

  const stopVoice = async () => {
    if (!sound) {
      return;
    }

    await sound.stopAsync();
    setIsPaused(false);
  }

  const pauseBecauseAnotherVoiceStartedPlaying = async () => {
    if (voice_note_being_played !== uri) {
      await sound?.pauseAsync();
      setIsPaused(true);
    }
  }

  useEffect(() => {
    pauseBecauseAnotherVoiceStartedPlaying();
  }, [voice_note_being_played]);

  const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {

    setStatus(status);

    if (!status?.isLoaded) {
      return;
    }
  };

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded && typeof status.durationMillis === 'number' ? status.durationMillis : 1;
  const progress = position / duration;

  const formatMilliseconds = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${minutes}:${seconds < 10 ? 0 : ""}${seconds}`;
  }

  const progressStyle = useAnimatedStyle(() => ({
    width: progress * 100
  }))



  // const startCounter = (totalMilliseconds: number) => {
  //   let milliseconds = 0;
  //   const interval = setInterval(() => {
  //     const seconds = Math.floor((milliseconds / 1000) % 60);
  //     const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  //     // setPlayTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  //     milliseconds += 1000; // Increment by 1 second (1000 milliseconds)
  //     if (milliseconds > totalMilliseconds) {
  //       clearInterval(interval);
  //       // console.log('Counter stopped after ' + totalMilliseconds + ' milliseconds.');
  //     }
  //   }, 1000); // Update every second
  // }


  const recordVoiceNote = async () => {

    // playActionSound(1);
    // setRecordTime('00:00:00');
    // setPlayTime(0);

    // if (openPlaySurface) {
    //   setOpenPlaySurface(false);
    // }

    // dispatch(setRecordingAudio(true));

    // if (playingRecorded) {
    //   setPlayingRecorded(false);
    // }

    // await audioRecorderPlayer.stopRecorder();
    // audioRecorderPlayer.removeRecordBackListener();

    // setTimeout(async () => {
    //   // onStartRecord();

    //   const audioSet: AudioSet = {
    //     AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    //     AudioSourceAndroid: AudioSourceAndroidType.MIC,
    //     AVModeIOS: AVModeIOSOption.measurement,
    //     AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    //     AVNumberOfChannelsKeyIOS: 2,
    //     AVFormatIDKeyIOS: AVEncodingOption.aac,
    //   };
    //   const meteringEnabled = false;

    //   if (openPlaySurface) {
    //     setOpenPlaySurface(false);
    //   }

    //   // if (playingRecorded) {
    //   //   setPlayingRecorded(false);
    //   // }

    //   const result = await audioRecorderPlayer.startRecorder(audioPath, audioSet, meteringEnabled);
    //   audioRecorderPlayer.addRecordBackListener((e) => {
    //     setRecordSecs(e.currentPosition);
    //     setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
    //     return;
    //   });
    // }, 50);

    try {
      if (permissionResponse && permissionResponse.status !== 'granted') {
        // console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });

      // console.log('Starting recording..');

      PlayActionSound(1);
      setRecordTime('00:00:00');
      setPlayTime(0);

      if (openPlaySurface) {
        setOpenPlaySurface(false);
      }

      dispatch(setRecordingAudio(true));

      if (playingRecorded) {
        setPlayingRecorded(false);
      }

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      // console.log(recording._uri);
      // console.log('Recording started');
    } catch (err) {
      // console.error('Failed to start recording', err);
    }
  };

  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          setRecordTime(formatMilliseconds(status.durationMillis)); // Convertir en secondes
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recording]);

  const onStopRecord = async () => {
    // // console.log("Starts stopping...")
    // playActionSound(4);
    // setRecordSecs(0);
    setRecordTime('0');
    // setRecording(!recording);
    dispatch(setRecordingAudio(false));
    setOpenPlaySurface(!openPlaySurface);

    if (playingRecorded) {
      setPlayingRecorded(false);
    }

    // const result = await audioRecorderPlayer.stopRecorder();
    // audioRecorderPlayer.removeRecordBackListener();
    // setUri(result);

    if (!recording) {
      return;
    }

    // console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const urii = recording.getURI();

    if (urii)
      setUri(urii);
    // if(urii !==""){
    setReadyToSendVoiceNote(true);
    // }
    // console.log(urii);
  };

  useEffect(() => {
    loadSound();

    return sound
      ? () => {
        // console.log('Unloading Sound');
        sound.unloadAsync();
      }
      : undefined;
  }, [uri]);

  const onVoice = async (index: number) => {

    if (!sound) {
      return;
    }

    PlayActionSound(5);

    // console.log(uri);

    if (index === 0) {

      // sound.setOnPlaybackStatusUpdate((status) => updatePlayTime(status));

      try {
        const result = await sound.getStatusAsync();

        if (result.isLoaded) {
          if (!result.isPlaying) {
            await sound.playAsync()
              .then((s) => {
                dispatch(setPlayingRecorded(true));
                // startCounter(result.durationMillis);

                setIsPaused(true);

                setTimeout(async () => {
                  dispatch(setPlayingRecorded(false));
                  setIsPaused(false);

                  await sound.unloadAsync();
                }, result.durationMillis);
              });
          }
        } else {
          try {

            const result = await sound.loadAsync({ uri: uri });

            if (result.isLoaded) {
              if (!result.isPlaying) {
                await sound.playAsync()
                  .then((s) => {
                    dispatch(setPlayingRecorded(true));
                    // startCounter(result.durationMillis);

                    setIsPaused(true);

                    setTimeout(async () => {
                      dispatch(setPlayingRecorded(false));
                      setIsPaused(false);

                      await sound.unloadAsync();
                    }, result.durationMillis);
                  });
              }
            }
          } catch (error) {
            console.log(error)
          }
        }
      } catch (error) {
        console.log("error");
      }


    }

    if (index === 1) {
      await sound.pauseAsync();
      setIsPaused(false);
    }

    if (index === 2) {
      await sound.stopAsync();
      await sound.unloadAsync();
      dispatch(setPlayingRecorded(false))
      setIsPaused(false);
      setPlayTime(0);
    }
  };

  const updatePlayTime = async (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlayTime(status.positionMillis);
    }
  }

  // RNFS.DocumentDirectoryPath + "/YambiVoiceNotes/"

  // const uploadVoiceNote = () => {
  //   // await audioRecorderPlayer.pausePlayer();

  //   // console.log("Ready to send voice...")

  //   // setLoading_profile(true);

  //   let base_url = remote_host + "/yambi/API/upload_voice_note";
  //   let formData = new FormData();
  //   formData.append('assemble', user_data.phone_number);
  //   formData.append('user_profile', user_data.user_profile);
  //   formData.append('voice_note', { type: 'wav/mp3', uri: uri, name: uri } as any);

  //   axios.post(base_url, formData, {
  //     headers: {
  //       Accept: 'application/json',
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   })
  //     .then(response => {
  //       // setLoading_profile(false);

  //       // if (response.data.message === "1" && response.data.assemble === user_data.phone_number) {
  //       //      dispatch(updateUserProfile(response.data.user_profile));
  //       // }

  //       // setProfile("");
  //       console.log(response.data);

  //     })
  //     .catch((error) => {
  //       // Alert.alert(strings.error, strings.connection_failed);
  //       console.log(error)
  //       // setLoading_profile(false);

  //     });
  // };

  const sendVoiceNote = async () => {

    // console.log(uri)

    if (recordingAudio) {
      // console.log('Stop record first');
      onStopRecord();
    }

    // console.log(uri)

    if (playingRecorded) {
      dispatch(setPlayingRecorded(false));
    }

    setOpenPlaySurface(false);
    setReadyToSendVoiceNote(false);

    // console.log(uri)

    sendMessage(uri, 1);

    // setTimeout(async () => {

    // sendMessage(tk, 1, tk);
    // console.log(uri);
    await sound?.unloadAsync();
    // }, 100);

    // setUri("");

    // setTk(randomString(30) + renderDateUpToMilliseconds());
  };

  const sendMessage = (message: string, type: number, tokenn?: string) => {
    if (message !== "") {
      PlayActionSound(2);
      const time = moment(new Date()).format();
      const token = randomString(30) + renderDateUpToMilliseconds();

      let message_read = 0;

      if (!tokenn) {
        tokenn = token;
      }

      if (type === 1) {
        message_read = 5;
      }

      const msg: TMessage = {
        sender: user_data.phone_number,
        receiver: user,
        main_text_message: message,
        caption: caption,
        message_type: type,
        reactions: '[]',
        response_to: response_to,
        message_read: message_read,
        message_effect: 0,
        read_once: 0,
        flag: 0,
        token: tokenn,
        deleted: 0,
        platform: Platform.OS,
        createdAt: time,
        receivedAt: '',
        readAt: '',
        playedAt: '',
        cc: moment(time).format('DD/MM/YYYY'),
        alignment: moment().utc().toISOString()//moment().format("YYYY-MM-DD HH:mm:ss.SSS")
      }

      // const chat: TChat = {
      //   _id: user,
      //   phone_number: user,
      //   type_chat: 0,
      //   last_message: tokenn,
      //   user: user_data.phone_number,
      //   flag: 0,
      //   chat_read: 1,
      //   deleted: 0,
      //   chat_effect: 0,
      //   createdAt: time,
      //   updatedAt: time,
      // }

      let chat: TChat = {
        _id: user,
        phone_number: user,
        user: user_data.phone_number,
        type_chat: 0,
        last_message: tokenn,
        flag: 0,
        chat_read: 1,
        deleted: 0,
        chat_effect: 0,
        createdAt: time,
        updatedAt: time,
      }

      const chatt = chats.find(itemm => itemm._id === user);

      if (chatt !== undefined) {
        chat = {
          _id: chatt._id,
          phone_number: chatt.phone_number,
          user: chatt.user,
          type_chat: chatt.type_chat,
          last_message: msg.token,
          flag: chatt.flag,
          chat_read: 1,
          deleted: 0,
          chat_effect: chatt.chat_effect,
          createdAt: time,
          updatedAt: moment().format(),
        }
      }

      realm.write(() => {
        try {
          realm.create('UsersMessages', msg);
          // } catch (error) { }

          // try {
          realm.create('UserChats', chat, true);
        } catch (error) { }
      });

      // realm.write(() => {
      //   try {
      //     realm.create('UserChats', chat, true);
      //   } catch (error) { }
      // });


      dispatch(setMessageInbox(""));
      // dispatch(setMessageInbox(""));

      // dispatch(addDraft({ message_inbox: "", user: current_user }));
      dispatch(setResponseTo(""));

      // console.log("Message sent")

      if (type === 0) {
        SocketApp.emit('newMessage', msg);
      }
    }
  }

  const send_icon = () => {
    if (message_inbox === "") {
      return false;
    }

    return true;
  }

  const RecordingOrPlaying = () => {
    if (recordingAudio || playingRecorded || openPlaySurface && readyToSendVoiceNote) {
      return true;
    }

    return false;
  }

  // const RecordingOrPlaying = () => {
  //   if (recordingAudio && openPlaySurface) {
  //     return true;
  //   }

  //   return false;
  // }

  const NotRecordingOrPlayingAandNoMessage = () => {
    if (!recordingAudio && !playingRecorded && !openPlaySurface && message_inbox === "") {
      return true;
    }

    return false;
  }

  const stopBeforeQuit = async () => {
    PlayActionSound(3);
    if (openPlaySurface) {
      setOpenPlaySurface(false);
    }

    // await audioRecorderPlayer.stopRecorder();
    // audioRecorderPlayer.removeRecordBackListener();

    // console.log('Stopping recording..');
    if (recording) {
      setRecording(undefined);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync(
        {
          allowsRecordingIOS: false,
        }
      );
      // const urii = recording.getURI();
    }

    setReadyToSendVoiceNote(false);
    // setUri(uri);
    // console.log('Recording stopped and stored at', urii);

    dispatch(setRecordingAudio(false));

    setTimeout(async () => {
      // sendMessage(tk, 1, tk);
      // console.log(uri);
      await sound?.unloadAsync();
    }, 100);
  }

  useEffect(() => {

    const backAction = () => {

      if (recordingAudio) {
        stopBeforeQuit();
        return true;
      }

      if (playingRecorded) {
        onVoice(2);
        console.log(playingRecorded)
        return true;
      }

      // if (current_user !== "") {
      //   console.log(current_user);
      //   return true;
      // }
      dispatch(setCurrentUser(""));

      // setCurrentUser("");

      // console.log(current_user);

      return false;

    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true); // or some other action
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false); // or some other action
      }
    );

    return () => {
      backHandler.remove();
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
      // sound.current.unloadAsync();
      // sound
      //   ? () => {
      //     console.log('Unloading Sound');
      //     sound.unloadAsync();
      //   }
      //   : undefined;
    };
  }, [recordingAudio, playingRecorded, sound]);

  const openEmojis = () => {
    if (show_custom_keyboard) {
      // If emoji keyboard is open, close it and show system keyboard
      dispatch(setShowCustomKeyboard(false));
      // Small delay to ensure emoji keyboard closes, then focus input to show system keyboard
      setTimeout(() => {
        // Focus will be handled by TextInputMessage component
        // The input will automatically show system keyboard when show_custom_keyboard becomes false
      }, 150);
    } else {
      // Dismiss the system keyboard first
      Keyboard.dismiss();
      
      // Small delay to ensure keyboard is dismissed
      setTimeout(() => {
        // Open emoji keyboard
        dispatch(setShowCustomKeyboard(true));
      }, 100);
    }
  }

  const ShowEmojiKeyboard = () => {
    if (!keyboardVisible && emojis) {
      return true;
    }

    return false;
  }

  const voice_surface = () => {
    if (recordingAudio || openPlaySurface) {
      return true;
    }

    return false;
  }

  const handleSelectionChange = (event) => {
    setSelection(event.nativeEvent.selection);
  };

  const insertEmoji = () => {
    // const start = selection.start;
    // const end = selection.end;
    // const newText = message_inbox.slice(0, start) + emoji + message_inbox.slice(end);
    // setText(newText);

    // dispatch(setMessageInbox(emoji));

    // // Update the cursor position after the emoji
    // setSelection({
    //   start: start + emoji.length,
    //   end: start + emoji.length,
    // });
    // console.log(newText);

    // console.log(inputRef)
    // dispatch(setMessageInbox(emoji));
  };

  // const ii = useMemo(()=>insertEmoji,[message_inbox])

  // const SmileysEmotion = () => {
  //   return (
  //     <ScrollView>
  //       {/* <FlatList
  //         data={smileys_emotion}
  //         renderItem={({ item }: { item }) => (
  //           <Emoji
  //             item={item}
  //           // index={index}
  //           // messages={messages}
  //           // selectEmoji={inputText}
  //           />
  //         )}
  //         contentContainerStyle={{}}
  //         numColumns={8}
  //       /> */}

  //       {emojiis.map((emoji, index) => (
  //         <Pressable key={index} onPress={() => insertEmoji(emoji)} style={{}}>
  //           <Text style={{}}>{emoji}</Text>
  //         </Pressable>
  //       ))}
  //     </ScrollView>
  //   )
  // }

  //  type TextInputMessage={
  // selectionn:TSelection,
  // inputReff: refType
  //   }

  return (
    <View style={{
      width: width,
      backgroundColor: app_theme.colors.background,
      minHeight: 80, maxHeight: 350,
      borderColor: app_theme.colors.border, borderTopWidth: 1,
      paddingBottom:  15
    }}>

      {/* <View style={{ paddingBottom: 0, minHeight: 80, maxHeight: 350, backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border, borderTopWidth: 1 }}> */}
      {/* <Text>okok</Text> */}
      {response_to !== "" ?
        message !== null ?
          <View style={{
            // flex:1
          }}>
            <View style={{
              borderLeftColor: app_theme.colors.high_color,
              borderLeftWidth: 5,
              borderRadius: 3,
              paddingHorizontal: 8,
              paddingVertical: 5,
              backgroundColor: app_theme.colors.border,
              margin: 4,
              marginHorizontal: 10,
              // flex:1
            }}>
              <View style={{
                flexDirection: 'row'
              }}>
                <Text
                  numberOfLines={1} style={{
                    flex: 1,
                    color: '#f59f00',
                    fontSize: app_description.small_general_font_size,
                    fontWeight: app_description.small_general_font_weight as any
                  }}>{message.sender === user ? ShowUserName(user, user) : strings.you}</Text>
                <TouchableOpacity onPress={() => dispatch(setResponseTo(""))}
                  style={{ padding: 0 }}>
                  <Feather name='x' color={app_theme.colors.gray} size={13} />
                </TouchableOpacity>
              </View>
              {renderResponseTo()}
            </View>
          </View>
          : null : null}

      <View style={{ flexDirection: 'row', }}>

        {!voice_surface() ?
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            {/* <Button title="😊" onPress={() => insertEmoji('😊')} />
      <Button title="👍" onPress={() => insertEmoji('👍')} /> */}

            {/* <TextInput
              // onSelectionChange={handleSelectionChange}
              onSelectionChange={({ nativeEvent: { selection } }) => setSelection(selection)}
              selection={selection}
              multiline={true}
              ref={inputRef}
              onFocus={handleFocus}

              onBlur={() => {
                // this.props.dispatch({ type: 'SET_SCROLL_TO_END', payload: true });
              }}

              style={{ paddingLeft: 10, paddingTop: 0, minHeight: 50, fontSize: app_description.general_font_size, maxHeight: 150, color: app_theme.colors.text, backgroundColor: app_theme.colors.background, paddingBottom: 2 }}
              placeholder={strings.type_message}
              value={message_inbox}
              onChangeText={(text) => {
                dispatch(setMessageInbox(text));
              }}
              placeholderTextColor={app_theme.colors.gray}

            /> */}

            <TextInputComponent user={user} />

            {enterCaption && message_inbox !== "" ?
              <Animated.View entering={FadeInDown}>
                <TextInput
                  // onSelectionChange={handleSelectionChange}
                  // selection={selection}
                  multiline={true}
                  // ref={inputRef}
                  // onFocus={handleFocus}

                  onBlur={() => {
                    // this.props.dispatch({ type: 'SET_SCROLL_TO_END', payload: true });
                  }}

                  style={{ paddingLeft: 10, paddingTop: 0, height: 50, fontSize: app_description.general_font_size, maxHeight: 50, color: app_theme.colors.text, backgroundColor: app_theme.colors.background, paddingBottom: 2, borderColor: app_theme.colors.gray, borderTopWidth: 1 }}
                  placeholder={strings.add_caption}
                  // value={draft !== null ? draft.draft : null}
                  value={caption}
                  onChangeText={(text) => setCaption(text)}
                  placeholderTextColor={app_theme.colors.gray}
                />
              </Animated.View> : null}

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingRight: 10 }}>
              <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'row' }}>
                {/* <TouchableOpacity
                  // onPress={() => RootNavigation.navigate('contacts')}
                  style={{ paddingRight: 5, paddingLeft: 5, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, height: 30 }}>
                  <IconApp pack='FI' name="camera" size={20} color={app_theme.colors.gray} />
                </TouchableOpacity> */}
                {/* <TouchableOpacity
                  // onPress={() => RootNavigation.navigate('contacts')}
                  style={{ paddingRight: 5, paddingLeft: 5, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, height: 30 }}>
                  <MaterialCommunityIcons name="cookie" size={22} color={app_theme.colors.gray} />
                </TouchableOpacity> */}
                {!playingAudio || !voice_surface() ?
                  <>
                    <TouchableOpacity
                      onPress={() => RootNavigation.navigate("PictureMessage", { user: user })}
                      style={{ paddingRight: 5, paddingLeft: 5, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, height: 30 }}>
                      <IconApp pack='FI' name="image" size={20} color={app_theme.colors.gray} />
                    </TouchableOpacity>


                    {message_inbox !== "" ?
                      <TouchableOpacity
                        onPress={() => setEnterCaption(!enterCaption)}
                        style={{ paddingRight: 5, paddingLeft: 5, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, height: 30 }}>
                        {enterCaption ?
                          <IconApp pack='MC' name="closed-caption" size={24} color={app_theme.colors.gray} />
                          :
                          <IconApp pack='MC' name="closed-caption-outline" size={24} color={app_theme.colors.gray} />}
                      </TouchableOpacity> : null}
                  </> : null}
                {/* <TouchableOpacity
                  onPress={openEmojis}
                  // onPress={() => {
                  //   if (this.props.message_input_tab === 4) {
                  //     this.props.dispatch({ type: 'SET_MESSAGE_INPUT_TAB', payload: 0 });
                  //   }
                  //   else {
                  //     this.props.dispatch({ type: 'SET_MESSAGE_INPUT_TAB', payload: 4 });
                  //   }
                  //   this.showKeyboardView('YambiEmojis');
                  // }}
                  style={{ paddingRight: 5, paddingLeft: 5, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, height: 30 }}>
                  {show_custom_keyboard ? (
                    <IconApp pack='MC' name="keyboard" size={20} color={app_theme.colors.gray} />
                  ) : (
                    <IconApp pack='MC' name="emoticon" size={20} color={app_theme.colors.gray} />
                  )}
                </TouchableOpacity> */}
                {/* <TouchableOpacity
                  // onPress={() => RootNavigation.navigate('contacts')}
                  style={{ paddingRight: 5, paddingLeft: 5, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, height: 30 }}>
                  <MaterialCommunityIcons name="sticker-emoji" size={20} color={app_theme.colors.gray} />
                </TouchableOpacity> */}
                {/* <TouchableOpacity
                  // onPress={() => {
                  //   if (this.props.message_input_tab === 6) {
                  //     this.props.dispatch({ type: 'SET_MESSAGE_INPUT_TAB', payload: 0 });
                  //   }
                  //   else {
                  //     this.props.dispatch({ type: 'SET_MESSAGE_INPUT_TAB', payload: 6 });
                  //   }
                  // }}
                  style={{ paddingRight: 5, paddingLeft: 5, height: 30, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 }}>
                  <MaterialCommunityIcons name="alpha-a-box" size={20} color={app_theme.colors.gray} />
                </TouchableOpacity> */}
              </View>
            </View>
          </View>
          :
          <View style={{ flex: 1, paddingVertical: 7, paddingHorizontal: 15, height: 80 }}>

            {recordingAudio ?
              <View style={{
                height: 70,
                justifyContent: 'space-between'
              }}>
                <View style={{
                  flexDirection: 'row',
                  // marginBottom: 8
                  // flex: 1
                }}>
                  <YambiText text={`${strings.recording}     `} size="small" color="high" />
                  <YambiText text={`   ${recordTime}`} size="small" color="gray" />
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // flex: 1
                }}>
                  <TouchableOpacity
                    onPress={stopBeforeQuit}
                    style={{
                      height: 44,
                      width: 44,
                      borderRadius: 22,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: app_theme.colors.error + '20',
                      borderWidth: 1,
                      borderColor: app_theme.colors.error + '40',
                    }}>
                    <MaterialIcons name="delete-outline" color={app_theme.colors.error} size={22} />
                  </TouchableOpacity>

                  <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {/* <TouchableOpacity
                      style={{
                        height: 40,
                        width: 40,
                        borderRadius: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.border,
                      }}
                      onPress={onStopRecord}>
                      <FontAwesome6 name="stop" color={app_theme.colors.text} size={20} />
                    </TouchableOpacity> */}
                  </View>
                </View>
              </View> : null}

            {openPlaySurface ?
              <View style={{
                height: 70,
                justifyContent: 'space-between'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                  // justifyContent: 'space-between'
                  // marginBottom: 10
                }}>
                  <YambiText text={`${strings.voice_note}     `} size="small" color="high" />
                  <YambiText text={`${formatMilliseconds(position || 0)} / ${formatMilliseconds(duration || 0)}`} size="small" color="gray" />

                  <View style={{
                    height: 8,
                    width: 102,
                    backgroundColor: app_theme.colors.border,
                    borderColor: app_theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 10,
                    marginLeft: 15
                  }}>
                    <Animated.View style={[{
                      height: 6,
                      backgroundColor: status?.isLoaded && status?.isPlaying ? app_theme.colors.high_color : app_theme.colors.gray,
                      borderRadius: 15
                    }, progressStyle]}></Animated.View>
                  </View>

                  {/* <TextSmallYambiGray text={`   ${moment(playTime).format("mm:ss")}`} /> */}
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <View style={{
                    // flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {playingRecorded ?
                      <TouchableOpacity
                        style={{
                          height: 44,
                          width: 44,
                          borderRadius: 22,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: app_theme.colors.error + '20',
                          borderWidth: 1,
                          borderColor: app_theme.colors.error + '40',
                        }}
                        onPress={() => onVoice(2)}>
                        <FontAwesome6 name="stop" color={app_theme.colors.error} size={20} />
                      </TouchableOpacity> :
                      <TouchableOpacity
                        onPress={stopBeforeQuit}
                        style={{
                          height: 44,
                          width: 44,
                          borderRadius: 22,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: app_theme.colors.error + '20',
                          borderWidth: 1,
                          borderColor: app_theme.colors.error + '40',
                        }}>
                        <MaterialIcons name="delete-outline" color={app_theme.colors.error} size={22} />
                      </TouchableOpacity>}
                  </View>

                  <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <TouchableOpacity
                      style={{
                        height: 48,
                        width: 48,
                        borderRadius: 24,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.high_color + '20',
                        borderWidth: 1,
                        borderColor: app_theme.colors.high_color + '40',
                      }}
                      onPress={PlayVoice}>
                      {!isPlaying ?
                        <FontAwesome6 name="play" color={app_theme.colors.high_color} size={18} /> :
                        <FontAwesome6 name="pause" color={app_theme.colors.high_color} size={18} />}
                    </TouchableOpacity>
                  </View>
                </View>
              </View> : null}
          </View>}


        <View style={{ marginHorizontal: 7, justifyContent: 'center', alignItems: 'center' }}>


          <View style={{ height: 30, flex: 1 }}>
            {message_inbox !== "" ?
              <TouchableOpacity
                // onPress={() => RootNavigation.navigate('contacts')}
                style={{ height: 30, width: 20, justifyContent: 'center', alignItems: 'center' }}>
                <IconApp pack='FI' name="maximize-2" size={15} color={app_theme.colors.background} />
              </TouchableOpacity> : null}
          </View>


          {message_inbox !== "" ?
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <TouchableOpacity
                onPress={() => sendMessage(message_inbox, 0, "")}
                style={{
                  height: 48,
                  width: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: app_theme.colors.design_tip2,
                  borderRadius: 24,
                  shadowColor: app_theme.colors.design_tip2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  // elevation: 4,
                }}>
                <Ionicons name="send" size={20} color={app_theme.colors.text_design2} />
              </TouchableOpacity>
            </Animated.View> : null}

          {readyToSendVoiceNote ?
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <TouchableOpacity
                onPress={sendVoiceNote}
                style={{
                  height: 48,
                  width: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: app_theme.colors.design_tip2,
                  borderRadius: 24,
                  shadowColor: app_theme.colors.design_tip2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  // elevation: 4,
                }}>
                <Ionicons name="send" size={20} color={app_theme.colors.text_design2} />
              </TouchableOpacity></Animated.View> : null}

          {recordingAudio ?
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <TouchableOpacity
                onPress={onStopRecord}
                style={{
                  height: 48,
                  width: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: app_theme.colors.design_tip2,
                  borderRadius: 24,
                  shadowColor: app_theme.colors.design_tip2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  // elevation: 4,
                }}>
                <Ionicons name="stop" size={20} color={app_theme.colors.text_design2} />
              </TouchableOpacity></Animated.View> : null}

          {/* {RecordingOrPlaying() ?
            <TouchableOpacity
              onPress={sendVoiceNote}
              style={{ height: 50, width: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: app_theme.colors.design_tip2, borderRadius: 50, borderColor: app_theme.colors.border, borderWidth: 1 }}>
              <Ionicons name="stop" size={18} color={app_theme.colors.text_design2} />
            </TouchableOpacity> : null} */}


          {NotRecordingOrPlayingAandNoMessage() ?
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <TouchableOpacity
                onPress={recordVoiceNote}
                style={{
                  height: 48,
                  width: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: app_theme.colors.design_tip2,
                  borderRadius: 24,
                  shadowColor: app_theme.colors.design_tip2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  // elevation: 4,
                }}>
                <IconApp pack='FA6' name="microphone" size={20} color={app_theme.colors.text_design2} />
              </TouchableOpacity></Animated.View> : null}
        </View>
      </View>

      {/* <YambiEmojiKeyboard inputText={insertEmoji} /> */}

      {/* <ImagesKeyboard /> */}
      {/* {show_custom_keyboard ? <YambiEmojiKeyboard /> : null} */}
      {/* {ShowEmojiKeyboard() ?  <SmileysEmotion /> : null} */}
      {/* <KeyboardAccessoryView
// customKeyboardViewNat
// renderContent={}
></KeyboardAccessoryView> */}
      {/*  */}
    </View>
  )
}

export default FooterChat;


// import React, { useState, useRef } from 'react';
// import { View, TextInput, Button } from 'react-native';

// const EmojiTextInput = () => {
//   const [text, setText] = useState('');
//   const [selection, setSelection] = useState({ start: 0, end: 0 });
//   const inputRef = useRef(null);

//   const handleSelectionChange = (event) => {
//     setSelection(event.nativeEvent.selection);
//   };

//   const insertEmoji = (emoji) => {
//     const start = selection.start;
//     const end = selection.end;
//     const newText = text.slice(0, start) + emoji + text.slice(end);
//     setText(newText);

//     // Update the cursor position after the emoji
//     setSelection({
//       start: start + emoji.length,
//       end: start + emoji.length,
//     });

//     // Set focus back to the TextInput
//     inputRef.current.focus();
//   };

//   return (
//     <View>
//       <TextInput
//         ref={inputRef}
//         value={text}
//         onChangeText={setText}
//         onSelectionChange={handleSelectionChange}
//         selection={selection}
//         style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
//       />
//       <Button title="😊" onPress={() => insertEmoji('😊')} />
//       <Button title="👍" onPress={() => insertEmoji('👍')} />
//     </View>
//   );
// };

// export default EmojiTextInput;


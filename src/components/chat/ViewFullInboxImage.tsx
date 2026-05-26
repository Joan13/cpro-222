import { View, Text, useWindowDimensions, Pressable, Alert, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import {  useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    runOnJS 
} from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system/legacy';
import { strings } from '../../lang/lang';
import Pinchable from 'react-native-pinchable';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TMessage } from '../../types/types';
import { remote_host_server, media_url } from '../../../GlobalVariables';
import { useObject } from '@realm/react';
import { UsersMessages } from '../../store/database/Models';
import { setShowModalApp } from '../../store/reducers/appSlice';
import AppActivityIndicator from '../app/AppActivityIndicator';
import ModalApp from '../app/ModalApp';
import { TextNormalYambiGray } from '../app/Text';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ViewImage = NativeStackScreenProps<RootStackParamList, 'ViewFullInboxImage'>;

const ViewFullInboxImage = ({ route }: ViewImage) => {
    const navigation = useNavigation();
    const { message } = route.params;
    const width = useWindowDimensions().width;

    const app_theme = useAppSelector(state => state.app_theme);
    const [file_saved_alert, setFile_saved_alert] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const [downloading, setDownloading] = useState<boolean>(false);

    const mm = useObject(UsersMessages, message);

    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    const closeImage = () => {
        navigation.goBack();
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            // Only allow downward swipes
            if (event.translationY > 0) {
                translateY.value = event.translationY;
                // Reduce opacity as user swipes down
                opacity.value = 1 - (event.translationY / SCREEN_HEIGHT) * 0.8;
            }
        })
        .onEnd((event) => {
            // If swiped down more than 30% of screen height, close the image
            if (event.translationY > SCREEN_HEIGHT * 0.3 || event.velocityY > 500) {
                translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
                opacity.value = withTiming(0, { duration: 200 }, () => {
                    runOnJS(closeImage)();
                });
            } else {
                // Spring back to original position
                translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
                opacity.value = withSpring(1, { damping: 20, stiffness: 90 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            opacity: opacity.value,
        };
    });

    const Download = async (url: string, name: string) => {
        if (downloading) return;
        setDownloading(true);
        try {
            const dir = FileSystem.documentDirectory + "Yambi/Yambi Images/";
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            const dest = dir + name;
            const { status } = await FileSystem.downloadAsync(url, dest);
            if (status !== 200) {
                throw new Error(`HTTP ${status}`);
            }
            dispatch(setShowModalApp(true));
            setFile_saved_alert(true);
        } catch {
            Alert.alert(strings.error, strings.connection_error);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        // console.log(mm)
    }, []);

    if (!mm) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View
                style={{
                    flex: 1,
                    backgroundColor: app_theme.colors.background
                }}>

                {file_saved_alert ?
                    <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setFile_saved_alert(false) }} singleButton title={strings.success}>
                        <TextNormalYambiGray text={strings.file_saved} />
                    </ModalApp> : null}

                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                        <Pinchable style={{ flex: 1 }}>
                            <FastImage
                                style={{
                                    flex: 1,
                                    borderRadius: 5,
                                    width: width
                                }}
                                resizeMode={FastImage.resizeMode.contain}
                                source={{
                                    priority: FastImage.priority.high,
                                    cache: 'immutable',
                                    uri: mm.message_read === 5 ? mm.main_text_message : media_url + "/picture_messages/" + mm.main_text_message
                                }} />
                        </Pinchable>
                    </Animated.View>
                </GestureDetector>

                <Pressable
                    onPress={() => Download(media_url + "/picture_messages/" + mm.main_text_message, mm.main_text_message)}
                    style={{
                        height: 45,
                        width: 45,
                        borderRadius: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: app_theme.colors.border,
                        alignSelf: 'flex-end',
                        position: 'absolute',
                        right: 15,
                        top: 10,
                        zIndex: 10,
                    }}>
                    {downloading ? <AppActivityIndicator /> :
                        <MaterialCommunityIcons name="download-box" size={20} color={app_theme.colors.high_color} />}
                </Pressable>

            </View>
        </GestureHandlerRootView>
    )
}

export default ViewFullInboxImage;

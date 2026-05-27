import { ActivityIndicator, Pressable, Text, Vibration, View } from "react-native";
import { NavProps, RootStackParamList, TMessage } from "../../../types/types";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { useRealm } from "@realm/react";
import { Image as ExpoImage } from 'expo-image';
import axios from "axios";
import moment from "moment";
import * as RootNavigation from './../../../services/Navigation_ref';
import { randomString, remote_host, remote_host_server, renderDateUpToMilliseconds, SocketApp, media_url } from "../../../../GlobalVariables";

const PictureMessageItem = ({ message }: { message: TMessage }) => {

    const user_data = useAppSelector(state => state.user_data);
    const app_theme = useAppSelector(state => state.app_theme);

    // const navigation = useNavigation<NativeStackScreenProps<RootStackParamList>>();

    const realm = useRealm();

    // const [source, setSource] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);

    const upload_picture = async () => {

        setUploading(true);

        let base_url = remote_host + "/yambi/API/upload_picture";
        let formData = new FormData();
        formData.append('image', { type: 'image/jpg', uri: message.main_text_message, name: message.main_text_message } as any);

        await axios.post(base_url, formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                if (parseInt(response.data.message) === 1) {
                    sendMessage(response.data.file_name);
                }

                setUploading(false);
            })
            .catch((error) => {
                // Alert.alert(strings.error, strings.connection_failed);
                console.log(error)
                setUploading(false);

            });
    };

    const sendMessage = (text: string) => {
        if (message.main_text_message !== "") {
            //   playActionSound(2);
            Vibration.vibrate(10);
            const time = moment(new Date()).format();
            const token = randomString(30) + renderDateUpToMilliseconds();

            const msg: TMessage = {
                sender: message.sender,
                receiver: message.receiver,
                main_text_message: text,
                caption: message.caption,
                message_type: 2,
                reactions: message.reactions,
                response_to: message.response_to,
                message_read: 0,
                read_once: message.read_once,
                message_effect: message.message_effect,
                flag: message.flag,
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
            // dispatch(setResponseTo(""));

            // navigation.goBack();

            SocketApp.emit('newMessage', msg);
        }
    }

    const FirstOpen = () => {
        if (message.message_read === 5) {

            // console.log("Image not sent yet.");

            if (message.sender === user_data.phone_number) {
                // console.log("I'm the sender I can upload image...");

                upload_picture();
            }
        }
    }

    useEffect(() => {
        // console.log(message);

        const timeout = setTimeout(() => {
            FirstOpen();
        }, 200);

        return () => clearTimeout(timeout);

    }, []);

    // type ViewFullImageInbox={
    //     params: TMessage;
    // }

    return (
        <Pressable
            onPress={() => RootNavigation.navigate("ViewFullInboxImage", { message: message.token })}
            style={{ marginBottom: 5, marginTop: 3 }}>
            <ExpoImage
                style={{
                    height: 150,
                    borderRadius: 5
                }}
                contentFit="cover"
                source={message.message_read === 5 ? message.main_text_message : media_url + "/picture_messages/" + message.main_text_message} />

            {uploading ?
                <View style={{
                    position: 'absolute',
                    left: 95,
                    top: 50,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    width: 45,
                    height: 45,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 30
                }}>
                    <ActivityIndicator color={app_theme.colors.high_color} size={30} />
                </View> : null}
        </Pressable>
    )
}

export default PictureMessageItem;


import { View, ScrollView, TextInput, Image, Text, SafeAreaView, Pressable, KeyboardAvoidingView, PermissionsAndroid, Platform, Dimensions } from "react-native";
import { useRef, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { TextNormalYambi, TextNormalYambiError, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambi, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, renderDateUpToMilliseconds } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TBusinessUser, TUser } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import { BusinessUsers, UserBusinesses, UserContacts, UserSellsPoints } from "../../store/database/Models";
import { IconApp } from "../../components/app/IconApp";
import moment from "moment";
import { FlashList } from "@shopify/flash-list";
import ContactsList from "../../components/lists/contacts/ContactsList";
import ImagePicker from '../../utils/imagePicker';
import * as NavigationBar from 'expo-navigation-bar';
import NewStoryImagesList from "../../components/lists/stories/NewStoryImagesList";
// import { Camera, useCameraDevice, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
// import { Surface } from 'gl-react-native';
// import { Node, Shaders, GLSL } from 'gl-react';


// const shaders = Shaders.create({
//   sepia: {
//     frag: GLSL`
//       precision highp float;
//       varying vec2 uv;
//       uniform sampler2D cameraImage;
//       void main () {
//         vec4 color = texture2D(cameraImage, uv);
//         float gray = dot(color.rgb, vec3(0.3, 0.59, 0.11));
//         gl_FragColor = vec4(
//           gray * vec3(1.2, 1.0, 0.8),
//           color.a
//         );
//       }
//     `,
//   },
// });

// const Sepia = ({ children }: any) => (
//   <Node shader={shaders.sepia} uniforms={{ cameraImage: children }} />
// );

const NewStory = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [name, setName] = useState<string>("");
    const [phone_number, setPhone_number] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [raiseAlert, setRaiseAlert] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [showUsers, setShowUsers] = useState(false);
    const [showUserError, setShowUserError] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [level, setLevel] = useState(3);
    const dispatch = useAppDispatch();
    // const camera = useRef<Camera>(null);
    // const device = useCameraDevice('back')
    // const { hasPermission } = useCameraPermission()

    // if (!hasPermission) return <Text>No permission</Text>
    // if (device == null) return <Text>No camera connected</Text>

    const { flag } = route.params;
    const data = Array.from({ length: 10 }, (_, i) => ({ id: i, title: `Item ${i}` }));

    // const contacts = useQuery(UserContacts, contacts => { return contacts; }, []);

    const { width, height } = Dimensions.get('window');

    const pick_profile = () => {

        ImagePicker.openPicker({
            width: 500,
            height: 500,
            cropping: true,
            quality: 0.5,
            // noData: true,
            mediaType: "photo",
            multiple: true
        }).then(images => {

            // for (let i in images) {
            // console.log(images[i].path)
            setPhotos(images as never);
            // }
        })
            .catch((e) => { });
    }

    useEffect(() => {

        if (photos.length !== 0) {
            navigation.setOptions({
                headerShown: false,
                statusBarHidden: true,
                statusBarStyle: theme.statusbar,
                statusBarColor: theme.colors.design_tip2
            });
            // NavigationBar.setBackgroundColorAsync("#000000");
        } else {
            navigation.setOptions({ headerShown: true });
        }

        // if (flag === 1) {
        //     pick_profile();
        // }

    }, [photos]);

    const deleteStatus = (item) => {
        const pp = photos.filter(element => element.path !== item.path);
        setPhotos(pp);

        if (pp.length === 0) {
            navigation.setOptions({
                headerShown: true,
                statusBarHidden: false,
                statusBarStyle: theme.statusbar,
                statusBarColor: theme.colors.design_tip2
            });
            navigation.goBack();
        }
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: photos.length === 0 ? theme.colors.background : "#000000"
        }}      // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            {photos.length === 0 ?
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Pressable onPress={pick_profile}>
                        <IconApp name="camera-plus" pack="MC" size={50} color={theme.colors.high_color} />
                    </Pressable>
                </View>
                :
                <FlashList
                    estimatedItemSize={width}
                    data={photos}
                    // horizontal
                    pagingEnabled
                    keyboardShouldPersistTaps="handled"

                    renderItem={({ item, index }: { item, index: number }) => (
                        <NewStoryImagesList
                            item={item}
                            index={index}
                            onGoBack={() => navigation.goBack()}
                            onDeleteStatus={() => deleteStatus(item)}
                            onReadyStatus={() => { }} />
                    )}
                    contentContainerStyle={{
                        backgroundColor: '#000000'
                    }}
                />}


            {/* <View style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: 50,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <TextInput
                    placeholder={strings.add_caption}
                    multiline={true}
                    placeholderTextColor={"gray"}
                    style={{
                        color: 'white',
                        flex:1,
                        backgroundColor: 'transparent'
                    }}
                />

                <Pressable style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    height: 35,
                    paddingHorizontal: 10,
                    paddingLeft: 15,
                    borderRadius: 30,
                    backgroundColor: theme.design_tip2
                }}>
                    <Text style={{
                        color: theme.text_design2,
                        fontSize: app_description.general_font_size
                    }}>{strings.send_photo}</Text>
                    <IconApp name="chevron-right" pack="FI" size={25} color={theme.text_design2} />
                </Pressable>
            </View> */}

            {/* <FlashList
    data={data}
    horizontal
    renderItem={({ item }) => (
      <View style={{ width: 120, height: 150, backgroundColor: 'lightblue', margin: 8, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{item.title}</Text>
      </View>
    )}
    estimatedItemSize={120}
    // contentContainerStyle={{ height: 160 }}
  /> */}

        </View>
    )
}


export default NewStory;



{/* Filter layer (fake) on top */ }
//   <Surface style={styles.filterLayer}>
//     <Sepia>
{/* In a real app, you'd pass a camera frame here */ }
{/* This is where gl-react processes image stream */ }
{/* </Sepia>
      </Surface> */}
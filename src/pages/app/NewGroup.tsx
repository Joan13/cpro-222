import { useCallback, useEffect, useState } from 'react';
import { View, Text, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, FlatList, Image, Dimensions, TextInput, Platform, DevSettings, Pressable, SafeAreaView } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FontsAwesome from 'react-native-vector-icons/FontAwesome';
import Animated from 'react-native-reanimated';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { useNavigation } from '@react-navigation/native';
import StatusBarYambi from '../../components/app/StatusBar';
import DocumentPicker, { pick } from 'react-native-document-picker';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import { updateUser, updateUserProfile } from '../../store/reducers/userSlice';
import axios from 'axios';
import ButtonNormal from '../../components/app/ButtonNormal';
import { setContactsSelected, setLoadingButton } from '../../store/reducers/appSlice';
import { TextNormalYambi, TextNormalYambiGray } from '../../components/app/Text';
import ContactsList from '../../components/lists/contacts/ContactsList';
import { TUser, TUsers } from '../../types/types';
import { FlashList } from '@shopify/flash-list';
import { IconApp } from '../../components/app/IconApp';
import { remote_host } from '../../../GlobalVariables';

const NewGroup = () => {

    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const contacts = useAppSelector(state => state.contacts);
    const contacts_selected = useAppSelector(state => state.app.contacts_selected);
    const [profile, setProfile] = useState<string>("");
    const [loading_profile, setLoading_profile] = useState<boolean>(false);
    const [group_description, setGroup_description] = useState<string>("");
    const [members, setMembers] = useState<TUsers>([]);
    const [memberss, setMemberss] = useState([])
    const [group_name, setGroup_name] = useState<string>("");
    const [select_contactss, setSelect_contactss] = useState<boolean>(false);
    const navigation = useNavigation();

    const upload_profile_picture = () => {

        dispatch(setLoadingButton(true));

        let base_url = remote_host + "/yambi/API/upload_profile_picture";
        let formData = new FormData();
        formData.append('assemble', user_data.phone_number);
        formData.append('group_name', group_name);
        formData.append('group_description', group_description);
        formData.append('members', members as any);
        // formData.append('group_icon', user_data.user_profile);
        formData.append('image', { type: 'image/jpg', uri: profile, name: 'profile.jpg' } as any);

        axios.post(base_url, formData, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(response => {
                // dispatch(setLoadingButton(false));

                // if (response.data.message === "1" && response.data.assemble === user_data.phone_number) {
                //     dispatch(updateUserProfile(response.data.user_profile));
                // }

            })
            .catch((error) => {
                // Alert.alert(strings.error, strings.connection_failed);
                console.log(error)
                dispatch(setLoadingButton(false));
            });
    };

    const pick_profile = () => {

        ImagePicker.openPicker({
            width: 500,
            height: 500,
            cropping: true,
            quality: 0.5,
            noData: true,
            mediaType: "photo",
        }).then(image => {

            setProfile(image.path);
        })
            .catch((e) => { });
    }

    const createGroup = () => {
        if (members.length === 0) {
            setSelect_contactss(true);
        } else {

        }

        // alert(members.length)
    }

    const selectCon = (contact: TUser) => {
        // let mm = members;

        // mm.push(contact);
        // console.log(contact)


        // setMembers([...members, contact]);
        // setMembers(mm)
        console.log(contacts_selected);

        // setTimeout(()=> {
        //     console.log(members.length)
        // }, 1000);

        dispatch(setContactsSelected(contact));


    };

    const removeCon = useCallback((contact: TUser) => {
        console.log(contact);
    }, []);

    // useEffect(()=> {
    //     // return ()=> {
    //     //     dispatch(setContactsSelected([]))
    //     // };
    // },[contacts_selected]);

    return (
        <SafeAreaView style={{ backgroundColor: theme.colors.background, flex: 1, paddingTop: 5, borderColor: theme.colors.border, borderTopWidth: 1 }}>

            <StatusBarYambi />

            <TextNormalYambi bold={true} text={strings.group_overview} styles={{ marginBottom: 15, paddingLeft: 15 }} />

            <View style={{
                flex: 1,
                flexDirection: 'row',
                paddingHorizontal: 15
            }}>
                <Pressable
                    onPress={pick_profile}
                    style={{
                        borderRadius: 15,
                        height: 60,
                        width: 60,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    {profile !== "" ?
                        <Image
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 15,
                                borderColor: theme.colors.border,
                                borderWidth: 1
                            }}
                            source={{ uri: profile }} />
                        :
                        <IconApp pack='FA6' name='people-group' color={theme.colors.text} size={30} />}
                </Pressable>

                <View style={{
                    flex: 1,
                    minHeight: 180,
                    marginLeft: 15
                }}>
                    <TextInput
                        value={group_name}
                        placeholder={strings.group_name}
                        onChangeText={text => setGroup_name(text)}
                        placeholderTextColor={theme.colors.gray}
                        style={{
                            borderColor: theme.colors.gray,
                            color: theme.colors.text,
                            height: 35,
                            borderRadius: 5,
                            paddingLeft: 10,
                            backgroundColor: theme.colors.border
                        }}
                    />

                    <View style={{
                        borderColor: theme.colors.gray,
                        marginTop: 15,
                        paddingVertical: 10,
                        borderRadius: 5,
                        paddingLeft: 10,
                        height: 120,
                        maxHeight: 200,
                        backgroundColor: theme.colors.border
                    }}>
                        <TextInput
                            value={group_description}
                            placeholderTextColor={theme.colors.gray}
                            placeholder={strings.group_details}
                            onChangeText={text => setGroup_description(text)}
                            multiline={true}
                            style={{
                                backgroundColor: 'transparent',
                                color: theme.colors.text,
                            }}
                        />
                    </View>
                </View>
            </View>

            <Modal
                onRequestClose={() => setSelect_contactss(false)}
                animationType="fade"
                statusBarTranslucent={true}
                visible={select_contactss}
                transparent={true}>
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)'
                }}>
                    <View style={{
                        flex: 1,
                        backgroundColor: theme.colors.background,
                        marginHorizontal: 15,
                        marginVertical: 25,
                        marginTop: 40,
                        borderRadius: 10,
                        paddingTop: 10
                    }}>
                        <Text>{contacts_selected.length}</Text>
                        {members.length > 0 ?
                            <View style={{
                                height: 115,
                            }}>
                                <TextNormalYambiGray bold={true} text={strings.contacts_selected} styles={{ paddingLeft: 10, marginVertical: 0 }} />
                                <View style={{
                                    height: 95,
                                    borderBottomWidth: 1,
                                    borderColor: theme.colors.border
                                }}>
                                    <FlashList
                                        horizontal
                                        data={contacts_selected as any}
                                        estimatedItemSize={500}
                                        renderItem={({ item, index }: { item: TUser, index: number }) => (
                                            <ContactsList
                                                item={item}
                                                index={index}
                                                type={2}
                                                selectContact={removeCon}
                                            />)}
                                        contentContainerStyle={{
                                            paddingHorizontal: 10,
                                            backgroundColor: theme.colors.background,
                                        }}
                                    />
                                </View>
                            </View> : null}

                        <TextNormalYambiGray bold={true} text={strings.group_members_select} styles={{ marginLeft: 10, marginVertical: 10, marginBottom: 0 }} />

                        <View style={{
                            flex: 1
                        }}>
                            {/* <FlashList
                                data={contacts as any}
                                estimatedItemSize={500}
                                renderItem={({ item, index }: { item: TUser, index: number }) => (
                                    <ContactsList
                                        item={item}
                                        index={index}
                                        type={1}
                                        selectContact={selectCon}
                                    />)}
                                contentContainerStyle={{
                                    backgroundColor: theme.colors.background,
                                }}
                            /> */}
                        </View>

                        <ButtonNormal
                            title={strings.continue}
                            loadEnabled={true}
                            normal={true}
                            outline={false}
                            styles={{ marginBottom: 10, marginHorizontal: 30 }}
                            onPress={() => setSelect_contactss(false)} />
                    </View>
                </View>
            </Modal>

            <ButtonNormal
                title={strings.contacts_select}
                loadEnabled={true}
                normal={true}
                outline={false}
                styles={{ marginBottom: 10, marginHorizontal: 30 }}
                onPress={(createGroup)} />

        </SafeAreaView>
    )
}

export default NewGroup;

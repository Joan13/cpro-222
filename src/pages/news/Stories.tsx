import { Text, Pressable, View, Image } from "react-native";
import { useEffect, useState } from 'react';
import { NavProps } from "../../types/types";
import { strings } from "../../lang/lang";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { useQuery, useRealm } from "@realm/react";
import { Stories, UserBusinesses, UserContacts } from "../../store/database/Models";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import StoriesList from "../../components/lists/stories/StoriesList";
import { renderDateTime, media_url, SocketApp } from "../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';
import { IconApp } from "../../components/app/IconApp";

const StoriesComponent = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const [userStories, setUserStories] = useState([]);
    const realm = useRealm();

    const stories = useQuery(Stories, sts => {
        return sts.filtered('phone_number != $0', user_data.phone_number).sorted('createdAt', true);
    }, []);

    const my_stories = useQuery(Stories, sts => {
        return sts.filtered('phone_number == $0', user_data.phone_number).sorted('createdAt', true);
    }, []);

    const contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0)
                .sorted('user_names', false);
        }, []);

    const collectStories = () => {
        const assembledStories = [];

        for (let p in contacts) {
            let userStories = [];
            for (let i in stories) {
                if (stories[i].phone_number === contacts[p].phone_number) {
                    userStories.push(stories[i]);
                }
            }

            if (userStories.length !== 0) {
                const storyObject = {
                    user: contacts[p],
                    stories: userStories,
                    lastDate: userStories[0].createdAt
                }

                assembledStories.push(storyObject);
            }
        }

        setUserStories(assembledStories);
    }

    useEffect(() => {
        collectStories();
    }, [stories, contacts]);

    useEffect(() => {
        const contactPhoneNumbers = contacts.map(c => ({ phone_number: c.phone_number }));
        SocketApp.emit('OnCheckStoriesUpdates', {
            phone_number: user_data.phone_number,
            phone_numbers: JSON.stringify(contactPhoneNumbers)
        });

        const handleMyStories = (mySts: any) => {
            if (Array.isArray(mySts)) {
                realm.write(() => {
                    mySts.forEach((st: any) => {
                        try {
                            realm.create('Stories', st, true);
                        } catch (e) { }
                    });
                });
            }
        };

        const handleOtherStories = (otherSts: any) => {
            if (Array.isArray(otherSts)) {
                realm.write(() => {
                    otherSts.forEach((st: any) => {
                        try {
                            realm.create('Stories', st, true);
                        } catch (e) { }
                    });
                });
            }
        };

        SocketApp.on('MyStories', handleMyStories);
        SocketApp.on('Stories', handleOtherStories);

        return () => {
            SocketApp.off('MyStories', handleMyStories);
            SocketApp.off('Stories', handleOtherStories);
        };
    }, [contacts, user_data.phone_number, realm]);

    const businesses = useQuery(UserBusinesses);
    const dispatch = useAppDispatch();

    const GoStory = (phone_number: string) => {
        navigation.navigate("UserStories", { phone_number: phone_number });
    }

    const UserStoryComponent = () => {
        return (
            <View
                style={{
                    marginVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: theme.card || theme.background,
                    padding: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.border
                }}>
                <Pressable
                    onPress={() => my_stories.length > 0 ? GoStory(user_data.phone_number) : navigation.navigate("NewStory", { flag: 1 })}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1
                    }}>
                    <View style={{
                        borderColor: my_stories.length > 0 ? theme.high_color : theme.border,
                        borderWidth: 2,
                        borderRadius: 50,
                        padding: 2,
                        height: 52,
                        width: 52,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        {user_data.user_profile === "" ? (
                            <Image
                                source={require('./../../assets/profile_black.jpg')}
                                style={{ width: 44, height: 44, borderRadius: 50, borderWidth: 1, borderColor: theme.border }}
                            />
                        ) : (
                            <ExpoImage
                                style={{ height: 44, width: 44, borderRadius: 50 }}
                                contentFit="cover"
                                source={media_url + "/profile_pictures/" + user_data.user_profile}
                            />
                        )}
                        {my_stories.length !== 0 && (
                            <View style={{
                                backgroundColor: theme.badge_background_color || theme.high_color,
                                height: 18,
                                minWidth: 18,
                                paddingHorizontal: 4,
                                borderRadius: 10,
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'absolute',
                                top: -2,
                                right: -2
                            }}>
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' }}>{my_stories.length}</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <TextNormalYambi text={my_stories.length > 1 ? strings.my_stories : strings.my_story} numberLines={1} bold />
                        <TextSmallYambiGray
                            text={my_stories.length !== 0 ? renderDateTime(my_stories[0].createdAt, 1, false) : strings.tap_to_add_status}
                        />
                    </View>
                </Pressable>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                        onPress={() => navigation.navigate("NewStory", { flag: 0 })}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: theme.button_background_color || theme.high_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: 8
                        }}>
                        <IconApp pack="FI" name="edit-3" size={17} color="#FFFFFF" />
                    </Pressable>
                    <Pressable
                        onPress={() => navigation.navigate("NewStory", { flag: 1 })}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: theme.button_background_color || theme.high_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginLeft: 8
                        }}>
                        <IconApp pack="FI" name="camera" size={17} color="#FFFFFF" />
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <View style={{
            flex: 1,
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            {showInfo ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInfo(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.impossible_edit} />
                </ModalApp> : null}

            <FlashList
                data={userStories as never}
                estimatedItemSize={1500}
                ListHeaderComponent={
                    <View>
                        <UserStoryComponent />
                        {stories.length === 0 && (
                            <View style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingVertical: 40,
                            }}>
                                <Image
                                    source={require("./../../assets/fairytale.png")}
                                    style={{
                                        width: 100,
                                        height: 100
                                    }}
                                />

                                <TextSmallYambiGray
                                    text={strings.no_stories_text}
                                    styles={{
                                        margin: 20,
                                        marginTop: 16,
                                        marginBottom: 20,
                                        color: theme.gray,
                                        textAlign: 'center'
                                    }}
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Pressable
                                        onPress={() => navigation.navigate("NewStory", { flag: 0 })}
                                        style={{
                                            backgroundColor: theme.button_background_color || theme.high_color,
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderRadius: 22,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 8
                                        }}>
                                        <IconApp pack="FI" name="edit-3" size={16} color={theme.button_foreground_color || "#FFFFFF"} />
                                        <Text style={{
                                            color: theme.button_foreground_color || '#FFFFFF',
                                            fontWeight: 'bold',
                                            fontSize: 13,
                                            marginLeft: 6
                                        }}>
                                            {strings.create_status || "Text Story"}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => navigation.navigate("NewStory", { flag: 1 })}
                                        style={{
                                            backgroundColor: theme.button_background_color || theme.high_color,
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderRadius: 22,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginLeft: 8
                                        }}>
                                        <IconApp pack="FI" name="camera" size={16} color={theme.button_foreground_color || "#FFFFFF"} />
                                        <Text style={{
                                            color: theme.button_foreground_color || '#FFFFFF',
                                            fontWeight: 'bold',
                                            fontSize: 13,
                                            marginLeft: 6
                                        }}>
                                            {strings.send_photo || "Photo Story"}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </View>
                }
                renderItem={({ item, index }: { item: any, index: number }) => (
                    <StoriesList index={index} item={item} GoStory={() => GoStory(item.user.phone_number)} />
                )}
                contentContainerStyle={{
                    paddingHorizontal: 15
                }}
            />
        </View>
    );
}

export default StoriesComponent;



{/* <FlashList
                    data={business_users as never}
                    estimatedItemSize={height}
                    renderItem={({ item, index }: { item: TBusinessUser, index: number }) => (<BusinessUsersList index={index} item={item} type={0} selectContact={SelUser} business_users={business_users as never} />)}
                    contentContainerStyle={{ paddingHorizontal: 15 }} /> */}
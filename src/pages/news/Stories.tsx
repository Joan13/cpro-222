import { Pressable, View, Image, ScrollView } from "react-native";
import { useEffect, useState } from 'react';
import { NavProps } from "../../types/types";
import { strings } from "../../lang/lang";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { useQuery, useRealm } from "@realm/react";
import { Stories, UserBusinesses, UserContacts } from "../../store/database/Models";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { setStatusBadge } from "../../store/reducers/persistedAppSlice";
import { YambiText } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import BottomSheet from "../../components/app/BottomSheet";
import { FlashList } from "@shopify/flash-list";
import StoriesList from "../../components/lists/stories/StoriesList";
import { renderDateTime, media_url, SocketApp } from "../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';
import { IconApp } from "../../components/app/IconApp";
import { cleanExpiredLocalStories, isStoryExpired } from "../../utils/storyCleanup";
import LottieView from 'lottie-react-native';

const StoriesComponent = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const [userStories, setUserStories] = useState([]);
    const realm = useRealm();

    const stories = useQuery(Stories, sts => {
        return sts.filtered('phone_number != $0', user_data.phone_number).sorted('createdAt', false);
    }, []);

    const my_stories = useQuery(Stories, sts => {
        return sts.filtered('phone_number == $0', user_data.phone_number).sorted('createdAt', false);
    }, []);

    const contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0)
                .sorted('user_names', false);
        }, []);

    const active_my_stories = my_stories.filter(st => !isStoryExpired(st));

    const collectStories = () => {
        cleanExpiredLocalStories(realm);
        const assembledStories = [];
        let unseenCount = 0;

        for (let p in contacts) {
            let userStoriesList = [];
            for (let i in stories) {
                const st = stories[i];
                if (st.phone_number === contacts[p].phone_number && !isStoryExpired(st)) {
                    userStoriesList.push(st);
                }
            }

            if (userStoriesList.length !== 0) {
                const storyObject = {
                    user: contacts[p],
                    stories: userStoriesList,
                    lastDate: userStoriesList[userStoriesList.length - 1].createdAt
                };

                assembledStories.push(storyObject);

                const hasUnseen = userStoriesList.some(st => {
                    let viewersList: string[] = [];
                    try {
                        viewersList = JSON.parse(st.viewers || '[]');
                    } catch (e) { }
                    return !viewersList.includes(user_data.phone_number);
                });

                if (hasUnseen) {
                    unseenCount++;
                }
            }
        }

        setUserStories(assembledStories);
        dispatch(setStatusBadge(unseenCount));
    };

    useEffect(() => {
        cleanExpiredLocalStories(realm);
        collectStories();
    }, [stories, contacts]);

    useEffect(() => {
        cleanExpiredLocalStories(realm);
        const contactPhoneNumbers = contacts.map(c => c.phone_number);
        const myActiveLocalStories = active_my_stories.map(s => ({
            _id: s._id,
            viewers: s.viewers,
            updatedAt: s.updatedAt
        }));
        const otherActiveLocalStories = stories.map(s => ({
            _id: s._id,
            viewers: s.viewers,
            updatedAt: s.updatedAt
        }));

        SocketApp.emit('OnCheckStoriesUpdates', {
            phone_number: user_data.phone_number,
            phone_numbers: JSON.stringify(contactPhoneNumbers),
            my_local_stories: JSON.stringify(myActiveLocalStories),
            other_local_stories: JSON.stringify(otherActiveLocalStories)
        });

        const handleMyStories = (mySts: any) => {
            if (Array.isArray(mySts)) {
                realm.write(() => {
                    mySts.forEach((st: any) => {
                        if (!isStoryExpired(st)) {
                            try {
                                realm.create('Stories', st, true);
                            } catch (e) { }
                        }
                    });
                });
                cleanExpiredLocalStories(realm);
            }
        };

        const handleOtherStories = (otherSts: any) => {
            if (Array.isArray(otherSts)) {
                realm.write(() => {
                    otherSts.forEach((st: any) => {
                        if (!isStoryExpired(st)) {
                            try {
                                realm.create('Stories', st, true);
                            } catch (e) { }
                        }
                    });
                });
                cleanExpiredLocalStories(realm);
            }
        };

        const handleStatusViewed = (data: any) => {
            if (data && data.story_id && data.viewers) {
                realm.write(() => {
                    try {
                        const realmStory = realm.objectForPrimaryKey<Stories>('Stories', data.story_id);
                        if (realmStory) {
                            realmStory.viewers = data.viewers;
                        }
                    } catch (e) { }
                });
            }
        };

        SocketApp.on('MyStories', handleMyStories);
        SocketApp.on('Stories', handleOtherStories);
        SocketApp.on('StatusViewed', handleStatusViewed);

        return () => {
            SocketApp.off('MyStories', handleMyStories);
            SocketApp.off('Stories', handleOtherStories);
            SocketApp.off('StatusViewed', handleStatusViewed);
        };
    }, [contacts, user_data.phone_number, realm]);

    const businesses = useQuery(UserBusinesses);
    const dispatch = useAppDispatch();

    useEffect(() => {
        navigation.setOptions({
            title: strings.status || "Status"
        });
    }, [navigation]);

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
                    onPress={() => active_my_stories.length > 0 ? GoStory(user_data.phone_number) : navigation.navigate("NewStory", { flag: 1 })}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1
                    }}>
                    <View style={{
                        borderColor: active_my_stories.length > 0 ? theme.high_color : theme.border,
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
                        {active_my_stories.length !== 0 && (
                            <View style={{
                                backgroundColor: theme.button_background_color,
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
                                <YambiText text={String(active_my_stories.length)} size="xsmall" color="button_foreground_color" />
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <YambiText text={strings.my_status || "My status"} bold numberLines={1} style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }} />
                        <YambiText
                            text={active_my_stories.length !== 0 ? renderDateTime(active_my_stories[active_my_stories.length - 1].createdAt, 1, false) : strings.tap_to_add_status}
                            style={{ fontSize: 13, color: theme.gray, marginTop: 2 }}
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
                        <IconApp pack="FI" name="edit-3" size={17} color={theme.button_foreground_color} />
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
                        <IconApp pack="FI" name="camera" size={17} color={theme.button_foreground_color} />
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
                    <YambiText text={strings.impossible_edit} style={{ fontSize: 14, color: theme.gray }} />
                </ModalApp> : null}

            <FlashList
                data={userStories as never}
                estimatedItemSize={1500}
                ListHeaderComponent={
                    <View>
                        <UserStoryComponent />
                        {userStories.length === 0 && (
                            <View style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingVertical: 40,
                                width: '100%'
                            }}>
                                <LottieView
                                    source={require("./../../assets/status.json")}
                                    autoPlay
                                    loop={false}
                                    colorFilters={[
                                        {
                                            keypath: "**",
                                            color: theme.high_color
                                        }
                                    ]}
                                    style={{
                                        width: 250,
                                        height: 250,
                                        marginBottom: 12
                                    }}
                                />

                                <YambiText
                                    text={strings.no_stories_text}
                                    style={{
                                        marginHorizontal: 30,
                                        marginTop: 8,
                                        color: theme.gray,
                                        textAlign: 'center',
                                        fontSize: 14
                                    }}
                                />
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
import { Text, Pressable, View, Image } from "react-native";
import { useEffect, useState } from 'react';
import { NavProps } from "../../types/types";
import { strings } from "../../lang/lang";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { useQuery } from "@realm/react";
import { Stories, UserBusinesses, UserContacts } from "../../store/database/Models";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
import StoriesList from "../../components/lists/stories/StoriesList";
import { renderDateTime, media_url } from "../../../GlobalVariables";
import { Image as ExpoImage } from 'expo-image';

const StoriesComponent = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme.colors);
    // const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    // const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const business_opened = useAppSelector(state => state.app.business_opened);
    // const [showEnterCurrentPassword, setShowEnterCurrentPassword] = useState<boolean>(false);
    // const [showSuccessPasswordEntered, setShowSuccessPasswordEntered] = useState<boolean>(false);
    // const title = useAppSelector(state => state.app.title);
    // const businesses = useAppSelector(state => state.businesses);
    // const businesses = [];
    // const height = useWindowDimensions().height;
    const [userStories, setUserStories] = useState([]);

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

        // setTimeout(()=> {
        //     console.log(userStories)
        // }, 100);
    }, [stories, contacts]);

    // const businesses = useQuery(
    //     UserBusinesses, business => {
    //         return business.filtered('phone_number == $0', user_data.phone_number)
    //     }, []);

    const businesses = useQuery(UserBusinesses);

    const dispatch = useAppDispatch();

    const GoStory = (phone_number: string) => {
        navigation.navigate("UserStories", { phone_number: phone_number });
    }

    const UserStoryComponent = () => {
        return (
            <Pressable
                onPress={() => GoStory(user_data.phone_number)}
                style={{
                    marginVertical: 15,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        // justifyContent: 'center',
                        // marginVertical: 15,
                        // backgroundColor:'gray'
                    }}>
                    <View style={{
                        borderColor: theme.high_color,
                        borderWidth: 2,
                        borderRadius: 50,
                        padding: 2,
                        height: 48
                    }}>
                        {user_data.user_profile === "" ? <Image
                            source={require('./../../assets/profile_black.jpg')}
                            style={{ width: 40, height: 40, borderRadius: 50, borderWidth: 1, borderColor: theme.border }}
                        />
                            :
                            <ExpoImage
                                style={{
                                    height: 40,
                                    width: 40,
                                    borderRadius: 50
                                }}
                                contentFit="cover"
                                source={
                                    media_url + "/profile_pictures/" + user_data.user_profile
                                } />}
                        <View style={{
                            backgroundColor: theme.badge_background_color,
                            height: 20,
                            minWidth: 20,
                            paddingHorizontal: 3,
                            borderRadius: 15,
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            top: -5
                        }}>
                            <Text style={{
                                fontSize: 16,
                                color: theme.badge_color
                            }}>{my_stories.length}</Text>
                        </View>
                    </View>
                    <View style={{
                        flex: 1,
                        marginLeft: 15
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextNormalYambi text={my_stories.length > 1 ? strings.my_stories : strings.my_story} numberLines={1} />
                        </View>
                        {my_stories.length !== 0 ? <TextSmallYambiGray text={renderDateTime(my_stories[0].createdAt, 1, false)} /> : null}
                    </View>
                </View>
                {/* <FlashList
                data={item.stories as never}
                estimatedItemSize={500}
                onViewableItemsChanged={({ viewableItems }) => {
                    // console.log('Items visibles:', viewableItems);
                }}
                renderItem={({ item, index }: { item: TStory, index: number }) => (
                    <StoryMainItem
                        index={index}
                        item={item} />)}
                contentContainerStyle={{
                    // paddingHorizontal: 15
                }}
            /> */}
            </Pressable>
        )
    }

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            {showInfo ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInfo(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.impossible_edit} />
                </ModalApp> : null}

            {stories.length === 0 ?
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1
                }}>
                    <Image
                        source={require("./../../assets/fairytale.png")}
                        style={{
                            // width: 300,
                            // height: 190
                            width: 100,
                            height: 100
                        }} />

                    <TextSmallYambiGray text={strings.no_stories_text} styles={{
                        margin: 40,
                        marginTop: 20,
                        marginBottom: 20,
                        color: theme.gray,
                        textAlign: 'center'
                    }} />

                    {/* <ButtonNormal title={strings.new_business} loadEnabled={false} onPress={NewBusiness} styles={{ paddingHorizontal: 20 }} normal={true} /> */}
                </View>
                :
                <FlashList
                    data={userStories as never}
                    estimatedItemSize={1500}
                    ListHeaderComponent={<UserStoryComponent />}
                    // pagingEnabled
                    renderItem={({ item, index }: { item: any, index: number }) => (<StoriesList index={index} item={item} GoStory={() => GoStory(item.user.phone_number)} />)}
                    contentContainerStyle={{
                        paddingHorizontal: 15
                    }}
                />
            }
        </View>
    )
}

export default StoriesComponent;



{/* <FlashList
                    data={business_users as never}
                    estimatedItemSize={height}
                    renderItem={({ item, index }: { item: TBusinessUser, index: number }) => (<BusinessUsersList index={index} item={item} type={0} selectContact={SelUser} business_users={business_users as never} />)}
                    contentContainerStyle={{ paddingHorizontal: 15 }} /> */}
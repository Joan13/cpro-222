import { ActivityIndicator, FlatList, SafeAreaView, Text, TouchableOpacity, View, Alert, Image, useWindowDimensions, TextInput } from "react-native";
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from 'react';
import { NavProps, TBusiness, TBusinessUser, TSellsPoint, TStory } from "../../types/types";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { IconApp } from "../../components/app/IconApp";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import * as RootNavigation from '../../services/Navigation_ref';
import { useQuery } from "@realm/react";
import { BusinessUsers, Stories, UserBusinesses, UserContacts } from "../../store/database/Models";
import { setBusinessOpened, setShowModalApp } from "../../store/reducers/appSlice";
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { FlashList } from "@shopify/flash-list";
// import { app_theme } from "../../store/app/variables";
import Animated, { FadeIn } from "react-native-reanimated";
import StoriesList from "../../components/lists/stories/StoriesList";
import UserStoriesItem from "../../components/lists/stories/UserStories";
import StoryMainItem from "../../components/lists/stories/StoryMainItem";

const UserStories = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme.colors);
    const loading_app = useAppSelector(state => state.app.loading);
    const user_data = useAppSelector(state => state.user_data);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    // const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const business_opened = useAppSelector(state => state.app.business_opened);
    // const [showEnterCurrentPassword, setShowEnterCurrentPassword] = useState<boolean>(false);
    // const [showSuccessPasswordEntered, setShowSuccessPasswordEntered] = useState<boolean>(false);
    const title = useAppSelector(state => state.app.title);
    const { phone_number } = route.params;
    // const businesses = useAppSelector(state => state.businesses);
    // const businesses = [];
    // const height = useWindowDimensions().height;
    const [userStories, setUserStories] = useState([]);
    const contactss = useAppSelector(state => state.app.raw_contacts);

    const ShowUserName = (user_names: string, phone_number: string) => {
        const contact = contactss.find((cc) => cc.phoneNumber === phone_number);
        if (contact !== undefined) {
            return contact.displayName;
        } else {
            return user_names;
        }
    }

    const stories = useQuery(Stories, sts => {
        return sts.filtered('phone_number == $0', phone_number).sorted('createdAt', true);
    }, []);

    const contacts = useQuery(
        UserContacts, ccs => {
            return ccs.filtered('phone_number != $0 && user_active != $1', user_data.phone_number, 0)
                .sorted('user_names', false);
        }, []);

    // const businesses = useQuery(
    //     UserBusinesses, business => {
    //         return business.filtered('phone_number == $0', user_data.phone_number)
    //     }, []);

    const businesses = useQuery(UserBusinesses);

    const dispatch = useAppDispatch();

    const GoStory = () => {

    }

    useEffect(() => {

        let ss = phone_number !== user_data.phone_number ? strings.stories : strings.my_stories;
        if (stories.length < 2) {
            ss = phone_number !== user_data.phone_number ? strings.story : strings.my_story;
        }

        navigation.setOptions({ title: phone_number !== user_data.phone_number ? ShowUserName(phone_number, phone_number) + "'s" + " " + ss.toLowerCase() : ss });
    }, []);

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderTopWidth: 1
        }}>
            {/* {showInfo ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInfo(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.impossible_edit} />
                </ModalApp> : null} */}

            {/* {stories.length !== 0 ?
                <View style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1
                }}>
                    <Image
                        source={require("./../../assets/budget.png")}
                        style={{
                            width: 100,
                            height: 100
                        }} />

                    <TextSmallYambiGray text={strings.no_workspace} styles={{
                        margin: 40,
                        marginTop: 20,
                        marginBottom: 20,
                        color: theme.gray,
                        textAlign: 'center'
                    }} />
                </View> */}

            <FlashList
                data={stories as never}
                estimatedItemSize={500}
                renderItem={({ item, index }: { item: TStory, index: number }) => (
                    <StoryMainItem
                        index={index}
                        item={item}
                    // GoStory={GoStory} 
                    />)}
                contentContainerStyle={{
                    paddingLeft: 5,
                    paddingRight: 8
                }}
            />


        </View>
    )
}

export default UserStories;



{/* <FlashList
                    data={business_users as never}
                    estimatedItemSize={height}
                    renderItem={({ item, index }: { item: TBusinessUser, index: number }) => (<BusinessUsersList index={index} item={item} type={0} selectContact={SelUser} business_users={business_users as never} />)}
                    contentContainerStyle={{ paddingHorizontal: 15 }} /> */}
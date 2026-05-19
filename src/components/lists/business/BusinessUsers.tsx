import { TouchableOpacity, View, Image, Pressable } from "react-native";
import { TBusinessUser } from "../../../types/types";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useState } from 'react';
import Animated from "react-native-reanimated";
import { TextNormalYambi, TextNormalYambiGray, TextNormalYambiHighColor, TextSmallYambiHighColor } from "../../app/Text";
import * as RootNavigation from './../../../services/Navigation_ref';
import { IconApp } from "../../app/IconApp";
import { remote_host_server, renderBusinessUserLevel, media_url } from "../../../../GlobalVariables";
import ModalApp from "../../app/ModalApp";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { strings } from "../../../lang/lang";
import { useObject, useQuery } from "@realm/react";
import { BusinessUsers, UserContacts, UserData } from "../../../store/database/Models";
import FastImage from "react-native-fast-image";

const BusinessUsersList = ({ item, index, show_level, selectContact }: { item: TBusinessUser, index: number, show_level: boolean, selectContact }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const [showUserError, setShowUserError] = useState(false);
    const mmm = useObject(item.user !== user_data.phone_number ? UserContacts : UserData, item.user);
    const dispatch = useAppDispatch();

    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0 && business_id == $1 && user_active != $2', user_data.phone_number, item.business_id, 2);
        }, []);

    const oo = uuser.find(element => element.user === user_data.phone_number);

    const conditionGoUsers = () => {
        if (oo !== null && oo !== undefined) {
            if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2)) {
                return true;
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        } else {
            dispatch(setShowModalApp(true));
            setShowUserError(true);
        }

        return false;
    }

    const conditionEditUser = (ll: number) => {
        // console.log(oo)
        if (oo !== null && oo !== undefined) {
            if (oo.user_active === 1 && oo.level <= ll) {
                if ((oo.user_active === 1 && oo.level === 1) || (oo.user_active === 1 && oo.level === 2)) {
                    return true;
                } else {
                    dispatch(setShowModalApp(true));
                    setShowUserError(true);
                }
            } else {
                dispatch(setShowModalApp(true));
                setShowUserError(true);
            }
        } else {
            dispatch(setShowModalApp(true));
            setShowUserError(true);
        }

        return false;
    }

    // if(item.user!==user_data.phone_number){
    //     console.log(user_data)
    // }
    // const businesses = useQuery(
    //     UserBusinesses, business => {
    //         return business.filtered('_id == $0', item.business_id)
    //     }, []);

    // Type 0 : NewChat
    // Type 1 : NewGroup
    // Type 2 : Contact selected

    // const show_information = () => {
    //     if (item.status_information !== "") {
    //         if (type === 0) {
    //             return true;
    //         }

    //         return false;
    //     }

    //     return false;
    // }

    // const show_type = () => {
    //     if (type === 2) {
    //         return 2;
    //     }

    //     if (type === 0 || type === 3) {
    //         return 0;
    //     }

    //     return 0;
    // }

    // console.log('item displayed');
    // if (show_type() === 2) {
    //     return (
    //         <View
    //             style={{
    //                 flexDirection: 'row',
    //                 alignItems: 'flex-start',
    //                 marginVertical: 12,
    //                 width: 65
    //             }}>
    //             <View style={{
    //                 alignItems: 'center'
    //             }}>
    //                 <Image
    //                     // sharedTransitionTag={`${item.phone_number}-image`}
    //                     style={{
    //                         width: 45,
    //                         height: 45,
    //                         borderRadius: 60
    //                     }}
    //                     source={require("./../../assets/profile_black.jpg")} />

    //                 <TextSmallYambi
    //                     numberLines={2}
    //                     styles={{
    //                         textAlign: 'center'
    //                     }}
    //                     text={item.user_names} />
    //             </View>
    //             <TouchableOpacity
    //                 onPress={() => selectContact(item)}
    //                 style={{
    //                     width: 20,
    //                     height: 20,
    //                     backgroundColor: app_theme.colors.background,
    //                     marginLeft: -15,
    //                     justifyContent: 'center',
    //                     alignItems: 'center',
    //                     borderRadius: 5,
    //                     borderWidth: 1,
    //                     borderColor: app_theme.colors.border
    //                 }}>
    //                 <Feather
    //                     color={app_theme.colors.text}
    //                     name="x"
    //                     size={13} />
    //             </TouchableOpacity>
    //         </View>
    //     )
    // }

    // if (show_type() === 0) {

    const ViewPhoto = () => {
        if (mmm) {
            if (mmm.user_profile !== "") {
                RootNavigation.navigate("ViewPhoto", { source: media_url + "/profile_pictures/" + mmm.user_profile })
            } else {
                RootNavigation.navigate("ViewPhoto", { source: "" })
            }
        }
    }

    return (
        <View>

            {showUserError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowUserError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.business_level_error} />
                </ModalApp> : null}

            <TouchableOpacity
                onPress={() => {
                    selectContact(item);
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 6,
                    // marginHorizontal: 0,
                    padding: 12,
                    backgroundColor: app_theme.colors.background,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: app_theme.colors.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    // elevation: 2,
                }}>
                <Pressable onPress={ViewPhoto} style={{ position: 'relative' }}>
                    {mmm ?
                        mmm.user_profile === "" ?
                            <View style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                borderWidth: 2,
                                borderColor: app_theme.colors.border,
                                overflow: 'hidden',
                            }}>
                                <Image
                                    source={require('./../../../assets/profile_black.jpg')}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </View>
                            :
                            <View style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                borderWidth: 2,
                                borderColor: app_theme.colors.high_color + '30',
                                overflow: 'hidden',
                            }}>
                                <FastImage
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                    }}
                                    resizeMode={FastImage.resizeMode.cover}
                                    source={{
                                        priority: FastImage.priority.high,
                                        cache: 'immutable',
                                        uri: media_url + "/profile_pictures/" + mmm.user_profile
                                    }} />
                            </View>
                        : 
                            <View style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                borderWidth: 2,
                                borderColor: app_theme.colors.border,
                                overflow: 'hidden',
                            }}>
                                <Image
                                    source={require('./../../../assets/profile_black.jpg')}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </View>
                    }

                    {item.user_active === 1 && (
                        <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: app_theme.colors.high_color2,
                            borderWidth: 2,
                            borderColor: app_theme.colors.background,
                        }} />
                    )}

                </Pressable>
                <View style={{
                    flex: 1,
                    marginLeft: 12
                }}>
                    <TextNormalYambi numberLines={1} bold text={item.user_name} styles={{ fontSize: 15, marginBottom: 2 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <IconApp pack="FI" name="phone" size={11} color={app_theme.colors.gray} />
                        <TextNormalYambiGray numberLines={1} text={item.user} styles={{ marginLeft: 4, fontSize: 13 }} />
                    </View>
                    {show_level && (
                        <View style={{
                            backgroundColor: app_theme.colors.high_color + '20',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 10,
                            alignSelf: 'flex-start',
                        }}>
                            <TextSmallYambiHighColor 
                                numberLines={1} 
                                text={renderBusinessUserLevel(item.level)} 
                                styles={{ fontSize: 11, fontWeight: '600' }} 
                            />
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => {
                        if (conditionEditUser(item.level)) {
                            RootNavigation.navigate("EditBusinessUser", { business_id: item.business_id, sales_point_id: item.sales_point_id, user: item })
                        }
                    }}
                    style={{
                        width: 35,
                        height: 35,
                        backgroundColor: app_theme.colors.high_color + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 18,
                    }}>
                    <IconApp color={app_theme.colors.high_color} name="edit" pack="FI" size={16} />
                </TouchableOpacity>
            </TouchableOpacity>

            {/* <View style={{ borderColor: app_theme.colors.border, borderTopWidth: 1 }}>
                <FlashList
                    data={businesses as never}
                    estimatedItemSize={500}
                    renderItem={({ item, index }: { item: TBusiness, index: number }) => (<BusinessesList index={index} item={item} business_users={business_users} />)} />
            </View> */}
        </View>
    )
};

export default memo(BusinessUsersList);


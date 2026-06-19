import { View, ScrollView } from "react-native";
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import { TextBigYambi, TextNormalYambi } from "../../components/app/Text";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { NavProps, TBusinessUser, TSellsPoint, TUser } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import { BusinessUsers, UserBusinesses, UserContacts, UserSellsPoints } from "../../store/database/Models";
import { FlashList } from "@shopify/flash-list";
import SellsPointsList from "../../components/lists/business/SellsPointsList";
import BusinessUsersList from "../../components/lists/business/BusinessUsers";

const UserBusinessUsers = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [phone_number, setPhone_number] = useState<string>("");
    const [user_name, setUser_name] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [showUsers, setShowUsers] = useState(false);
    const [level, setLevel] = useState(1);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const business = useObject(UserBusinesses, business_id);

    if(business===null)return;
    // const sales_point = useObject(UserSellsPoints, sales_point_id);
    const contacts = useQuery(UserContacts, contacts => { return contacts; }, []);

    const sells_points = useQuery(
        UserSellsPoints, sells_points => {
            return sells_points.filtered('business_id == $0', business_id)
        }, []);

    const bu = useQuery(
        BusinessUsers, ss => {
            return ss.filtered('business_id == $0 && level==$1 && user_active != $2', business_id, 1, 2);
        }, []);

    const selectCon = (item: TUser) => {
        setPhone_number(item.phone_number);
        setShowModalApp(false);
        setShowUsers(false);
    }

    const CCC = () => {

    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, borderTopWidth: 1,
            paddingHorizontal: 15,
            paddingTop: 15,
            flexGrow: 1,
            minHeight: 100
        }}>
            <View>
                <TextNormalYambi text={strings.business_name} />
                <TextBigYambi bold text={business.business_name} />

                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginVertical: 5,
                    borderBottomWidth: 1,
                    borderColor: theme.border,
                    paddingTop: 8,
                    alignItems: 'center',
                    marginTop: 10,
                    paddingBottom: 5
                }}>
                    <TextNormalYambi numberLines={1} text={strings.owners} />

                    {/* <Pressable
                    onPress={() => navigation.navigate("NewBusinessUser", { sales_point_id: item._id, business_id: business_id })}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    <TextNormalYambiHighColor text={strings.add_user} styles={{ marginRight: 3 }} />
                    <IconApp pack='FI' name='plus' size={20} color={app_theme.colors.high_color} />
                </Pressable> */}
                </View>
                <FlashList
                    data={bu as never}
                    estimatedItemSize={150}
                    renderItem={({ item, index }: { item: TBusinessUser, index: number }) => (<BusinessUsersList index={index} show_level={false} item={item} selectContact={CCC} />)}
                />
            </View>

            <View style={{ marginBottom: 5 }}>
                <TextNormalYambi text={strings.by_point_of_sale} styles={{}} />
                {/* <TextNormalYambi bold text={sales_point.sells_point_name} styles={{}} /> */}
            </View>

            <FlashList
                data={sells_points as never}
                estimatedItemSize={150}
                renderItem={({ item, index }: { item: TSellsPoint, index: number }) => (<SellsPointsList index={index} item={item} show_sell={false} show_users={true} show_edit={true} />)}
            />

            <View style={{ height: 50 }}></View>

        </ScrollView>
    )
}

export default UserBusinessUsers;

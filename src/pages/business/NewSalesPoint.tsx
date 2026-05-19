import { View, ScrollView, TextInput } from "react-native";
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { strings } from "../../lang/lang";
import ButtonNormal from "../../components/app/ButtonNormal";
import { TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray } from "../../components/app/Text";
import ModalApp from "../../components/app/ModalApp";
import { setLoadingButton, setShowModalApp } from "../../store/reducers/appSlice";
import { randomString, remote_host, renderDateUpToMilliseconds } from "../../../GlobalVariables";
import axios from "axios";
import { NavProps, TBusinessSubscription, TSellsPoint } from "../../types/types";
import { useObject, useQuery, useRealm } from "@realm/react";
import { UserBusinesses, UserSellsPoints } from "../../store/database/Models";

const NewSalesPoint = ({ navigation, route }: NavProps) => {

    const { business_id } = route.params;

    const theme = useAppSelector(state => state.app_theme.colors);
    const user_data = useAppSelector(state => state.user_data);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [showError, setShowError] = useState<boolean>(false);
    const [showInternetError, setShowInternetError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [emails, setEmails] = useState<string>("");
    const [phones, setPhones] = useState<string>("");
    const persistedSubscriptions = useAppSelector((state) => state.persisted_app.business_subscriptions || []);
    const dispatch = useAppDispatch();
    const realm = useRealm();

    const business = useObject(UserBusinesses, business_id);
    const sellsPoints = useQuery(
        UserSellsPoints,
        (points) => points.filtered('business_id == $0 && sells_point_active != $1', business_id, 2),
        [business_id]
    );

    useEffect(() => {
        if (business) {
            setName(business.business_name);
        }
    }, [business_id, business]);

    const PLAN_MAX_POINTS_OF_SALE: Record<number, number> = {
        0: 1,   // Free
        1: 2,   // Basic
        2: 5,   // Premium X
        3: 10,  // Ultimate
    };

    const activeSuccessfulLocalSubscription = useMemo(() => {
        const now = new Date();
        return (persistedSubscriptions as TBusinessSubscription[])
            .filter((sub) => {
                if (sub.business_id !== business_id) return false;
                if (Number(sub.payment_status ?? 0) !== 1) return false;
                if (!sub.subscription_end_date) return false;
                const endDate = new Date(sub.subscription_end_date);
                if (Number.isNaN(endDate.getTime())) return false;
                return endDate >= now;
            })
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
    }, [persistedSubscriptions, business_id]);

    const maxPointsOfSale = useMemo(() => {
        const plan = Number(activeSuccessfulLocalSubscription?.subscription_plan ?? 0);
        return PLAN_MAX_POINTS_OF_SALE[plan] ?? PLAN_MAX_POINTS_OF_SALE[0];
    }, [activeSuccessfulLocalSubscription]);

    useEffect(() => {
        const shownPoints = Math.min(sellsPoints.length, maxPointsOfSale);
        navigation.setOptions({
            headerRight: () => (
                <View
                    style={{
                        backgroundColor: theme.border,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        marginRight: 2,
                    }}
                >
                    <TextNormalYambi
                        text={`${shownPoints}/${maxPointsOfSale}`}
                        styles={{ color: sellsPoints.length >= maxPointsOfSale ? theme.error : theme.high_color }}
                    />
                </View>
            ),
        });
    }, [navigation, theme.border, theme.error, theme.high_color, sellsPoints.length, maxPointsOfSale]);


    const NewPointOfSales = () => {
        if (sellsPoints.length >= maxPointsOfSale) {
            navigation.navigate("AddBusinessSubscription", { business_id });
            return;
        }
        if (!business) {
            setShowInternetError(true);
            dispatch(setShowModalApp(true));
            return;
        }
        if (name === "" || address === "") {
            setShowError(true);
            dispatch(setShowModalApp(true));
        } else {
            setLoading(true);
            dispatch(setLoadingButton(true));
            const sellsPointID = randomString(5).toUpperCase() + renderDateUpToMilliseconds();

            const sells_point = {
                _id: sellsPointID,
                business_id: business._id,
                phone_number: user_data.phone_number,
                sells_point_name: name,
                slogan: "",
                description_service: description,
                category: business.category,
                tva: "",
                logo: "",
                phones: emails,
                emails: phones,
                background: "",
                sells_point_active: 0,
                sells_point_address: address,
                sells_point_visible: 0,
                website: "",
                other_links: "",
                yambi: ""
            }

            axios.post(remote_host + "/yambi/API/new_sells_point", { sells_point: sells_point })
                .then(json => {
                    const sp = json.data.new_sells_point;
                    const new_sells_point: TSellsPoint = {
                        _id: sellsPointID,
                        business_id: sp.business_id,
                        sells_point_name: sp.sells_point_name,
                        phone_number: sp.phone_number,
                        slogan: "",
                        description_service: sp.description_service,
                        category: sp.category,
                        country: "",
                        tva: "",
                        logo: "",
                        phones: phones,
                        emails: emails,
                        background: "",
                        notifications: 0,
                        sells_point_active: 0,
                        sells_point_address: sp.sells_point_address,
                        sells_point_visible: 0,
                        website: "",
                        other_links: "",
                        yambi: "",
                        createdAt: sp.createdAt,
                        updatedAt: sp.updatedAt
                    }

                    realm.write(() => {
                        try {
                            realm.create('SellsPoints', new_sells_point, true);
                        } catch { }
                    });

                    setLoading(false);
                    dispatch(setLoadingButton(false));

                    setName("");
                    setDescription("");
                    // setCategory(null);
                    setAddress("");
                    // setDefine_as_main_site(false);

                    setTimeout(() => {
                        navigation.goBack();
                    }, 300);
                })
                .catch(() => {
                    setShowInternetError(true);
                    dispatch(setShowModalApp(true));
                    setLoading(false);
                    dispatch(setLoadingButton(false));
                })
        }
    }

    return (
        <ScrollView style={{
            backgroundColor: theme.background,
            borderColor: theme.border, borderTopWidth: 1,
            paddingHorizontal: 15,
            paddingVertical: 15
        }}>
            {showError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.fields_error_validation} />
                </ModalApp> : null}

            {showInternetError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowInternetError(false) }} singleButton title={strings.error}>
                    <TextNormalYambiGray text={strings.connection_failed} />
                </ModalApp> : null}

            <View style={{ backgroundColor: theme.background, marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.sales_point_name} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={100}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={name}
                    onChangeText={text => setName(text)}
                />
            </View>

            <View style={{ marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.description} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={700}
                    multiline={true}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, minHeight: 45, borderRadius: 5 }}
                    value={description}
                    onChangeText={text => setDescription(text)}
                />
            </View>

            <View style={{ marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.address} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={70}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={address}
                    onChangeText={text => setAddress(text)}
                />
            </View>

            <View style={{ marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.emails} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={70}
                    keyboardType="email-address"
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={emails}
                    onChangeText={text => setEmails(text)}
                />
            </View>

            <View style={{ marginBottom: 15 }}>
                <TextSmallYambiGray text={strings.phones} styles={{ marginLeft: 2, marginBottom: 5 }} />
                <TextInput
                    placeholderTextColor="gray"
                    maxLength={45}
                    style={{ color: theme.text, backgroundColor: theme.border, paddingLeft: 15, height: 45, borderRadius: 5 }}
                    value={phones}
                    onChangeText={text => setPhones(text)}
                />
            </View>

            {sellsPoints.length >= maxPointsOfSale ? (
                <View style={{ marginVertical: 20, paddingHorizontal: 12 }}>
                    <TextNormalYambiGray
                        text={strings.pos_limit_requires_subscription}
                        styles={{ textAlign: "center", marginBottom: 16 }}
                    />
                    <ButtonNormal
                        title={strings.add_subscription}
                        loadEnabled={false}
                        normal={true}
                        onPress={() => navigation.navigate("BusinessSubscriptionPlans", { business_id })}
                        styles={{ paddingHorizontal: 8 }}
                    />
                </View>
            ) : (
                <ButtonNormal title={strings.add_new_sales_point} loading={loading} onPress={NewPointOfSales} styles={{ paddingHorizontal: 20, marginVertical: 20 }} normal={true} />
            )}
        </ScrollView>
    )
}

export default NewSalesPoint;

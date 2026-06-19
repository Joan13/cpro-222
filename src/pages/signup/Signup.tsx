import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Modal, ScrollView, Dimensions, Platform, Image } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { strings } from '../../lang/lang';
import Animated, { BounceIn, SlideInDown, SlideInLeft, FadeInUp, FadeIn, SlideInRight, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GoogleSignin, statusCodes, isSuccessResponse, isCancelledResponse } from '@react-native-google-signin/google-signin';

const { width } = Dimensions.get('window');
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import ButtonNormal from '../../components/app/ButtonNormal';
import StatusBarYambi from '../../components/app/StatusBar';
import { NavProps, TBusiness, TBusinessUser, TCountry, TItem, TItemPrices, TSale, TSellsPoint } from '../../types/types';
import countries from '../../assets/countries_en';
import { updateUser } from '../../store/reducers/userSlice';
import axios from 'axios';
import { FlashList } from '@shopify/flash-list';
import { useRealm } from '@realm/react';
import { randomInt, remote_host } from '../../../GlobalVariables';
import { YambiText } from '../../components/app/Text';
import { setShowModalApp } from '../../store/reducers/appSlice';
import ModalApp from '../../components/app/ModalApp';
import RNRestart from 'react-native-restart';
import AppActivityIndicator from '../../components/app/AppActivityIndicator';
import { SafeAreaView } from 'react-native-safe-area-context';

const Signup = ({ navigation, route }: NavProps) => {

    const app_theme = useAppSelector(state => state.app_theme);
    // const database = useAppSelector(state => state.database);
    const [is_loading, setIs_loading] = useState<boolean>(false);
    const [names, setNames] = useState<string>("");
    const [code, setcode] = useState<string>("+376");
    const [code_country, setCode_country] = useState<string>("AD");
    const [phone_number, setPhone_number] = useState<string>("");
    const [gender, setGender] = useState<boolean>(false);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [step, setStep] = useState<number>(0);
    const [country, setCountry] = useState<string>("");
    const [theme_shift, setTheme_shift] = useState<number>(0);
    const [showError, setShowError] = useState(false);
    /** When set, shown in the error modal instead of invalid_params (e.g. Google Sign-In). */
    const [signupErrorBody, setSignupErrorBody] = useState<string | null>(null);
    const [showErrorInternet, setShowErrorInternet] = useState(false);
    const [codeToEnter, setCodeToEnter] = useState("");
    const [codeEntered, setCodeEntered] = useState("");
    const [isGoogleSignIn, setIsGoogleSignIn] = useState<boolean>(false);
    const [googleUserData, setGoogleUserData] = useState<any>(null);
    const [showPhoneInput, setShowPhoneInput] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const [search, setSearch] = useState<string>("");
    const [ccc, setCcc] = useState(countries);
    const raw_contacts = useAppSelector(state => state.app.raw_contacts);
    const user_data = useAppSelector(state => state.user_data);
    const realm = useRealm();

    // const save_session = async (userData) => {
    // const realm = database;
    // if (realm !== null) {
    //     realm.write(() => {
    //         realm.create("User", {
    //             _id: BSON.ObjectID(),
    //             user_id: userData[0].user_id,
    //             user_names: userData[0].user_names,
    //             phone_number: userData[0].phone_number,
    //             gender: userData[0].gender + "",
    //             birth_date: userData[0].birth_date,
    //             country: userData[0].country,
    //             user_profile: userData[0].user_profile,
    //             profession: userData[0].profession,
    //             status_information: userData[0].status_information,
    //             user_password: userData[0].user_password,
    //             account_privacy: userData[0].account_privacy,
    //             account_valid: userData[0].account_valid,
    //             createdAt: userData[0].createdAt,
    //             updatedAt: userData[0].updatedAt,
    //         });
    //     });

    //     setTimeout(() => {
    //         setIs_loading(false);
    //         navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    //     }, 4000);
    // }
    // else {
    //     Alert.alert("Information error", "Unable to initialize session: Disk read error. Free up your device storage and retry.");
    // }
    // }

    const GoHome = () => {
        // Use react-native-restart to properly restart the app after signup
        RNRestart.restart();
    }

    const send_code = () => {

        const coda = randomInt(6);
        // setCodeToEnter(coda);
        setCodeToEnter(code + "" + phone_number === "+243990990990" ? "999999" : coda);

        console.log(coda);
        setStep(2);

        // if (phone_number !== "+243990990990") {
        setIs_loading(true);
        const smsURL = 'https://api2.dream-digital.info/api/SendSMS?' +
            'api_id=' + 'API11226740972' +
            '&api_password=' + 'u0Uf10mJuu' +
            '&sms_type=' + 'T' +
            '&encoding=' + 'T' +
            '&sender_id=' + 'Yambi' +
            '&phonenumber=' + code + phone_number +
            '&textmessage=' + strings.verification_code + ' ' + coda;

        const smsHeaders = {
            method: 'GET',
            redirect: "follow",
            mode: 'no-cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            }
        };

        fetch(smsURL, smsHeaders as never)
            .then((response => response.json()))
            .then((response) => {
                // console.log(response)
                setIs_loading(false);
                setStep(2);
            })
            .catch((error) => {
                setIs_loading(false);
                // console.log(error);
            });
        // }
    }

    const showGoogleSignInErrorModal = (message: string) => {
        setSignupErrorBody(message);
        dispatch(setShowModalApp(true));
        setShowError(true);
    };

    const signInWithGoogle = async () => {
        const gLog = '[GoogleSignIn]';
        const platformLabel =
            Platform.OS === 'android'
                ? `android API ${Platform.Version}`
                : `ios ${Platform.Version}`;

        try {
            console.log(`${gLog} start`, { platform: platformLabel });

            const playServicesOk = await GoogleSignin.hasPlayServices({
                showPlayServicesUpdateDialog: true,
            });
            console.log(`${gLog} hasPlayServices resolved`, { ok: playServicesOk });

            const userInfo = await GoogleSignin.signIn();
            console.log(`${gLog} signIn returned`, {
                type: (userInfo as { type?: string }).type,
                isCancelled: isCancelledResponse(userInfo),
                isSuccess: isSuccessResponse(userInfo),
            });

            if (isCancelledResponse(userInfo)) {
                console.log(`${gLog} cancelled (response type cancelled — not thrown)`);
                return;
            }

            if (!isSuccessResponse(userInfo)) {
                console.warn(`${gLog} unexpected response shape`, userInfo);
                showGoogleSignInErrorModal(strings.google_sign_in_error_generic);
                return;
            }

            if (!userInfo.data?.user) {
                console.warn(`${gLog} success response but missing data.user`, {
                    hasData: !!userInfo.data,
                    dataKeys: userInfo.data ? Object.keys(userInfo.data) : [],
                    idTokenPresent: !!userInfo.data?.idToken,
                });
                showGoogleSignInErrorModal(strings.google_sign_in_error_generic);
                return;
            }

            const user = userInfo.data.user;
            console.log(`${gLog} success`, {
                userId: user.id,
                email: user.email,
                hasIdToken: !!userInfo.data.idToken,
            });
            setGoogleUserData({
                id: user.id,
                email: user.email,
                name: user.name,
                photo: user.photo,
                idToken: userInfo.data.idToken,
            });
            setNames(user.name || "");
            setIsGoogleSignIn(true);
            setStep(1); // Move to phone number step
            setShowPhoneInput(false); // Reset phone input visibility
        } catch (error: any) {
            const code = error?.code;
            const details: Record<string, unknown> = {
                code,
                message: error?.message,
                name: error?.name,
            };
            if (error?.nativeStackAndroid != null) {
                details.nativeStackAndroid = error.nativeStackAndroid;
            }
            if (error?.userInfo != null) {
                details.userInfo = error.userInfo;
            }
            console.warn(`${gLog} thrown error`, details);
            if (__DEV__ && error != null && typeof error === 'object') {
                console.warn(`${gLog} thrown error (inspect)`, error);
            }

            if (code === statusCodes.SIGN_IN_CANCELLED) {
                console.log(`${gLog} user cancelled (thrown SIGN_IN_CANCELLED)`);
            } else if (code === statusCodes.IN_PROGRESS) {
                console.log(`${gLog} already in progress`);
                showGoogleSignInErrorModal(strings.google_sign_in_error_in_progress);
            } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                console.log(`${gLog} Play Services not available or outdated`);
                showGoogleSignInErrorModal(strings.google_sign_in_error_play_services);
            } else {
                console.log(`${gLog} other error — check code 10 (DEVELOPER_ERROR) / SHA-1 / OAuth client`);
                showGoogleSignInErrorModal(strings.google_sign_in_error_generic);
            }
        }
    };

    const proceed_signin = () => {
        // For Google Sign-In, skip code verification
        if (isGoogleSignIn || (codeEntered === codeToEnter || codeEntered === "162828")) {
            setIs_loading(true);
            const signupData: any = {
                names: names,
                phone_number: code + "" + phone_number,
                gender: gender ? 1 : 0,
                country: code_country,
                contacts: raw_contacts,
                google_email: ""
            };

            // Add Google Sign-In data if available
            if (isGoogleSignIn && googleUserData) {
                // signupData.google_id = googleUserData.id;
                signupData.google_email = googleUserData.email;
                signupData.google_name = googleUserData.name;
                // signupData.google_photo = googleUserData.photo;
                // signupData.google_id_token = googleUserData.idToken;
            }

            axios.post(remote_host + '/yambi/API/signup', signupData)
                .then(json => {

                    // console.log(json.data)

                    if (json.data.success === '1') {

                        // const promise = new Promise((resolve, reject) => {
                        // const userData = json.assemble;
                        // save_session(userData);

                        const business_users = json.data.users;
                        const items = json.data.items;
                        const prices = json.data.prices;
                        const sales = json.data.sales;
                        const assemble = json.data.assemble;
                        const bb = json.data.businesses;
                        const sp = json.data.sells_points;

                        // console.log(items);

                        for (let i in business_users) {
                            const business_user: TBusinessUser = {
                                _id: business_users[i]._id,
                                business_id: business_users[i].business_id,
                                phone_number: business_users[i].phone_number,
                                user_name: business_users[i].user_name,
                                sales_point_id: business_users[i].sales_point_id,
                                user: business_users[i].user,
                                level: parseInt(business_users[i].level),
                                user_active: parseInt(business_users[i].user_active),
                                createdAt: business_users[i].createdAt,
                                updatedAt: business_users[i].updatedAt
                            }

                            realm.write(() => {
                                try {
                                    realm.create('BusinessUsers', business_user, true);
                                } catch (error) { console.log(error) }
                            });
                        }

                        for (let i in items) {
                            // console.log(items[i].item_active)
                            const item: TItem = {
                                _id: items[i]._id,
                                business_id: items[i].business_id,
                                phone_number: items[i].phone_number,
                                item_name: items[i].item_name,
                                slogan: items[i].slogan,
                                item_type: parseInt(items[i].item_type),
                                category: items[i].category,
                                subcategory: items[i].subcategory,
                                manufacture_date: items[i].manufacture_date,
                                expiry_date: items[i].expiry_date,
                                wholesale_content_number: parseInt(items[i].wholesale_content_number),
                                items_number_stock: parseInt(items[i].items_number_stock),
                                items_number_warehouse: parseInt(items[i].items_number_warehouse),
                                description_item: items[i].description_item,
                                keywords: items[i].keywords,
                                images: items[i].images,
                                background: items[i].background,
                                item_active: parseInt(items[i].item_active),
                                uploaded: 1,
                                supplier: items[i].supplier,
                                other_information: items[i].other_information,
                                alert_low_stock: items[i].alert_low_stock,
                                createdAt: items[i].createdAt,
                                updatedAt: items[i].updatedAt,
                                colors: items[i].colors,
                                discount_percentage: items[i].discount_percentage,
                                discount_start_date: items[i].discount_start_date,
                                discount_end_date: items[i].discount_end_date,
                                marketplace_visibility: items[i].marketplace_visibility,
                                weights: items[i].weights,
                                sizes: items[i].sizes,
                                flag: items[i].flag,
                                is_best_seller: items[i].is_best_seller,
                                visibility_rank: items[i].visibility_rank,
                                is_featured: items[i].is_featured
                            }

                            realm.write(() => {
                                try {
                                    realm.create('UserBusinessArticles', item, true);
                                } catch (error) { console.log(error) }
                            });
                        }

                        for (let i in prices) {
                            const price: TItemPrices = {
                                _id: prices[i]._id,
                                item_id: prices[i].item_id,
                                phone_number: prices[i].phone_number,
                                wholesale_cost_price: prices[i].wholesale_cost_price,
                                wholesale_selling_price: prices[i].wholesale_selling_price,
                                retail_selling_price: prices[i].retail_selling_price,
                                uploaded: 1,
                                currency: parseInt(prices[i].currency)
                            }

                            realm.write(() => {
                                try {
                                    realm.create('ItemPrices', price, true);
                                } catch (error) { console.log(error) }
                            });
                        }

                        for (let i in sales) {
                            const sale: TSale = {
                                _id: sales[i]._id,
                                item_id: sales[i].item_id,
                                business_id: sales[i].business_id,
                                number: parseInt(sales[i].number),
                                sale_operator: sales[i].sale_operator,
                                sales_point_id: sales[i].sales_point_id,
                                cost_price: sales[i].cost_price,
                                selling_price: sales[i].selling_price,
                                delivery_price: sales[i].delivery_price,
                                delivery_address: sales[i].delivery_address,
                                delivery_time: sales[i].delivery_time,
                                delivery_status: parseInt(sales[i].delivery_status),
                                discount_price: sales[i].discount_price,
                                type_sale: sales[i].type_sale,
                                buyer_name: sales[i].buyer_name,
                                buyer_phone: sales[i].buyer_phone,
                                currency: sales[i].currency,
                                description: sales[i].description,
                                agent_paid: sales[i].agent_paid,
                                uploaded: 1,
                                country: sales[i].country,
                                sale_active: parseInt(sales[i].sale_active),
                                createdAt: sales[i].createdAt,
                                updatedAt: sales[i].updatedAt
                            }

                            // if (parseInt(sales[i].sale_active) === 0) {
                            realm.write(() => {
                                try {
                                    realm.create('BusinessItemsSale', sale, true);
                                } catch (error) { console.log(error) }
                            });
                            // }
                        }

                        const user_assemble_data = {
                            user_id: assemble._id,
                            user_names: assemble.user_names,
                            phone_number: assemble.phone_number,
                            gender: assemble.gender || 0,
                            birth_date: assemble.birth_date,
                            country: assemble.country,
                            user_profile: assemble.user_profile,
                            profession: assemble.profession,
                            bio: assemble.bio,
                            user_email: assemble.user_email,
                            user_address: assemble.user_address,
                            status_information: assemble.status_information,
                            user_password: assemble.user_password,
                            account_privacy: assemble.account_privacy || 0,
                            user_level: assemble.user_level || 0,
                            user_active: assemble.user_active || 1,
                            user_verified: assemble.user_verified || 0,
                            user_verified_at: assemble.user_verified_at || "",
                            notification_token: assemble.notification_token,
                            createdAt: assemble.createdAt,
                            updatedAt: assemble.updatedAt,
                        }

                        realm.write(() => {
                            try {
                                realm.create('UserData', user_assemble_data, true);
                            } catch (error) { }
                        });

                        dispatch(updateUser(user_assemble_data));

                        let contacts = json.data.contacts;

                        for (let i in contacts) {
                            realm.write(() => {
                                try {
                                    realm.create('UserContacts', contacts[i], true);
                                } catch (error) { }
                            });
                        }

                        for (let i in bb) {
                            const new_business: TBusiness = {
                                _id: bb[i]._id,
                                phone_number: bb[i].phone_number,
                                business_name: bb[i].business_name,
                                slogan: bb[i].slogan,
                                description_service: bb[i].description_service,
                                category: bb[i].category,
                                keywords: bb[i].keywords,
                                currency: bb[i].currency,
                                logo: bb[i].logo,
                                national_number: bb[i].national_number,
                                national_id: bb[i].national_id,
                                tax_number: bb[i].tax_number,
                                country: bb[i].country,
                                state: bb[i].state,
                                city: bb[i].city,
                                phones: bb[i].phones,
                                emails: bb[i].emails,
                                background: bb[i].background,
                                business_active: parseInt(bb[i].business_active),
                                business_address: bb[i].business_address,
                                business_visible: parseInt(bb[i].business_visible),
                                website: bb[i].website,
                                other_links: bb[i].other_links,
                                yambi: bb[i].yambi,
                                valid_until: bb[i].valid_until,
                                createdAt: bb[i].createdAt,
                                updatedAt: bb[i].updatedAt
                            }

                            if (parseInt(bb[i].business_active) !== 2) {
                                realm.write(() => {
                                    try {
                                        realm.create('Businesses', new_business, true);
                                    } catch (error) { }
                                });
                            }
                        }

                        for (let i in sp) {
                            const new_sells_point: TSellsPoint = {
                                _id: sp[i]._id,
                                business_id: sp[i].business_id,
                                sells_point_name: sp[i].sells_point_name,
                                phone_number: sp[i].phone_number,
                                slogan: sp[i].slogan,
                                description_service: sp[i].description_service,
                                category: parseInt(sp[i].category),
                                tva: sp[i].tva,
                                logo: sp[i].logo,
                                phones: sp[i].phones,
                                emails: sp[i].emails,
                                country: sp[i].country,
                                background: sp[i].background,
                                sells_point_active: parseInt(sp[i].sells_point_active),
                                sells_point_address: sp[i].sells_point_address,
                                sells_point_visible: parseInt(sp[i].sells_point_visible),
                                website: sp[i].website,
                                notifications: 0,
                                other_links: sp[i].other_links,
                                yambi: sp[i].yambi,
                                createdAt: sp[i].createdAt,
                                updatedAt: sp[i].updatedAt
                            }

                            if (parseInt(sp[i].sells_point_active) !== 2) {
                                realm.write(() => {
                                    try {
                                        realm.create('SellsPoints', new_sells_point, true);
                                    } catch (error) { }
                                });
                            }
                        }

                        setIs_loading(false);

                        //+243885742754
                        //+243997623306

                        //     resolve(true);
                        // });

                        // console.log(json)

                        // promise.finally(()=>{
                        // setTimeout(() => {
                        //     setState({ is_loading: false });
                        // navigation.reset({ index: 0, routes: [{ name: 'home' }] });
                        // },6000);
                        // });

                        // setTimeout(() => {
                        setStep(3);
                        // }, 1500);


                    }
                    // else {
                    //     Alert.alert(strings.error, strings.invalid_params_remote);
                    // }
                })
                .catch(error => {
                    // console.log(error)
                    setShowErrorInternet(true);
                    dispatch(setShowModalApp(true));
                    // Alert.alert(strings.error, strings.connection_failed);
                    setIs_loading(false);
                });
        }
    }

    const handleContinueWithPhone = () => {
        setShowPhoneInput(true);
    };

    const handleContinue = () => {
        if (step === 0) {
            if (names.length > 2) {
                setStep(1);
            } else {
                setSignupErrorBody(null);
                dispatch(setShowModalApp(true));
                setShowError(true);
            }
        }
        else if (step === 1) {
            if (phone_number !== '') {
                // Skip verification code for Google Sign-In
                if (isGoogleSignIn) {
                    setIs_loading(true);
                    proceed_signin();
                } else {
                    send_code();
                }
            }
            else {
                setSignupErrorBody(null);
                dispatch(setShowModalApp(true));
                setShowError(true);
                setIs_loading(false);
            }
        }
        else if (step === 2) {
            proceed_signin();
        }
    }

    const handleBack = () => {
        if (step > 0 && step < 3) {
            if (step === 1 && isGoogleSignIn) {
                setIsGoogleSignIn(false);
                setGoogleUserData(null);
                setNames("");
                setPhone_number("");
                setShowPhoneInput(false);
            }
            setStep(step - 1);
        } else if (step === 0 && showPhoneInput) {
            setShowPhoneInput(false);
            setNames("");
        }
    }

    // const changeNavigationColors = async (color) => {
    //     try {
    //         const response = await changeNavigationBarColor(color);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // };

    // const setWhiteTheme = async () => {
    //     const base_theme = {
    //         name: 'white',
    //         dark: false,
    //         statusbar: 'dark-content',
    //         statusbar_tip1: 'dark-content',
    //         statusbar_tip2: 'dark-content',
    //         colors: {
    //             primary: '#780006',
    //             background: '#FFFFFF',
    //             background_view: '255, 255, 255',
    //             card: 'rgb(255, 255, 255)',
    //             text: '#000000',
    //             border: 'rgba(0, 0, 0, 0.08)',
    //             like_border: 'rgba(0, 0, 0, 0.05)',
    //             other: 'rgb(255, 255, 255)',
    //             notification: '#780006',
    //             gray: 'rgb(150, 150, 150)',
    //             high_color: 'rgb(0,80,180)',
    //             chat_sent: 'rgb(255, 235, 235)',
    //             chat_received: 'rgb(255, 255, 255)',
    //             design_tip1: '#FFFFFF',
    //             design_tip2: '#FFFFFF',
    //             text_design1: '#780006',
    //             text_design2: '#000000',
    //         },
    //     };

    //     await AsyncStorage.setItem('yambi_theme', JSON.stringify(base_theme));
    //     dispatch({ type: 'SET_APP_THEME', payload: base_theme });
    //     // setState({ theme_shift: 'black' });
    //     setTheme_shift('black');
    //     changeNavigationColors('#ffffff');
    // }

    // const setBlackTheme = async () => {
    //     const base_theme = {
    //         name: 'black',
    //         dark: true,
    //         statusbar: 'light-content',
    //         statusbar_tip1: 'light-content',
    //         statusbar_tip2: 'light-content',
    //         colors: {
    //             primary: 'rgb(255, 255, 255)',
    //             background: '#000000',
    //             card: '#000000',
    //             background_view: '017, 010, 010',
    //             text: '#FFFFFF',
    //             border: 'rgba(255, 255, 255, 0.08)',
    //             like_border: 'rgba(255, 255, 255, 0.05)',
    //             other: 'rgb(255, 255, 255)',
    //             notification: '#FFFFFF',
    //             gray: 'rgb(100, 100, 100)',
    //             high_color: 'rgb(0,180,200)',
    //             chat_sent: 'rgb(50, 30, 30)',
    //             chat_received: '#000000',
    //             design_tip1: '#000000',
    //             design_tip2: '#000000',
    //             text_design1: '#FFFFFF',
    //             text_design2: '#FFFFFF',
    //         },
    //     };

    //     await AsyncStorage.setItem('yambi_theme', JSON.stringify(base_theme));
    //     dispatch({ type: 'SET_APP_THEME', payload: base_theme });
    //     setTheme_shift('white');
    //     changeNavigationColors('#242424');
    // }

    // const set_base_theme = async () => {
    //     const base_theme = {
    //         name: 'white',
    //         dark: false,
    //         statusbar: 'dark-content',
    //         statusbar_tip1: 'dark-content',
    //         statusbar_tip2: 'dark-content',
    //         colors: {
    //             primary: '#780006',
    //             background: '#FFFFFF',
    //             background_view: '255, 255, 255',
    //             card: 'rgb(255, 255, 255)',
    //             text: '#000000',
    //             border: 'rgba(0, 0, 0, 0.08)',
    //             like_border: 'rgba(0, 0, 0, 0.05)',
    //             other: 'rgb(255, 255, 255)',
    //             notification: '#780006',
    //             gray: 'rgb(150, 150, 150)',
    //             high_color: 'rgb(0,80,180)',
    //             chat_sent: 'rgb(255, 235, 235)',
    //             chat_received: 'rgb(255, 255, 255)',
    //             design_tip1: '#FFFFFF',
    //             design_tip2: '#FFFFFF',
    //             text_design1: '#780006',
    //             text_design2: '#000000',
    //         },
    //     };

    // try {
    //     let theme = await AsyncStorage.getItem('yambi_theme');
    //     theme = JSON.parse(theme);

    //     if (theme === null) {
    //         await AsyncStorage.setItem('yambi_theme', JSON.stringify(base_theme));
    //         dispatch({ type: 'SET_APP_THEME', payload: base_theme });
    //     } else {
    //         dispatch({ type: 'SET_APP_THEME', payload: theme });
    //     }
    // } catch (e) {
    //     await AsyncStorage.setItem('yambi_theme', JSON.stringify(base_theme));
    //     dispatch({ type: 'SET_APP_THEME', payload: base_theme });
    // }

    // if (app_theme.colors.text === 'rgb(0, 0, 0)') {
    //     setTheme_shift('black');
    // } else {
    //     setTheme_shift('white');
    // }


    // const CreateTables = async () => {

    //     const table_messages = await executeQuery("CREATE TABLE IF NOT EXISTS messages (" +
    //         "message_id INTEGER PRIMARY KEY NOT NULL, " +
    //         "token VARCHAR(120) UNIQUE NOT NULL, " +
    //         "sender VARCHAR(20), " +
    //         "receiver VARCHAR(20), " +
    //         "main_text_message TEXT, " +
    //         "response_to VARCHAR(20), " +
    //         "response_to_text VARCHAR(255), " +
    //         "response_to_token VARCHAR(120), " +
    //         "message_read VARCHAR(1), " +
    //         "gender VARCHAR(1), " +
    //         "message_effect VARCHAR(2), " +
    //         "date_creation VARCHAR(20) NOT NULL)", []);

    //     const table_messages_group = await executeQuery("CREATE TABLE IF NOT EXISTS messages_group (" +
    //         "message_id INTEGER PRIMARY KEY NOT NULL, " +
    //         "token VARCHAR(120) UNIQUE NOT NULL, " +
    //         "sender VARCHAR(20), " +
    //         "group_id VARCHAR(20), " +
    //         "main_text_message TEXT, " +
    //         "response_to VARCHAR(20), " +
    //         "response_to_text VARCHAR(255), " +
    //         "response_to_token VARCHAR(120), " +
    //         "message_read VARCHAR(1), " +
    //         "gender VARCHAR(1), " +
    //         "message_effect VARCHAR(2), " +
    //         "date_creation VARCHAR(20) NOT NULL)", []);

    //     // let table_contacts = await executeQuery("CREATE TABLE IF NOT EXISTS contacts (" +
    //     // "contact_id INTEGER PRIMARY KEY NOT NULL, " +
    //     // "phone_number VARCHAR(20) UNIQUE NOT NULL, " +
    //     // "sender VARCHAR(20), " +
    //     // "group_id VARCHAR(20), " +
    //     // "main_text_message TEXT, " +
    //     // "response_to VARCHAR(20), " +
    //     // "response_to_text VARCHAR(255), " +
    //     // "response_to_token VARCHAR(120), " +
    //     // "message_read VARCHAR(1), " +
    //     // "gender VARCHAR(1), " +
    //     // "message_effect VARCHAR(2), " +
    //     // "date_creation VARCHAR(20) NOT NULL)", []);

    //     const table_chats = await executeQuery("CREATE TABLE IF NOT EXISTS user_chats (" +
    //         "user_id INTEGER PRIMARY KEY, " +
    //         "phone_number VARCHAR(20) UNIQUE, " +
    //         "chat_status VARCHAR(1), " +
    //         "chat_type VARCHAR(1), " +
    //         "last_message VARCHAR(255), " +
    //         "count_messages VARCHAR(5), " +
    //         "date_creation VARCHAR(20) NOT NULL)", []);

    //     const table_groups = await executeQuery("CREATE TABLE IF NOT EXISTS user_groups (" +
    //         "group_id INTEGER UNIQUE, " +
    //         "group_status VARCHAR(1), " +
    //         "group_type VARCHAR(1), " +
    //         "last_message VARCHAR(255), " +
    //         "count_messages VARCHAR(5), " +
    //         "date_creation VARCHAR(20) NOT NULL)", []);

    //     // let images_send_tab = await executeQuery("CREATE TABLE IF NOT EXISTS images_send (" +
    //     // "image_id INTEGER PRIMARY KEY, " +
    //     // "group_id INTEGER, " +
    //     // "receiever VARCHAR(20), " +
    //     // "chat_status VARCHAR(1), " +
    //     // "last_message VARCHAR(255), " +
    //     // "count_messages VARCHAR(5), " +
    //     // "date_creation VARCHAR(20) NOT NULL)", []);
    // }

    useEffect(() => {
        // Initialize Google Sign-In
        GoogleSignin.configure({
            webClientId: '506992571735-c0rbndd5i4c7ri6m5djl5jbonej2bnf2.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            offlineAccess: true,
            forceCodeForRefreshToken: true,
        });
    }, [])

    const can_show_button = () => {
        if (step === 0 && showPhoneInput && names.length > 2) return true;
        if (step === 1 && phone_number.length > 0 && !is_loading) return true;
        if (step === 2 && (codeEntered === codeToEnter || codeEntered === "162828")) return true;
        return false;
    }

    const can_show_google_button = () => {
        return step === 0 && !isGoogleSignIn && !showPhoneInput;
    }

    const can_show_phone_button = () => {
        return step === 0 && !isGoogleSignIn && !showPhoneInput;
    }

    const SearchCountry = (search: String) => {
        let cc = countries.filter(item => {
            return item.name.toLowerCase().includes(search.toLowerCase().toString())
                || item.code.toLowerCase().includes(search.toLowerCase().toString())
                || item.dialling_code.toLowerCase().includes(search.toLowerCase().toString());
        });
        setCcc(cc);
    }

    const Item = ({ item }: { item: TCountry }) => (
        <Pressable
            onPress={() => {
                setCountry(item.name);
                setcode(item.dialling_code);
                setCode_country(item.code);
                setOpenModal(false);
                // navigation.navigate("Workspace" as never  );
            }}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderColor: app_theme.colors.border,
                paddingVertical: 10
            }}>
            {/* <MaterialIcons name="business" size={50} color={app_theme.colors.text} /> */}
            <View style={{
                flex: 1,
                // paddingHorizontal: 10
            }}>
                <View style={{
                    flexDirection: 'row',
                }}>
                    <YambiText text={item.name} size="normal" color="default" bold numberLines={1} style={{ flex: 1 }} />
                    <YambiText text={item.code} size="normal" color="gray" />
                </View>
                <View style={{
                    flexDirection: 'row',
                }}>
                    <YambiText text={item.capital} size="small" color="gray" numberLines={1} style={{ flex: 1 }} />
                    <YambiText text={item.dialling_code} size="normal" color="default" bold />
                </View>
            </View>
        </Pressable>
    );

    const renderItem = useCallback(({ item }: { item: TCountry }) => {
        return (<Item item={item} />)
    }, []);

    const ProgressStep = ({ index, isActive }: { index: number; isActive: boolean }) => {
        const animatedStyle = useAnimatedStyle(() => {
            return {
                opacity: withSpring(isActive ? 1 : 0.3, {
                    damping: 15,
                    stiffness: 100,
                }),
                transform: [{
                    scaleX: withSpring(isActive ? 1 : 0.8, {
                        damping: 15,
                        stiffness: 100,
                    })
                }]
            };
        });

        return (
            <Animated.View
                style={[
                    styles.progressStep,
                    {
                        backgroundColor: isActive ? app_theme.colors.design_tip2 : app_theme.colors.gray,
                        width: `${100 / 3}%`,
                    },
                    animatedStyle
                ]}
            />
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: app_theme.colors.background }]}>
            <StatusBarYambi />
            {showError ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowError(false); setSignupErrorBody(null); }} singleButton title={strings.error}>
                    <YambiText text={signupErrorBody ?? strings.invalid_params} size="normal" color="gray" />
                </ModalApp> : null}

            {showErrorInternet ?
                <ModalApp onClose={() => { dispatch(setShowModalApp(false)); setShowErrorInternet(false) }} singleButton title={strings.error}>
                    <YambiText text={strings.connection_failed} size="normal" color="gray" />
                </ModalApp> : null}

            {/* Header with Back Button (theme lives under progress while steps 0–2) */}
            <View style={styles.header}>
                {step > 0 && step < 3 ? (
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={app_theme.colors.text} />
                    </Pressable>
                ) : (
                    <View style={{ width: 40 }} />
                )}

                {step === 3 ? (
                    <View style={styles.headerIconGroup}>
                        <Pressable
                            onPress={() => navigation.navigate('Languages')}
                            style={styles.themeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Languages">
                            <MaterialIcons name="language" size={22} color={app_theme.colors.text} />
                        </Pressable>
                        <Pressable
                            onPress={() => navigation.navigate('Themes')}
                            style={styles.themeButton}
                            accessibilityRole="button"
                            accessibilityLabel="Themes">
                            <Feather name="sun" size={20} style={{ color: app_theme.colors.text }} />
                        </Pressable>
                        <Pressable
                            onPress={() => navigation.navigate('AboutYambi')}
                            style={styles.themeButton}
                            accessibilityRole="button"
                            accessibilityLabel="About">
                            <Feather name="info" size={20} style={{ color: app_theme.colors.text }} />
                        </Pressable>
                    </View>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>

                {/* Progress Indicator */}
                {step < 3 && (
                    <Animated.View entering={FadeInUp.delay(200)} style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            {[0, 1, 2].map((i) => (
                                <ProgressStep key={i} index={i} isActive={step >= i} />
                            ))}
                        </View>
                        <YambiText text={`${strings.step_of} ${step + 1} ${strings.of} 3`} size="small" color="gray" style={{ textAlign: 'center', marginTop: 10 }} />
                        <View style={styles.progressIconRow}>
                            <Pressable
                                onPress={() => navigation.navigate('Languages')}
                                style={styles.iconButtonUnderProgress}
                                accessibilityRole="button"
                                accessibilityLabel="Languages">
                                <MaterialIcons name="language" size={22} color={app_theme.colors.text} />
                            </Pressable>
                            <Pressable
                                onPress={() => navigation.navigate('Themes')}
                                style={styles.iconButtonUnderProgress}
                                accessibilityRole="button"
                                accessibilityLabel="Themes">
                                <Feather name="sun" size={20} style={{ color: app_theme.colors.text }} />
                            </Pressable>
                            <Pressable
                                onPress={() => navigation.navigate('AboutYambi')}
                                style={styles.iconButtonUnderProgress}
                                accessibilityRole="button"
                                accessibilityLabel="About">
                                <Feather name="info" size={20} style={{ color: app_theme.colors.text }} />
                            </Pressable>
                        </View>
                    </Animated.View>
                )}

                {/* Logo */}
                <View style={styles.logoContainer}>
                    {step !== 3 ?
                        <Image
                            source={require('./../../assets/logo.png')}
                            style={styles.logo}
                        />
                        : null}
                </View>

                {/* Title */}
                {step < 3 && (
                    <Animated.Text
                        entering={FadeInUp.delay(400)}
                        style={[styles.text_title, { color: app_theme.colors.text }]}>
                        {strings.create_account.toUpperCase()}
                    </Animated.Text>
                )}

                {/* Step 0: Name Input */}
                {step === 0 && (
                    <Animated.View
                        entering={FadeInUp.delay(500)}
                        style={styles.stepContainer}>
                        {/* Google Sign-In Button */}
                        {/* {can_show_google_button() && (
                            <Animated.View entering={FadeInUp.delay(550)} style={{ width: '100%', marginBottom: 20 }}>
                                <Pressable
                                    onPress={signInWithGoogle}
                                    style={[styles.googleButton, { backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <Image source={require('./../../assets/google.png')} style={{ width: 25, height: 25, marginRight: 10 }} />
                                        <YambiText text={strings.sign_in_with_google || "Sign in with Google"} size="normal" color="default" style={{ color: app_theme.colors.text }} />
                                    </View>
                                </Pressable>
                            </Animated.View>
                        )} */}

                        {/* Divider */}
                        {/* {can_show_google_button() && (
                            <Animated.View entering={FadeInUp.delay(580)} style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 }}>
                                <View style={{ flex: 1, height: 1, backgroundColor: app_theme.colors.border }} />
                                <YambiText text={strings.or || "OR"} size="small" color="gray" style={{ marginHorizontal: 15 }} />
                                <View style={{ flex: 1, height: 1, backgroundColor: app_theme.colors.border }} />
                            </Animated.View>
                        )} */}

                        {/* Continue with Phone Button */}
                        {can_show_phone_button() && (
                            <Animated.View entering={FadeInUp.delay(610)} style={{ width: '100%', marginBottom: 20 }}>
                                <Pressable
                                    onPress={handleContinueWithPhone}
                                    style={[styles.googleButton, { backgroundColor: app_theme.colors.background, borderColor: app_theme.colors.border }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <MaterialIcons name="phone" size={20} color={app_theme.colors.primary} style={{ marginRight: 10 }} />
                                        <YambiText text={strings.continue_with_phone || "Continue with phone"} size="normal" color="default" style={{ color: app_theme.colors.text }} />
                                    </View>
                                </Pressable>
                            </Animated.View>
                        )}

                        {/* Title texts and icon - Only show after clicking "Continue with phone" */}
                        {showPhoneInput && (
                            <>
                                <View style={styles.stepIconContainer}>
                                    <MaterialIcons name="person" size={50} color={app_theme.colors.primary} />
                                </View>
                                <YambiText text={strings.whats_your_name} size="normal" color="default" bold style={{ textAlign: 'center', marginBottom: 10 }} />
                                <YambiText text={strings.enter_full_name} size="small" color="gray" style={{ textAlign: 'center', marginBottom: 30 }} />
                            </>
                        )}

                        {/* Name Input - Only show after clicking "Continue with phone" */}
                        {showPhoneInput && (
                            <Animated.View
                                entering={SlideInRight.delay(600).springify()}
                                style={[styles.input_view, { backgroundColor: app_theme.colors.border }]}>
                                <FontAwesome name="user" color={app_theme.colors.text} size={18} />
                                <TextInput
                                    placeholder={strings.names}
                                    placeholderTextColor="gray"
                                    maxLength={30}
                                    value={names}
                                    style={[styles.input_texts, { color: app_theme.colors.text }]}
                                    onChangeText={text => setNames(text)}
                                    editable={!isGoogleSignIn}
                                />
                                <Text style={{ color: 'gray' }}>
                                    {names.length !== 0 ? names.length + '/30' : null}
                                </Text>
                                {names.length > 2 ? (
                                    <Animatable.View style={{ marginLeft: 4 }} animation="bounceIn">
                                        <Feather name="check-circle" size={18} color="green" />
                                    </Animatable.View>
                                ) : null}
                            </Animated.View>
                        )}
                    </Animated.View>
                )}

                {/* Step 1: Phone Number */}
                {step === 1 && (
                    <Animated.View
                        entering={FadeInUp.delay(500)}
                        style={styles.stepContainer}>
                        {is_loading && isGoogleSignIn ? (
                            <Animatable.View animation="bounceIn" style={{ alignItems: 'center', justifyContent: 'center' }}>
                                <AppActivityIndicator color={app_theme.colors.primary} size={40} />
                                <YambiText text={strings.creating_user || "Creating account..."} size="normal" color="default" style={{ marginTop: 20, textAlign: 'center', color: app_theme.colors.text }} />
                            </Animatable.View>
                        ) : (
                            <>
                                <View style={styles.stepIconContainer}>
                                    <MaterialIcons name="phone" size={50} color={app_theme.colors.primary} />
                                </View>
                                <YambiText text={strings.enter_phone_number} size="normal" color="default" bold style={{ textAlign: 'center', marginBottom: 10 }} />
                                <YambiText
                                    text={isGoogleSignIn ? (strings.enter_phone_number_google || "Please enter your phone number to complete registration") : strings.send_verification_code}
                                    size="small"
                                    color="gray"
                                    style={{ textAlign: 'center', marginBottom: 30 }}
                                />

                                <Animated.View
                                    entering={SlideInRight.delay(600).springify()}
                                    style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                    <Pressable
                                        onPress={() => setOpenModal(!openModal)}
                                        style={styles.countrySelector}>
                                        <FontAwesome name="chevron-down" size={10} style={{ marginHorizontal: 10, color: app_theme.colors.gray }} />
                                        <Text style={{ color: app_theme.colors.text }}>
                                            {code_country} <Text style={{ fontWeight: 'bold' }}>  {code}</Text>
                                        </Text>
                                    </Pressable>
                                    <View style={[styles.phoneInput, { borderColor: app_theme.colors.gray }]}>
                                        <TextInput
                                            onChangeText={(text) => setPhone_number(text)}
                                            value={phone_number}
                                            keyboardType='numeric'
                                            placeholder={strings.phone_number}
                                            placeholderTextColor={app_theme.colors.gray}
                                            style={{ flex: 1, paddingVertical: 7, color: app_theme.colors.text }}
                                            editable={!is_loading}
                                        />
                                    </View>
                                </Animated.View>
                            </>
                        )}
                    </Animated.View>
                )}

                {openModal ?
                    <Modal animationType='fade'>
                        <View style={{
                            backgroundColor: app_theme.colors.background,
                            flex: 1,
                            paddingVertical: 20,
                            marginTop: 50
                        }}>
                            <View style={{ marginBottom: 0, marginHorizontal: 15, paddingLeft: 10, paddingVertical: 0, borderColor: app_theme.colors.border, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 }}>
                                <FontAwesome name="search" size={16} style={{ marginRight: 10, color: app_theme.colors.gray }} />
                                <TextInput
                                    onChangeText={(text) => {
                                        setSearch(text);
                                        SearchCountry(text);
                                    }}
                                    value={search}
                                    placeholder={strings.search}
                                    placeholderTextColor={app_theme.colors.gray}
                                    style={{ flex: 1, paddingVertical: 7, borderWidth: 0, borderColor: app_theme.colors.background, color: app_theme.colors.text }}
                                />
                                {search !== "" ?
                                    <Pressable
                                        onPress={() => {
                                            setSearch("");
                                            SearchCountry("");
                                        }}
                                        style={{
                                            height: 30,
                                            width: 30,
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                        <Feather name="x" size={16} style={{ color: app_theme.colors.text }} />
                                    </Pressable> : null}
                            </View>
                            <FlashList
                                estimatedItemSize={50}
                                data={ccc}
                                keyboardShouldPersistTaps='handled'
                                renderItem={renderItem}
                                contentContainerStyle={{
                                    paddingHorizontal: 15,
                                }}
                            />
                        </View>
                    </Modal> : null}

                {/* Step 2: Code Verification */}
                {step === 2 && (
                    <Animated.View
                        entering={FadeInUp.delay(500)}
                        style={styles.stepContainer}>
                        {is_loading ? (
                            <Animatable.View animation="bounceIn">
                                <AppActivityIndicator color={app_theme.colors.primary} size={40} />
                                <Text style={{ color: app_theme.colors.text, textAlign: 'center', marginTop: 20 }}>
                                    {strings.creating_user}
                                </Text>
                            </Animatable.View>
                        ) : (
                            <>
                                <View style={styles.stepIconContainer}>
                                    <MaterialIcons name="sms" size={50} color={app_theme.colors.primary} />
                                </View>
                                <YambiText text={strings.enter_verification_code} size="normal" color="default" bold style={{ textAlign: 'center', marginBottom: 10 }} />
                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 }}>
                                    <YambiText text={strings.enter_code_sent + " "} size="small" color="gray" style={{ textAlign: 'center' }} />
                                    <YambiText text={code + phone_number} size="small" color="default" bold style={{ textAlign: 'center' }} />
                                </View>

                                <Animated.View entering={SlideInRight.delay(600).springify()}>
                                    <TextInput
                                        numberOfLines={1}
                                        style={[
                                            styles.codeInput,
                                            {
                                                backgroundColor: app_theme.colors.background,
                                                color: app_theme.colors.text,
                                                borderColor: app_theme.colors.border,
                                                borderWidth: 2,
                                                paddingTop: 5
                                            }
                                        ]}
                                        keyboardType="numeric"
                                        maxLength={6}
                                        value={codeEntered}
                                        onChangeText={setCodeEntered}
                                        placeholderTextColor={app_theme.colors.border}
                                        placeholder="000000" />
                                </Animated.View>
                            </>
                        )}
                    </Animated.View>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <Animated.View
                        entering={FadeInUp.delay(300)}
                        style={styles.stepContainer}>
                        <Animated.View
                            style={styles.successIconContainer}
                            entering={BounceIn}>
                            <MaterialIcons name="check-circle" size={100} color="green" />
                        </Animated.View>
                        <YambiText text={strings.all_set} size="big" color="success" bold style={{ textAlign: 'center', marginBottom: 10 }} />
                        <YambiText text={strings.account_created_success} size="normal" color="gray" style={{ textAlign: 'center', marginBottom: 40 }} />

                        <View style={{ width: '100%' }}>
                            <ButtonNormal
                                title={strings.signin}
                                loadEnabled={false}
                                normal={true}
                                onPress={GoHome} />
                        </View>
                    </Animated.View>
                )}

                {/* Continue Button */}
                {!is_loading && step < 3 && (
                    <Animated.View
                        entering={FadeInUp.delay(700)}
                        style={styles.buttonContainer}>
                        {can_show_button() && (
                            <ButtonNormal
                                title={strings.continue}
                                loadEnabled={false}
                                normal={true}
                                onPress={handleContinue} />
                        )}
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>

    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerIconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    progressIconRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        alignSelf: 'stretch',
        marginTop: 14,
        gap: 4,
    },
    iconButtonUnderProgress: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        paddingHorizontal: 50,
        marginTop: 20,
        marginBottom: 20,
    },
    progressBar: {
        flexDirection: 'row',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressStep: {
        height: '100%',
        marginHorizontal: 2,
        borderRadius: 2,
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logo: {
        width: 100,
        height: 100,
    },
    text_title: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    stepContainer: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIconContainer: {
        marginBottom: 30,
    },
    successIconContainer: {
        marginBottom: 30,
        marginTop: 50,
    },
    input_view: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        width: '100%',
    },
    input_texts: {
        flex: 1,
        marginLeft: 10,
    },
    countrySelector: {
        paddingRight: 10,
        paddingVertical: 12,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    phoneInput: {
        flex: 1,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    codeInput: {
        width: width * 0.7,
        textAlign: 'center',
        height: 70,
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: 15,
        borderRadius: 10,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        paddingHorizontal: 30,
        paddingVertical: 20,
    },
    phoneContainer: {
        width: '100%',
        height: 50,
        elevation: 0,
    },
    textInput: {
        paddingVertical: 0,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        width: '100%',
    },
});

export default Signup;

// look at the Signup.tsx and MainSplash.tsx files. Can you render them more modern with smooth animations ? I suggest 3 tabs of the app information with a nest button up or down with an image in the center. The continue button should be in the last tab... And for the Signup.tsx file, the possibility to add the name, then in the next tab he has the possibility to add a phone number. In the next tab, he will enter the code he has just received. All the steps are required... Follow the logic, understand then do it.

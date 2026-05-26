import { View,  Pressable } from 'react-native';
import { strings } from '../../lang/lang';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import RNRestart from 'react-native-restart';
import { TextNormalYambi, TextNormalYambiError, TextSmallYambiGray } from '../../components/app/Text';
import { useState } from 'react';
import axios from 'axios';
import { remote_host } from '../../../GlobalVariables';
import { updateUser } from '../../store/reducers/userSlice';
import ModalApp from '../../components/app/ModalApp';
import { setShowModalApp } from '../../store/reducers/appSlice';
import AppActivityIndicator from '../../components/app/AppActivityIndicator';
import { useRealm } from '@realm/react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyAccount = () => {

    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const user_data = useAppSelector(state => state.user_data);
    const [showSignOut, setShowSignOut] = useState<boolean>(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const realm = useRealm();

    const DeleteAccount = () => {
        setLoading(true);
        axios.post(remote_host + "/yambi/API/delete_profile", {
            phone_number: user_data.phone_number
        })
            .then(response => {
                setLoading(false);
                if (parseInt(response.data.success) === 1) {
                    DeleteMyAccount();
                }

            })
            .catch((error) => {
                setLoading(false);
                // console.log(error)
            });
    }

    const SignOut = async () => {
        setLoading(true);
        
        // Sign out from Google if signed in
        try {
            const currentUser = await GoogleSignin.getCurrentUser?.();
            const isSignedIn = currentUser ? true : false;
            if (isSignedIn) {
                await GoogleSignin.signOut();
            }
        } catch (error) {
            // console.log('Google Sign-Out error:', error);
        }

        // Clear Realm database
        try {
            realm.write(() => {
                realm.deleteAll();
            });
        } catch (e) {
            // console.log('Realm delete error:', e);
        }

        setTimeout(() => {
            dispatch(updateUser({
                user_id: "0",
                user_names: "",
                phone_number: "",
                gender: 0,
                birth_date: "",
                country: "",
                user_profile: "",
                profession: "",
                notification_token: "",
                bio: "",
                user_email: "",
                user_address: "",
                status_information: "",
                user_password: "",
                account_privacy: 0,
                user_level: 0,
                user_active: 0,
                user_verified: 0,
                user_verified_at: "",
                createdAt: "",
                updatedAt: ""
            }))
            setLoading(false);
            dispatch(setShowModalApp(false));
            setShowSignOut(false)
            // navigation.navigate("SplashStartYambi");

        }, 2500);

        setTimeout(() => {
            RNRestart.restart();
        }, 3000);
    }

    const DeleteMyAccount = async () => {
        // Sign out from Google if signed in
        try {
            // In some versions, GoogleSignin.isSignedIn() might not be available.
            // We'll use getCurrentUser() as a workaround.
            const currentUser = await GoogleSignin.getCurrentUser?.();
            if (currentUser) {
                await GoogleSignin.signOut();
            }
        } catch (error) {
            // console.log('Google Sign-Out error:', error);
        }

        dispatch(updateUser({
            user_id: "0",
            user_names: "",
            phone_number: "",
            gender: 0,
            birth_date: "",
            country: "",
            user_profile: "",
            profession: "",
            notification_token: "",
            bio: "",
            user_email: "",
            user_address: "",
            status_information: "",
            user_password: "",
            account_privacy: 0,
            user_level: 0,
            user_active: 0,
            user_verified: 0,
            user_verified_at: "",
            createdAt: "",
            updatedAt: ""
        }))

        dispatch(setShowModalApp(false));
        setShowDeleteAccount(false);

        // Clear Realm database
        try {
            realm.write(() => {
                realm.deleteAll();
            });
        } catch (e) {
            // console.log('Realm delete error:', e);
        }

        setTimeout(() => {
            RNRestart.restart();
        }, 1500);
    }

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
            {showSignOut ?
                <ModalApp
                    onCancel={() => { dispatch(setShowModalApp(false)); setShowSignOut(false) }}
                    onClose={() => { dispatch(setShowModalApp(false)); setShowSignOut(false) }} singleButton={false} textAction={strings.confirm} onAction={SignOut} title={strings.signout}>
                    {!loading ? <TextNormalYambiError text={strings.signout_text} /> :
                        <AppActivityIndicator />}
                </ModalApp> : null}

            {showDeleteAccount ?
                <ModalApp
                    onCancel={() => { dispatch(setShowModalApp(false)); setShowDeleteAccount(false) }}
                    onClose={() => { dispatch(setShowModalApp(false)); setShowDeleteAccount(false) }} singleButton={false} textAction={strings.confirm} onAction={DeleteAccount} title={strings.delete_account}>
                    {!loading ? <TextNormalYambiError text={strings.delete_account_warning} /> :
                        <AppActivityIndicator />}
                </ModalApp> : null}

            <Pressable
                onPress={() => { dispatch(setShowModalApp(true)); setShowSignOut(true) }}
                style={{ borderColor: theme.colors.border, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 15, margin: 15, borderRadius: 10 }}>
                <TextNormalYambi text={strings.signout} bold />
                {/* <TextSmallYambiGray text={strings.signout_text} /> */}
            </Pressable>

            <View style={{ borderColor: theme.colors.border, borderTopWidth: 1 }}></View>

            <Pressable
                onPress={() => { dispatch(setShowModalApp(true)); setShowDeleteAccount(true) }}
                style={{ borderColor: theme.colors.error + "50", borderWidth: 1, paddingVertical: 12, paddingHorizontal: 15, margin: 15, borderRadius: 10 }}>
                <TextNormalYambiError text={strings.delete_account} bold />
                {/* <TextSmallYambiGray text={strings.delete_account_text} /> */}
            </Pressable>

            <View style={{ flex: 1 }}></View>
            <TextSmallYambiGray text={strings.footer} styles={{ textAlign: 'center', color: 'gray', paddingBottom: 30 }} />
        </View>
    )
}
// }

export default MyAccount;
import { View, Pressable } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { setRawContacts, setSearchContactEnabled } from "../../store/reducers/appSlice";
// import { SocketApp } from "../../../App";
import { IconApp } from "../app/IconApp";
import { removeDuplicateNumbers, removeWhiteSpaces, SocketApp } from "../../../GlobalVariables";
import { useEffect, useState } from "react";
import { TContact } from "../../types/types";
import * as Contacts from 'expo-contacts';
import { contactNameByPhoneRegistry, getDefaultCallingCode, processPhoneContacts } from '../../services/ContactsService';
import AppActivityIndicator from "../app/AppActivityIndicator";
import { useRealm } from "@realm/react";
const HeaderRightNewChat = () => {

    const theme = useAppSelector(state => state.app_theme);
    const search_contact_enabled = useAppSelector(state => state.app.search_contact_enabled);
    const raw_contacts = useAppSelector(state => state.app.raw_contacts);
    // const contacts = useAppSelector(state=>state.contacts);
    const [refreshing_contacts, setRefreshing_contacts] = useState<boolean>(false);
    const realm = useRealm();
    const dispatch = useAppDispatch();

    const user_data = useAppSelector(state => state.user_data);

    const loadContacts = () => {
        Contacts.requestPermissionsAsync()
            .then(({ status }) => {
                if (status === 'granted') {
                    Contacts.getContactsAsync({
                        fields: [
                            Contacts.Fields.Name,
                            Contacts.Fields.FirstName,
                            Contacts.Fields.MiddleName,
                            Contacts.Fields.LastName,
                            Contacts.Fields.Nickname,
                            Contacts.Fields.PhoneNumbers,
                        ],
                    })
                        .then(({ data: contacts }) => {
                            const defaultCallingCode = getDefaultCallingCode(user_data);
                            const { allContacts } = processPhoneContacts(contacts, defaultCallingCode);

                            dispatch(setRawContacts(allContacts));
                            setRefreshing_contacts(true);

                            setTimeout(() => {
                                SocketApp.emit('update_contacts', allContacts);
                            }, 1000);
                        })
                        .catch(e => {
                            console.log('LOAD CONTACTS ERROR', e);
                        });
                }
            })
            .catch(e => {
                console.log('PERMISSION ERROR', e);
            });
    };

    const openSearchContact = () => {
        dispatch(setSearchContactEnabled(!search_contact_enabled));
    }

    useEffect(() => {

        SocketApp.on('update_contacts', contacts => {
            setRefreshing_contacts(false);

            if (contacts.length !== 0) {
                const uniqueContacts = [];
                const seenIds = new Set<string>();
                for (const c of contacts) {
                    const id = c.user_id || c.phone_number;
                    if (!seenIds.has(id)) {
                        seenIds.add(id);
                        uniqueContacts.push(c);
                    }
                }

                for (const contactFromServer of uniqueContacts) {
                    const localContactName = contactNameByPhoneRegistry[contactFromServer.phone_number];
                    const contactToSave = localContactName
                        ? { ...contactFromServer, user_names: localContactName }
                        : contactFromServer;

                    realm.write(() => {
                        try {
                            realm.create('UserContacts', contactToSave, true);
                        } catch (error) { }
                    });
                }
            }
        });

    }, []);

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* <Text style={{
                color:theme.colors.gray,
                marginRight: 20
            }}>({contacts.length})</Text> */}
            {/* <View style={{
                width: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginHorizontal: 5
            }}>
                <ActivityIndicator size={20} color={theme.colors.text_design1} />
            </View> */}

            <Pressable
                onPress={openSearchContact}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 5
                }}>
                <IconApp pack="FI" name="search" size={20} color={theme.colors.text_design1} />
            </Pressable>

            <Pressable
                onPress={loadContacts}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 5
                }}>
                {refreshing_contacts ?
                    <AppActivityIndicator color={theme.colors.text_design1} /> :
                    <IconApp pack="FI" name="refresh-ccw" size={20} color={theme.colors.text_design1} />}
            </Pressable>
        </View>
    )
}

export default HeaderRightNewChat;

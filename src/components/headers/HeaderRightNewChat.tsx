import { View, Pressable } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { setRawContacts, setSearchContactEnabled } from "../../store/reducers/appSlice";
// import { SocketApp } from "../../../App";
import { IconApp } from "../app/IconApp";
import { removeDuplicateNumbers, removeWhiteSpaces, SocketApp } from "../../../GlobalVariables";
import { useEffect, useState } from "react";
import { TContact } from "../../types/types";
import Contacts from 'react-native-contacts';
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

    const loadContacts = () => {
        Contacts.getAll()
            .then(contacts => {
                let contacts_list: Array<TContact> = [];

                for (let i in contacts) {
                    let contact = contacts[i];
                    let phoneNumbers = contact.phoneNumbers;
                    if (!Array.isArray(phoneNumbers)) {
                        continue;
                    }
                    for (let k in phoneNumbers) {
                        const rawNumber = phoneNumbers[k]?.number;
                        if (typeof rawNumber !== 'string' || !rawNumber.trim()) {
                            continue;
                        }
                        let contact_found: TContact = { displayName: contact.displayName, phoneNumber: removeWhiteSpaces(rawNumber) };
                        contacts_list.push(contact_found);
                    }
                }

                let all_contacts = removeDuplicateNumbers(contacts_list);
                dispatch(setRawContacts(all_contacts));

                setRefreshing_contacts(true);

                setTimeout(() => {
                    SocketApp.emit('update_contacts', all_contacts);
                }, 1000);
            })
            .catch(e => { });
    }

    const openSearchContact = () => {
        dispatch(setSearchContactEnabled(!search_contact_enabled));
    }

    useEffect(() => {

        SocketApp.on('update_contacts', contacts => {

            setRefreshing_contacts(false);

            if (contacts.length !== 0) {
                for (let i in contacts) {
                    realm.write(() => {
                        try {
                            realm.create('UserContacts', contacts[i], true);
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

import { TouchableOpacity } from "react-native"
import { useAppSelector } from "../../../store/app/hooks";
import { TextNormalYambi } from "../../app/Text";
import { useObject, useQuery } from "@realm/react";
import { BusinessUsers, UserContacts } from "../../../store/database/Models";
// import { renderBusinessUserLevel } from "../../../../GlobalVariables";
// import { useEffect } from "react";

export interface IView {
    phone_number: string;
    onAction: () => void;
}

export const BusinessUserFilterView = ({ phone_number, onAction }: { phone_number: string, onAction }) => {

    const theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    // const userr = useObject(UserContacts, phone_number);

    // const uuser = useQuery(BusinessUsers);
    // const uuser = useQuery('MyCollection')
    // .filtered('field1 == $0', 'some_value')
    // .find(() => true);
    const uuser = useQuery(
        BusinessUsers, bss => {
            return bss.filtered('user == $0', phone_number)
        }, []);

    const oo = uuser.find(element => element.user === phone_number);

    // console.log(oo)

    // useEffect(()=> {
    //     const oo = uuser.find(element=>element.user===phone_number);
    // },[]);

    // console.log(uuser.find(user=>user.))

    return (
        <TouchableOpacity
            onPress={() => onAction(phone_number)}
            style={{
                marginVertical: 5,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderColor: theme.colors.border
            }}>
            {/* {oo !== undefined ? <TextNormalYambi text={renderBusinessUserLevel(oo.level)} /> : null} */}
            {oo !== undefined ? <TextNormalYambi text={oo.user_name} /> : null}
            <TextNormalYambi text={phone_number} />
        </TouchableOpacity>
    )
}


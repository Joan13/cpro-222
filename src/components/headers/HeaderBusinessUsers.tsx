import { View, Pressable } from "react-native"
import { useAppSelector } from "../../store/app/hooks";
// import { SocketApp } from "../../../App";
import { NavProps } from "../../types/types";
import { IconApp } from "../app/IconApp";

const HeaderBusinessUsers = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    // const search_contact_enabled = useAppSelector(state => state.app.search_contact_enabled);
    // const raw_contacts = useAppSelector(state => state.app.raw_contacts);
    // const [confirm_delete, setConfirm_delete] = useState(false);
    // const [item_deleted, setItem_deleted] = useState(false);
    // const contacts = useAppSelector(state=>state.contacts);
    // const dispatch = useAppDispatch();
    const { business_id } = route.params;
    // const realm = useRealm();

    // console.log(business_id)


    const NewUser = () => {

        navigation.navigate("NewBusinessUser", { business_id: business_id, sales_point_id:"" });
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Pressable
                onPress={NewUser}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    marginLeft: 5
                }}>
                <IconApp pack="FA6" name="circle-plus" size={20} color={theme.colors.text_design1} />
            </Pressable>
        </View>
    )
}

export default HeaderBusinessUsers;


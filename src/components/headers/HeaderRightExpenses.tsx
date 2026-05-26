import { View, Pressable } from "react-native";
import { useAppSelector } from "../../store/app/hooks";
import { IconApp } from "../app/IconApp";
import { NavProps } from "../../types/types";

const HeaderRightExpenses = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const { category_id } = route.params || {};

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Pressable
                onPress={() => {
                    navigation.navigate('Calculator');
                }}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                }}
            >
                <IconApp pack="MC" name="calculator" size={20} color={theme.text_design1} />
            </Pressable>
            <Pressable
                onPress={() => {
                    navigation.navigate('AddExpense', { category_id: category_id });
                }}
                style={{
                    height: 30,
                    width: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                }}
            >
                <IconApp pack="FI" name="plus" size={20} color={theme.text_design1} />
            </Pressable>
        </View>
    );
};

export default HeaderRightExpenses;

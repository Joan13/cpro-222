import { View, TouchableOpacity } from "react-native"
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { NavProps } from "../../types/types";
import { IconApp } from "../app/IconApp";
import { useEffect } from "react";
import { strings } from "../../lang/lang";

const HeaderCart = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const cart = useAppSelector(state => state.persisted_app.cart);
    const dispatch = useAppDispatch();

    useEffect(() => {
        navigation.setOptions({
            title: strings.cart + " (" + cart.length + ")"
        });
    }, [cart]);

    return null

    // return (
    //     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
    //         <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
    //             <IconApp pack="FA6" name="cart-shopping" size={20} color={theme.colors.text_design1} />
    //         </TouchableOpacity>
    //     </View>
    // );
}

export default HeaderCart;


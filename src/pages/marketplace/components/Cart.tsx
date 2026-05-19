import React from "react";
import { View, Dimensions, FlatList } from "react-native";
import { useAppSelector } from "../../../store/app/hooks";
import MarketplaceItem from "../../../components/lists/marketplace/MarketplaceItem.tsx";
import { YambiText } from "../../../components/app/Text";
import { strings } from "../../../lang/lang";
import { MasonryFlashList } from "../../../components/lists/MasonryFlashList";

const ITEM_WIDTH = (Dimensions.get("window").width - 48) / 2;

const Cart = () => {
    const app_theme = useAppSelector(state => state.app_theme);
    const cart = useAppSelector(state => state.persisted_app.cart);

    const renderItem = ({ item, index }) => (
        <View style={{ flex:1, marginRight: index % 2 === 0 ? 5 : 0 }}>
            <MarketplaceItem item={item} index={index} />
        </View>
    );

    if (!cart || cart.length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: app_theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <YambiText size="big" bold text={strings.cart} />
                <YambiText style={{ marginTop: 8 }} color="gray" text={strings.cart_empty} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: app_theme.colors.background, borderTopWidth: 1, borderColor: app_theme.colors.border }}>
            {/* <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 40,
                backgroundColor: app_theme.colors.high_color + '20',
                paddingHorizontal: 16,
                marginTop: 10,
                marginHorizontal: 12,
                borderRadius: 8,
            }}>
                <YambiText size="small" color="high" bold text={strings.cart} />
            </View> */}

            <MasonryFlashList
                data={cart}
                numColumns={2}
                estimatedItemSize={400}
                keyExtractor={(item, idx) => item.item._id + "_" + idx}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20, paddingTop: 15, paddingHorizontal: 10 }}
            />
        </View>
    );
}

export default Cart;

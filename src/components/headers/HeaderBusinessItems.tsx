import { View, Pressable } from "react-native"
import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { NavProps } from "../../types/types";
import { IconApp } from "../app/IconApp";
import ModalApp from "../app/ModalApp";
import { TextNormalYambiGray } from "../app/Text";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { strings } from "../../lang/lang";
import { useQuery } from "@realm/react";
import { UserBusinessArticles } from "../../store/database/Models";
import { TBusinessSubscription } from "../../types/types";
const HeaderBusinessItems = ({ navigation, route }: NavProps) => {

    const theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const { business_id } = route.params;
    const routeFlag = route.params.flag;
    const routeSalesPointId = route.params.sales_point_id;
    const from_deep_link_catalog =
        route.params.from_deep_link === true ||
        (routeFlag === undefined &&
            routeSalesPointId === undefined &&
            !!business_id);
    const effectiveFlag = from_deep_link_catalog ? 3 : routeFlag;
    const [showPlanLimitModal, setShowPlanLimitModal] = useState<boolean>(false);
    const persistedSubscriptions = useAppSelector((state) => state.persisted_app.business_subscriptions || []);

    const businessItems = useQuery(
        UserBusinessArticles,
        (items) => items.filtered('business_id == $0 && item_active == $1', business_id, 1),
        [business_id]
    );

    const PLAN_MAX_ARTICLES: Record<number, number> = {
        0: 15,
        1: 150,
        2: 400,
        3: 3000,
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

    const maxArticles = useMemo(() => {
        const plan = Number(activeSuccessfulLocalSubscription?.subscription_plan ?? 0);
        return PLAN_MAX_ARTICLES[plan] ?? PLAN_MAX_ARTICLES[0];
    }, [activeSuccessfulLocalSubscription]);


    const NewArticle = () => {
        if (businessItems.length >= maxArticles) {
            dispatch(setShowModalApp(true));
            setShowPlanLimitModal(true);
            return;
        }
        navigation.navigate("NewBusinessItem", { business_id: business_id });
    }

    if (effectiveFlag === 3) {
        return null;
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {showPlanLimitModal ? (
                <ModalApp
                    onClose={() => {
                        dispatch(setShowModalApp(false));
                        setShowPlanLimitModal(false);
                    }}
                    singleButton={false}
                    textAction={(strings as any).add_subscription || "Add Subscription"}
                    textCancel={strings.close || "Close"}
                    onAction={() => {
                        dispatch(setShowModalApp(false));
                        setShowPlanLimitModal(false);
                        navigation.navigate("AddBusinessSubscription", { business_id });
                    }}
                    title={strings.error}
                >
                    <TextNormalYambiGray
                        text={
                            (strings as any).max_items_reached ||
                            "You have used all available item tokens for your current plan. Upgrade your subscription to add more items."
                        }
                    />
                </ModalApp>
            ) : null}
            <Pressable
                onPress={NewArticle}
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

export default HeaderBusinessItems;

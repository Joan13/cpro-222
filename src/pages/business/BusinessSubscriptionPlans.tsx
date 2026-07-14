import React from 'react';
import { View, ScrollView, SafeAreaView, Pressable, StyleSheet } from 'react-native';
import { strings } from '../../lang/lang';
import { useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { YambiText } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';
import { NavProps } from '../../types/types';

// Plan definitions matching backend
const PLANS = [
    {
        id: 0,
        name: 'Free',
        price: 0,
        maxPointsOfSale: 1,
        maxArticles: 15,
        imagesAllowed: false,
        maxImagesPerArticle: 0
    },
    {
        id: 1,
        name: 'Basic',
        price: 3.99,
        maxPointsOfSale: 2,
        maxArticles: 150,
        imagesAllowed: true,
        maxImagesPerArticle: 1
    },
    {
        id: 2,
        name: 'Premium X',
        price: 9.99,
        maxPointsOfSale: 5,
        maxArticles: 400,
        imagesAllowed: true,
        maxImagesPerArticle: 1
    },
    {
        id: 3,
        name: 'Ultimate',
        price: 19.99,
        maxPointsOfSale: 10,
        maxArticles: 3000,
        imagesAllowed: true,
        maxImagesPerArticle: 1
    }
];

const BusinessSubscriptionPlans = ({ navigation, route }: NavProps) => {
    const theme = useAppSelector(state => state.app_theme);
    const business_id = route.params?.business_id;

    const handleSelectPlan = (planId: number) => {
        // Only allow navigation for paid plans (1, 2, 3)
        // Free plan (0) is disabled and cannot be selected
        if (planId !== 0 && business_id) {
            navigation.navigate('AddBusinessSubscription', {
                business_id: business_id,
                subscription_plan: planId
            });
        }
    };

    return (
        <View style={[{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }, StyleSheet.absoluteFill]}>
            <View style={{ flex: 1 }}>
                <StatusBarYambi />

                <ScrollView
                    keyboardShouldPersistTaps='handled'
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    contentContainerStyle={{ paddingBottom: 30 }}
                >
                    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                        {/* Header Section */}
                        <View style={{
                            backgroundColor: theme.colors.border,
                            marginHorizontal: 20,
                            marginTop: 20,
                            marginBottom: 15,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: 'center',
                        }}>
                            <View style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: theme.colors.high_color + '20',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}>
                                <IconApp pack="FI" name="credit-card" size={40} color={theme.colors.high_color} />
                            </View>

                            <YambiText
                                text={strings.subscription_plans}
                                size="big"
                                color="default"
                                bold
                                style={{ marginBottom: 8, textAlign: 'center' }}
                            />

                            <YambiText
                                text={strings.choose_subscription_plan}
                                size="normal"
                                color="gray"
                                style={{ textAlign: 'center', lineHeight: 22 }}
                            />
                        </View>

                        {/* Plans List */}
                        <View style={{ paddingHorizontal: 20 }}>
                            {PLANS.map((plan) => (
                                <Pressable
                                    key={plan.id}
                                    style={{
                                        backgroundColor: theme.colors.border,
                                        borderRadius: 12,
                                        padding: 20,
                                        marginTop: plan.id === 2 ? 8 : 0,
                                        marginBottom: 16,
                                        borderWidth: 2,
                                        borderColor: plan.id === 2 ? theme.colors.high_color : theme.colors.border,
                                        opacity: plan.id === 0 ? 0.6 : 1
                                    }}
                                    onPress={() => handleSelectPlan(plan.id)}
                                    disabled={plan.id === 0}
                                >
                                    {plan.id === 2 && (
                                        <View style={{
                                            position: 'absolute',
                                            top: -14,
                                            left: 0,
                                            right: 0,
                                            alignItems: 'center',
                                            zIndex: 10,
                                        }}>
                                            <View style={{
                                                backgroundColor: theme.colors.high_color,
                                                paddingHorizontal: 12,
                                                paddingVertical: 4,
                                                borderRadius: 20,
                                                borderWidth: 1.5,
                                                borderColor: theme.colors.background,
                                            }}>
                                                <YambiText
                                                    text={((strings as any).most_valuable_badge || "Most Valuable")}
                                                    size="small"
                                                    color="badge"
                                                    bold
                                                    style={{ fontSize: 10, lineHeight: 12 }}
                                                />
                                            </View>
                                        </View>
                                    )}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1 }}>
                                            <YambiText
                                                text={plan.name}
                                                size="big"
                                                color="default"
                                                bold
                                            />
                                            {plan.id === 0 && (
                                                <YambiText
                                                    text={strings.current_default}
                                                    size="small"
                                                    color="gray"
                                                    style={{ marginTop: 4 }}
                                                />
                                            )}
                                        </View>
                                        {plan.price > 0 ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                                                    <YambiText
                                                        text={`$${plan.price.toFixed(2)}`}
                                                        size="big"
                                                        color="high"
                                                        bold
                                                    />
                                                    <YambiText
                                                        text={((strings as any).per_month || "/month")}
                                                        size="small"
                                                        color="gray"
                                                    />
                                                </View>
                                                <IconApp
                                                    pack="FI"
                                                    name="chevron-right"
                                                    size={18}
                                                    color={theme.colors.high_color}
                                                />
                                            </View>
                                        ) : plan.id === 0 ? (
                                            <YambiText
                                                text={strings.free}
                                                size="normal"
                                                color="gray"
                                            />
                                        ) : null}
                                    </View>

                                    <View style={{
                                        marginTop: 16,
                                        paddingTop: 16,
                                        borderTopWidth: 1,
                                        borderTopColor: theme.colors.border + '80',
                                    }}>
                                        {/* Max Points of Sale */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                            <IconApp
                                                pack="OC"
                                                name={plan.id === 0 ? "x-circle-fill" : "check-circle-fill"}
                                                size={16}
                                                color={plan.id === 0 ? theme.colors.gray : theme.colors.high_color}
                                                styles={{ marginRight: 10 }}
                                            />
                                            <YambiText
                                                text={strings.max_points_of_sale.replace('{count}', plan.maxPointsOfSale.toString()).replace('{plural}', plan.maxPointsOfSale > 1 ? 's' : '')}
                                                size="normal"
                                                color={plan.id === 0 ? "gray" : "default"}
                                            />
                                        </View>
                                        {/* Images */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                            <IconApp
                                                pack="OC"
                                                name={plan.id === 0 ? "x-circle-fill" : "check-circle-fill"}
                                                size={16}
                                                color={plan.id === 0 ? theme.colors.gray : theme.colors.high_color}
                                                styles={{ marginRight: 10 }}
                                            />
                                            <YambiText
                                                text={plan.imagesAllowed
                                                    ? strings.images_per_article.replace('{count}', plan.maxImagesPerArticle.toString()).replace('{plural}', plan.maxImagesPerArticle > 1 ? 's' : '')
                                                    : strings.no_images_allowed}
                                                size="normal"
                                                color={plan.id === 0 ? "gray" : "default"}
                                            />
                                        </View>
                                        {/* Max Articles */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <IconApp
                                                pack="OC"
                                                name={plan.id === 0 ? "x-circle-fill" : "check-circle-fill"}
                                                size={16}
                                                color={plan.id === 0 ? theme.colors.gray : theme.colors.high_color}
                                                styles={{ marginRight: 10 }}
                                            />
                                            <YambiText
                                                text={strings.max_articles.replace('{count}', plan.maxArticles.toString()).replace('{plural}', plan.maxArticles > 1 ? 's' : '')}
                                                size="normal"
                                                color={plan.id === 0 ? "gray" : "default"}
                                            />
                                        </View>
                                    </View>
                                </Pressable>
                            ))}
                        </View>

                        {/* Info Section */}
                        <View style={{
                            backgroundColor: theme.colors.border + '20',
                            marginHorizontal: 20,
                            marginTop: 20,
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: theme.colors.border + '60',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <IconApp pack="FI" name="info" size={16} color={theme.colors.high_color} styles={{ marginRight: 8, marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <YambiText
                                        text={strings.free_plan_info}
                                        size="small"
                                        color="gray"
                                        style={{ lineHeight: 18 }}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default BusinessSubscriptionPlans;

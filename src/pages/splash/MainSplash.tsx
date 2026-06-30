import { View, Pressable, Linking, FlatList, Dimensions, Image, StyleSheet, ViewToken, Platform } from 'react-native';
import { strings } from '../../lang/lang';
import Animated, { FadeInDown, FadeInUp, SlideInLeft, SlideInRight, FadeOut, useAnimatedStyle, withSpring, useSharedValue, interpolate, Extrapolate, useAnimatedScrollHandler, interpolateColor, type SharedValue } from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import StatusBarYambi from '../../components/app/StatusBar';
import ButtonNormal from '../../components/app/ButtonNormal';
import { TextBigYambi, TextNormalYambi, TextNormalYambiGray, TextSmallYambiGray, TextSmallYambiHighColor } from '../../components/app/Text';
import { NavProps } from '../../types/types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { setShowModalApp } from '../../store/reducers/appSlice';
import ModalApp from '../../components/app/ModalApp';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// GoogleSignin.configure({
//     // webClientId: GOOGLE_WEB_CLIENT_ID,
//     // webClientId: "543007257309-bdlmj8v2m3ivgkhh3vurjuv94jqcgsss.apps.googleusercontent.com",
//     webClientId: '877779658910-spjvmknvchmu3d63o3tmv9v5p9bql6fd.apps.googleusercontent.com',
//     // iosClientId: GOOGLE_IOS_CLIENT_ID,
//     scopes: ['profile', 'email'],
//     offlineAccess: true,
// });

// const GoogleLogin = async () => {
//     // setSearching_email(true);
//     try {

//         await GoogleSignin.hasPlayServices();
//         const userInfo = await GoogleSignin.signIn();
//         // setuser(JSON.stringify(userInfo.user));
//         // setUser(JSON.stringify(userInfo.user));

//         // setEmail(userInfo.user.email);
//         // setUser_name(userInfo.user.name);

//         // // setTimeout(() => {
//         // //     fetch_user_data_email();
//         // // }, 1000);
//         // // setSearching_email(false);

//         // if (email && user_name) {
//         //     Alert.alert(strings.success, userInfo.user.name + "\n" + userInfo.user.email, [
//         //         // { text: strings.cancel },
//         //         {
//         //             text: strings.continue,
//         //             onPress: () => fetch_user_data_email()
//         //         }
//         //     ]);
//         // }
// console.log(userInfo);

//     } catch (err) {
//         // setSearching_email(false);
//         console.log(err);
//     }
// };

const { width, height } = Dimensions.get('window');

type OnboardingItem = {
    id: string;
    title: string;
    description: string;
};

const OnboardingItemComponent = ({ item, index, scrollX, app_theme, lang, go_signin }: { item: OnboardingItem; index: number; scrollX: SharedValue<number>; app_theme: any; lang: string; go_signin: () => void }) => {
    const itemAnimatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const translateX = interpolate(
            scrollX.value,
            inputRange,
            [width * 0.3, 0, -width * 0.3],
            Extrapolate.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.3, 1, 0.3],
            Extrapolate.CLAMP
        );

        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.85, 1, 0.85],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { translateX },
                { scale }
            ],
            opacity,
        } as any;
    });

    return (
        <View style={[styles.slide, { width }]}>
            <Animated.View style={[styles.slideContent, itemAnimatedStyle]}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    {/* <MaterialIcons name={item.icon} size={80} color={app_theme.colors.primary} /> */}
                </View>

                {/* Image */}
                <View style={styles.imageContainer}>
                    {index === 0 && (
                        <LottieView
                            source={require('./../../assets/Welcome.json')}
                            autoPlay
                            loop
                            style={styles.carouselImage}
                        />
                    )}

                    {index === 1 && (
                        <LottieView
                            source={require('./../../assets/Business.json')}
                            autoPlay
                            loop
                            style={styles.carouselImage}
                        />
                    )}

                    {index === 2 && (
                        <LottieView
                            source={require('./../../assets/Get_started.json')}
                            autoPlay
                            loop
                            style={styles.carouselImage}
                        />
                    )}
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <TextBigYambi text={item.title} bold styles={{ textAlign: 'center', marginBottom: 15 }} />
                    <TextNormalYambiGray text={item.description} styles={{ textAlign: 'center', paddingHorizontal: 30, lineHeight: 22 }} />
                </View>
            </Animated.View>



            {/* Bottom Section */}
            {index === 2 && (
                <View
                    style={[styles.bottomContainer, { borderTopWidth: 1, marginHorizontal: 20, borderColor: app_theme.colors.border, paddingTop: 15, marginTop: 10 }]}>
                    <View style={styles.privacyContainer}>
                        <TextSmallYambiGray text={strings.info_privacy_policy1 + " "} styles={{ textAlign: 'center' }} />
                        <Pressable onPress={() => {
                            if (lang === "fr" || lang === "sw_drc") {
                                Linking.openURL("https://yambi.net/legal/fr.html");
                            } else {
                                Linking.openURL("https://yambi.net/legal/en.html");
                            }
                        }}>
                            <TextSmallYambiHighColor text={strings.terms_use_text} styles={{ textAlign: 'center' }} />
                        </Pressable>
                    </View>

                    <View style={{ marginHorizontal: 50 }}>
                        <ButtonNormal
                            title={strings.get_started}
                            loadEnabled={true}
                            normal={true}
                            onPress={go_signin} />
                    </View>
                </View>
            )}
        </View>
    );
};

const SplashYambiStart = ({ navigation }: NavProps) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const lang = useAppSelector(state => state.persisted_app.langApp);
    const dispatch = useAppDispatch();
    const [showNeedAccessWelcomeMessage, setShowNeedAccessWelcomeMessage] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const go_signin = () => {
        navigation.navigate("Signup");
    }

    const onboardingData: OnboardingItem[] = [
        {
            id: '1',
            title: strings.onboarding_title_1,
            description: strings.onboarding_desc_1
        },
        {
            id: '2',
            title: strings.onboarding_title_2,
            description: strings.onboarding_desc_2
        },
        {
            id: '3',
            title: strings.onboarding_title_3,
            description: strings.onboarding_desc_3
        }
    ];

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
        } else {
            go_signin();
        }
    }

    const handleSkip = () => {
        go_signin();
    }

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    // useEffect(() => {
    //     set_theme();
    // }, [colorScheme]);

    useEffect(() => {

        if (Platform.OS === 'ios')
            return;

        const timeout = setTimeout(() => {
            dispatch(setShowModalApp(true));
            setShowNeedAccessWelcomeMessage(true);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [])

    const PageIndicator = ({ index, primaryColor, borderColor }: { index: number; primaryColor: string; borderColor: string }) => {
        const animatedStyle = useAnimatedStyle(() => {
            const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
            ];

            const widthOutput = interpolate(
                scrollX.value,
                inputRange,
                [8, 30, 8],
                Extrapolate.CLAMP
            );

            const opacityOutput = interpolate(
                scrollX.value,
                inputRange,
                [0.4, 1, 0.4],
                Extrapolate.CLAMP
            );

            const scaleOutput = interpolate(
                scrollX.value,
                inputRange,
                [0.8, 1, 0.8],
                Extrapolate.CLAMP
            );

            const backgroundColor = interpolateColor(
                scrollX.value,
                inputRange,
                [borderColor, primaryColor, borderColor]
            );

            return {
                width: widthOutput,
                opacity: opacityOutput,
                transform: [{ scale: scaleOutput }],
                backgroundColor: backgroundColor,
            };
        });

        return (
            <Animated.View
                style={[
                    styles.indicator,
                    animatedStyle
                ]}
            />
        );
    };

    const renderOnboardingItem = ({ item, index }: { item: OnboardingItem; index: number }) => {
        return (
            <OnboardingItemComponent
                item={item}
                index={index}
                scrollX={scrollX}
                app_theme={app_theme}
                lang={lang}
                go_signin={go_signin}
            />
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: app_theme.colors.background }}>
            <StatusBarYambi />

            {showNeedAccessWelcomeMessage && (
                <ModalApp
                    onAction={() => { dispatch(setShowModalApp(false)); setShowNeedAccessWelcomeMessage(false) }}
                    onClose={() => { dispatch(setShowModalApp(false)); setShowNeedAccessWelcomeMessage(false) }}
                    singleButton
                    close_button_color={app_theme.colors.high_color}
                    textAction={strings.accept}
                    textCancel={strings.accept_and_close}
                    title={strings.information}>
                    <TextNormalYambiGray text={strings.need_access_welcome_message} />
                </ModalApp>
            )}

            {/* Top Navigation Bar */}
            <Animated.View
                entering={FadeInDown.duration(300)}
                style={styles.topBar}>
                
                {currentIndex !== 2 ? (
                    <Animated.View
                        entering={SlideInLeft.duration(250)}
                        exiting={FadeOut.duration(200)}>
                    <Pressable
                    onPress={handleSkip}
                    style={styles.skipButton}>
                    <TextNormalYambi text={strings.skip} styles={{ color: app_theme.colors.primary }} />
                </Pressable>
                    </Animated.View>
                ) : (
                    <Animated.View
                        entering={FadeInUp.duration(200)}
                        exiting={SlideInLeft.duration(200)}
                        style={styles.skipButtonPlaceholder} />
                )}

                <View style={styles.topBarTrailing}>
                    <Pressable
                        onPress={() => navigation.navigate('Languages')}
                        style={styles.splashSecondaryIcon}
                        accessibilityRole="button"
                        accessibilityLabel="Languages">
                        <MaterialIcons name="language" size={22} color={app_theme.colors.text} />
                    </Pressable>
                    <Pressable
                        onPress={() => navigation.navigate('Themes')}
                        style={styles.splashSecondaryIcon}
                        accessibilityRole="button"
                        accessibilityLabel="Themes">
                        <Feather name="sun" size={20} color={app_theme.colors.text} />
                    </Pressable>
                    <Pressable
                        onPress={() => navigation.navigate('AboutYambi')}
                        style={styles.splashSecondaryIcon}
                        accessibilityRole="button"
                        accessibilityLabel="About">
                        <Feather name="info" size={20} color={app_theme.colors.text} />
                    </Pressable>
                    {currentIndex < onboardingData.length - 1 ? (
                        <Animated.View
                            entering={SlideInRight.duration(250)}
                            exiting={FadeOut.duration(200)}>
                            <Pressable
                                onPress={handleNext}
                                style={[styles.navButtonTop, { backgroundColor: app_theme.colors.design_tip2 }]}>
                                <Feather name="arrow-right" size={20} color={app_theme.colors.text_design2} />
                            </Pressable>
                        </Animated.View>
                    ) : null}
                </View>
            </Animated.View>

            {/* Logo */}
            <Animated.View
                entering={FadeInDown.delay(100).duration(300)}
                style={styles.logoContainer}>
                <Animated.Image
                    sharedTransitionTag='okImage'
                    source={require('./../../assets/logo.png')}
                    style={styles.logo}
                />
                <TextBigYambi text="Yambi" bold styles={{ textAlign: 'center', marginTop: 10 }} />
            </Animated.View>

            {/* FlatList Carousel */}
            <Animated.FlatList
                ref={flatListRef}
                data={onboardingData}
                renderItem={renderOnboardingItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                style={{ flex: 1 }}
            />

            {/* Page Indicators */}
            <Animated.View
                entering={FadeInUp.delay(200).duration(300)}
                style={styles.indicatorContainer}>
                {onboardingData.map((_, index) => (
                    <PageIndicator 
                        key={index} 
                        index={index} 
                        primaryColor={app_theme.colors.design_tip2}
                        borderColor={app_theme.colors.gray}
                    />
                ))}
            </Animated.View>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        minHeight: 64,
        height: 64,
    },
    skipButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        minHeight: 44,
        justifyContent: 'center',
    },
    skipButtonPlaceholder: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        minHeight: 44,
        width: 80,
    },
    navButtonTop: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    topBarTrailing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    splashSecondaryIcon: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 0,
    },
    logo: {
        width: 70,
        height: 70,
    },
    slide: {
        width: width,
        flex: 1,
    },
    slideContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        marginBottom: 0,
    },
    imageContainer: {
        width: width * 0.7,
        height: height * 0.25,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 0,
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        paddingHorizontal: 20,
        marginTop: 30,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    bottomContainer: {
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    privacyContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
});

export default SplashYambiStart;

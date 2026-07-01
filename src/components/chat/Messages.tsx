import { View, Text, Pressable, Vibration, } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useRealm } from '@realm/react';
import { UsersMessages } from '../../store/database/Models';
import { TMessage } from '../../types/types';
import Animated, { FadeIn, FadeInDown, FadeInUp, } from 'react-native-reanimated';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAppDispatch, useAppSelector, } from '../../store/app/hooks';
import { setMessageSelected } from '../../store/reducers/appSlice';
import { strings } from '../../lang/lang';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MessagesList from '../lists/messages/MessagesList';
import { displayDate, SocketApp } from '../../../GlobalVariables';
import { IconApp } from '../app/IconApp';
import { LegendList } from '@legendapp/list';
import moment from 'moment';
const Messages = ({ user, highlightMessageToken }: { user: string; highlightMessageToken?: string }) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const user_data = useAppSelector(state => state.user_data);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const lang = useAppSelector(state => state.persisted_app.langApp);
    const dispatch = useAppDispatch();

    const flashListRef = useRef<any>(null);
    const isProgrammaticScrollRef = useRef(false);
    const [stickyDate, setStickyDate] = useState('');
    const [showJumpToBottom, setShowJumpToBottom] = useState(false);
    const realm = useRealm();

    /**
     * REALM QUERY
     */

    const messages = useQuery(
        UsersMessages,
        msgs => {
            return msgs
                .filtered(
                    '(receiver == $0 && sender == $1) || (sender == $2 && receiver == $3)',
                    user,
                    user_data.phone_number,
                    user,
                    user_data.phone_number
                )
                .sorted('alignment', false);
        },
        [user, user_data.phone_number]
    );

    const setChatRead = () => {

        const rawMessages = messages.filter(m => m.receiver === user_data.phone_number && m.message_read < 3);

        if (rawMessages.length === 0) {
            return;
        }

        try {
            realm.write(() => {
                rawMessages.forEach(msg => {
                    const msgg: TMessage = {
                        sender: msg.sender,
                        receiver: msg.receiver,
                        main_text_message: msg.main_text_message,
                        caption: msg.caption,
                        message_type: msg.message_type,
                        response_to: msg.response_to,
                        message_read: 3,
                        flag: msg.flag,
                        message_effect: msg.message_effect,
                        reactions: msg.reactions,
                        token: msg.token,
                        platform: msg.platform,
                        deleted: msg.deleted,
                        read_once: msg.read_once,
                        alignment: msg.createdAt,
                        createdAt: msg.createdAt,
                        receivedAt: msg.receivedAt,
                        playedAt: msg.playedAt,
                        readAt: moment().format(),
                        cc: msg.cc
                    }

                    realm.create("UsersMessages", msgg, true);
                });
            })
        } catch (error) {

        }

        setTimeout(() => {
            if (rawMessages.length > 0) {
                // console.log(rawMessages.length + " "+user_data.phone_number)
                SocketApp.emit("messagesRead", rawMessages);
            }
        }, 500);
    }

    useEffect(() => {
        setChatRead();
    }, [messages, user_data.phone_number]);

    useEffect(() => {
        if (highlightMessageToken) {
            dispatch(setMessageSelected(highlightMessageToken));
            setTimeout(() => {
                scrollToMessage(highlightMessageToken);
            }, 400);
        }
    }, [highlightMessageToken, scrollToMessage, dispatch]);

    /**
     * ARRAY
     */

    const mm = useMemo(() => {
        return [...messages];
    }, [messages]);



    /**
     * STICKY DATE
     */

    const updateStickyDate = useCallback(
        ({ viewableItems }) => {

            if (!viewableItems?.length) {
                return;
            }

            const item = viewableItems[0];

            if (item?.item?.cc) {
                setStickyDate(item.item.cc);
            }

        },
        []
    );

    /**
     * SELECT MESSAGE
     */

    const setMS = useCallback((token: string) => {
        Vibration.vibrate(20);
        dispatch(setMessageSelected(token));
    }, []);

    /**
     * SCROLL TO SPECIFIC MESSAGE
     */

    const scrollToMessage = useCallback(
        (messageToken: string) => {

            const index = mm.findIndex(
                (msg: TMessage) =>
                    msg.token === messageToken
            );

            if (index === -1) {
                return;
            }

            if (!flashListRef.current) {
                return;
            }

            isProgrammaticScrollRef.current = true;

            try {

                flashListRef.current.scrollToIndex({
                    index,
                    animated: true,
                    viewPosition: 0.5,
                });

            } catch (error) {

                // console.log(error);

            }

            setTimeout(() => {
                isProgrammaticScrollRef.current = false;
            }, 500);

        },
        [mm]
    );

    /**
     * JUMP TO BOTTOM
     */

    const jumpToBottom = useCallback(() => {

        if (!flashListRef.current) {
            return;
        }

        isProgrammaticScrollRef.current = true;

        setShowJumpToBottom(false);

        flashListRef.current.scrollToEnd({
            animated: true,
        });

        setTimeout(() => {
            isProgrammaticScrollRef.current = false;
        }, 400);

    }, []);

    /**
     * HANDLE SCROLL
     */

    const handleScroll = useCallback((event: any) => {

        if (isProgrammaticScrollRef.current) {
            return;
        }

        const offsetY = event.nativeEvent.contentOffset?.y ?? 0;

        const contentHeight = event.nativeEvent.contentSize?.height ?? 0;

        const layoutHeight = event.nativeEvent.layoutMeasurement?.height ?? 0;

        /**
         * DEBUG
         */

        // console.log({
        //     offsetY,
        //     contentHeight,
        //     layoutHeight,
        // });

        /**
         * YOUR DEVICE:
         * bottom = max offset
         */

        const maxOffset = contentHeight - layoutHeight;
        const isAtBottom = offsetY >= maxOffset - 50;

        setShowJumpToBottom(!isAtBottom);

    }, []);

    /**
     * HEADER
     */

    const HeaderMessages = useCallback(() => {

        return (

            <Animated.View
                entering={FadeIn.duration(400)}
            >

                <Animated.View
                    entering={FadeInUp.delay(400)}
                >

                    <Pressable
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            marginHorizontal: 20,
                            borderColor:
                                app_theme.colors.border,
                            backgroundColor:
                                app_theme.colors.background,
                            borderWidth: 1,
                            borderRadius: 16,
                            marginTop: 40,
                            marginBottom: 25,
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 0,
                                height: 1,
                            },
                            shadowOpacity: 0.08,
                            shadowRadius: 3,
                            elevation: 2,
                        }}
                    >
                        <Text
                            style={{
                                paddingVertical: 4,
                                fontSize:
                                    app_description.small_general_font_size,
                                textAlign: 'center',
                                color:
                                    app_theme.colors.high_color,
                                lineHeight: 18,
                            }}
                        >
                            <FontAwesome
                                name='lock'
                                size={
                                    app_description.small_general_font_size
                                }
                            />
                            <Text> </Text>

                            {
                                strings.inbox_encrypt_message_1
                            }

                            {
                                strings.inbox_encrypt_message_2
                            }
                        </Text>
                    </Pressable>
                </Animated.View>
            </Animated.View>
        );
    }, []);

    return (

        <GestureHandlerRootView
            style={{ flex: 1 }}
        >
            <View
                style={{
                    flex: 1,
                }}
            >
                <LegendList
                    ref={flashListRef}
                    data={mm}
                    alignItemsAtEnd
                    initialScrollIndex={mm.length > 0 ? mm.length - 1 : undefined}
                    maintainScrollAtEnd
                    recycleItems
                    estimatedItemSize={40}
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item.token}
                    scrollEventThrottle={16}
                    onScroll={handleScroll}
                    onViewableItemsChanged={
                        updateStickyDate
                    }
                    ListHeaderComponent={
                        HeaderMessages
                    }
                    renderItem={({
                        item,
                        index,
                    }: {
                        item: TMessage;
                        index: number;
                    }) => (

                        <MessagesList
                            item={item}
                            index={index}
                            messages={messages}
                            selectMessage={setMS}
                            user={user}
                            scrollToMessage={
                                scrollToMessage
                            }
                        />
                    )}
                />
                {
                    stickyDate !== '' && (

                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                justifyContent: 'center',
                            }}
                        >
                            <Animated.View
                                entering={
                                    FadeInUp
                                        .delay(200)
                                        .springify()
                                }
                            >
                                <View
                                    style={{
                                        alignSelf: 'center',
                                        paddingVertical: 5,
                                        paddingHorizontal: 16,
                                        marginTop: 8,
                                        borderRadius: 16,
                                        backgroundColor:
                                            app_theme.colors.background,
                                        borderWidth: 1,
                                        borderColor:
                                            app_theme.colors.border,
                                        shadowColor: '#000',
                                        shadowOffset: {
                                            width: 0,
                                            height: 2,
                                        },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 3,
                                        elevation: 3,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize:
                                                app_description.small_general_font_size,
                                            fontWeight: '700',
                                            color:
                                                app_theme.colors.text,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {
                                            displayDate(
                                                stickyDate,
                                                lang
                                            )
                                        }
                                    </Text>
                                </View>
                            </Animated.View>
                        </View>

                    )
                }
                {
                    showJumpToBottom && (

                        <Animated.View
                            entering={
                                FadeIn.duration(200)
                            }
                            exiting={
                                FadeInDown.duration(200)
                            }
                            style={{
                                position: 'absolute',
                                bottom: 20,
                                right: 20,
                                zIndex: 10,
                            }}
                        >
                            <Pressable
                                onPress={
                                    jumpToBottom
                                }
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor:
                                        app_theme.colors.background,
                                    justifyContent:
                                        'center',
                                    alignItems:
                                        'center',
                                    elevation: 4,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 4,
                                }}
                            >
                                <IconApp
                                    pack='FI'
                                    name='chevrons-down'
                                    size={24}
                                    color={
                                        app_theme.colors.text
                                    }
                                />
                            </Pressable>
                        </Animated.View>
                    )
                }
            </View>
        </GestureHandlerRootView>
    );
};

export default Messages;
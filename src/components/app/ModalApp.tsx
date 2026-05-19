import { View, Modal, Pressable, useWindowDimensions, TouchableWithoutFeedback, ScrollView } from "react-native"
import React, { ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { setShowModalApp } from "../../store/reducers/appSlice";
import { strings } from "../../lang/lang";
import { YambiText } from "./Text";

export interface IModalApp {
    title: string;
    description?: string;
    textAction?: string;
    textCancel?: string;
    singleButton: boolean;
    paddings?: boolean;
    children: ReactNode;
    onAction?: () => void;
    onCancel?: () => void;
    onClose: () => void;
    close_button_color?: string;
}

const ModalApp: React.FC<IModalApp> = ({ title, textAction, textCancel, singleButton, onAction, onClose, children, paddings, close_button_color }) => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const modal_app = useAppSelector(state => state.app.modal_app);
    const modal_height = useWindowDimensions().height;
    const dispatch = useAppDispatch();

    const handleClose = () => {
        onClose();
        dispatch(setShowModalApp(false));
    };

    if (modal_app) {
        return (
            <Modal
                onRequestClose={handleClose}
                animationType="fade"
                statusBarTranslucent={true}
                hardwareAccelerated={true}
                transparent={true}>
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <TouchableWithoutFeedback onPress={handleClose}>
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                        }} />
                    </TouchableWithoutFeedback>
                    
                    <View style={{
                        backgroundColor: theme.modal_background,
                        borderRadius: 10,
                        width: 300,
                        maxHeight: modal_height - 150,
                        overflow: 'hidden'
                    }}>
                        <View style={{
                            paddingVertical: 15,
                            borderBottomWidth: 1,
                            borderColor: theme.border
                        }}>
                            <YambiText text={title} size="normal" color="default" bold style={{ textAlign: 'center' }} />
                        </View>
                        
                        <ScrollView
                            style={{
                                maxHeight: 400,
                                width: "100%",
                            }}
                            contentContainerStyle={{
                                paddingHorizontal: paddings === false ? 0 : 15,
                                paddingVertical: paddings === false ? 0 : 15,
                                paddingBottom: paddings === false ? 0 : 20,
                            }}
                            showsVerticalScrollIndicator={true}
                        >
                            {children}
                        </ScrollView>
                        
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            {!singleButton ?
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%'
                                }}>
                                    <Pressable
                                        style={{
                                            flex: 1,
                                            height: 45,
                                            justifyContent: "center",
                                            alignItems: 'center',
                                            borderTopWidth: 1,
                                            borderColor: theme.border
                                        }}
                                        onPress={handleClose}>
                                        <YambiText
                                            text={textCancel ? textCancel.toUpperCase() : strings.close.toUpperCase()}
                                            size="small"
                                            color="error"
                                            style={{ color: close_button_color || theme.error }}
                                        />
                                    </Pressable>
                                    <Pressable
                                        style={{
                                            flex: 1,
                                            height: 45,
                                            justifyContent: "center",
                                            alignItems: 'center',
                                            borderTopWidth: 1,
                                            borderColor: theme.border
                                        }}
                                        onPress={onAction}>
                                        <YambiText text={textAction ? textAction.toUpperCase() : ""} size="small" color="default" bold />
                                    </Pressable>
                                </View>
                                :
                                <Pressable
                                    style={{
                                        flex: 1,
                                        height: 45,
                                        justifyContent: "center",
                                        alignItems: 'center',
                                        borderTopWidth: 1,
                                        borderColor: theme.border
                                    }}
                                    onPress={handleClose}>
                                    <YambiText
                                        text={textCancel ? textCancel.toUpperCase() : strings.close.toUpperCase()}
                                        size="small"
                                        color="error"
                                        style={{ color: close_button_color || theme.error }}
                                    />
                                </Pressable>}
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }
}

export default ModalApp;

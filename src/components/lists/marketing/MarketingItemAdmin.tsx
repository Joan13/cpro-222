import { View, Pressable } from "react-native";
import { TMarketing } from "../../../types/types";
import { useAppDispatch, useAppSelector } from "../../../store/app/hooks";
import { memo, useState } from 'react';
import { IconApp } from "../../app/IconApp";
import FastImage from "react-native-fast-image";
import { remote_host_server, media_url } from "../../../../GlobalVariables";
import { TextNormalYambi, TextSmallYambi, TextSmallYambiGray } from "../../app/Text";
import ModalApp from "../../app/ModalApp";
import { setShowModalApp } from "../../../store/reducers/appSlice";
import { strings } from "../../../lang/lang";

const MarketingItemAdmin = ({
    item,
    index,
    onPress,
    onEdit
}: {
    item: TMarketing,
    onPress: () => void,
    onEdit: () => void,
    index: number
}) => {
    const app_theme = useAppSelector(state => state.app_theme);
    const dispatch = useAppDispatch();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    return (
        <View
            style={{
                backgroundColor: app_theme.colors.background,
                borderRadius: 12,
                marginVertical: 8,
                padding: 12,
                shadowColor: app_theme.colors.border,
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 3,
                borderWidth: 1,
                borderColor: app_theme.colors.border,
            }}>
            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <ModalApp
                    title={strings.delete}
                    singleButton={false}
                    textCancel={strings.cancel}
                    textAction={strings.delete}
                    onAction={() => { onPress(); setShowDeleteModal(false); dispatch(setShowModalApp(false)); }}
                    onClose={() => { setShowDeleteModal(false); }}
                >
                    <View>
                        <TextSmallYambiGray text={strings.delete_marketing_item_text || strings.delete_item_text} />
                        <TextSmallYambiGray text={strings.delete_irreversible} styles={{ marginTop: 8 }} />
                    </View>
                </ModalApp>
            )}

            <View style={{ flexDirection: "row", alignItems: "center" }}>
                {item.image ? (
                    <FastImage
                        style={{ height: 60, width: 60, marginRight: 12, borderRadius: 8 }}
                        resizeMode={FastImage.resizeMode.cover}
                        source={{
                            priority: FastImage.priority.high,
                            cache: 'immutable',
                            uri: media_url + "/marketing_images/" + item.image
                        }}
                    />
                ) : (
                    <View style={{
                        width: 60, height: 60, borderRadius: 8, marginRight: 12,
                        backgroundColor: app_theme.colors.border, alignItems: "center", justifyContent: "center"
                    }}>
                        <IconApp pack="FI" name="image" size={16} color={app_theme.colors.gray} />
                        <TextSmallYambiGray text={strings.no_picture} />
                    </View>
                )}

                <View style={{ flex: 1 }}>
                    <TextNormalYambi text={item.pub_title} bold styles={{ marginBottom: 2 }} />
                    <TextSmallYambi text={item.pub_description} numberLines={2} />
                    {item.valid_until ? (
                        <TextSmallYambiGray text={`${strings.valid_until || strings.discount_end_date}: ${item.valid_until}`} styles={{ marginTop: 2 }} />
                    ) : null}
                </View>

                <Pressable onPress={onEdit} style={{ marginLeft: 10, height: 35, width: 35, backgroundColor: app_theme.colors.high_color + "15", justifyContent: 'center', alignItems: 'center', borderRadius: 30 }}>
                    <IconApp pack="FI" name="edit" size={15} color={app_theme.colors.high_color} />
                </Pressable>
                <Pressable onPress={() => { setShowDeleteModal(true); dispatch(setShowModalApp(true)); }} style={{ marginLeft: 10, height: 35, width: 35, backgroundColor: app_theme.colors.error + "15", justifyContent: 'center', alignItems: 'center', borderRadius: 30 }}>
                    <IconApp pack="MC" name="delete" size={15} color={app_theme.colors.error} />
                </Pressable>
            </View>
        </View>
    );
}

export default memo(MarketingItemAdmin);

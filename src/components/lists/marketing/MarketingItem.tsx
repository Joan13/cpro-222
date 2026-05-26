import { View, Pressable, Dimensions } from "react-native";
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
import { Text } from "@shopify/react-native-skia";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MARKETING_IMAGE_HEIGHT = (SCREEN_WIDTH * 3) / 4;

const MarketingItem = ({
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
                shadowColor: app_theme.colors.border,
                height: MARKETING_IMAGE_HEIGHT,
                borderColor: app_theme.colors.border,
            }}>
            <FastImage
                style={{
                    width: SCREEN_WIDTH,
                    height: MARKETING_IMAGE_HEIGHT
                }}
                // resizeMode={FastImage.resizeMode.contain}
                source={{
                    priority: FastImage.priority.high,
                    cache: 'immutable',
                    uri: media_url + "/marketing_images/" + item.image
                }} />
        </View>
    );
}

export default memo(MarketingItem);

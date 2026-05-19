import { View, Pressable, Image } from "react-native";
import { YambiText } from "../../app/Text";
import FastImage from 'react-native-fast-image';
import { remote_host_server, media_url } from "../../../../GlobalVariables";
import * as RootNavigation from '../../../services/Navigation_ref';
import moment from "moment";

interface CommentItemProps {
    comment: any;
    theme: any;
    size?: 'small' | 'normal';
    showFullText?: boolean;
}

const CommentItem = ({ comment, size = 'normal', showFullText = true }: CommentItemProps) => {
    const isSmall = size === 'small';
    const profileSize = isSmall ? 28 : 40;
    const borderRadius = profileSize / 2;
    const fontSize = isSmall ? 12 : 14;
    const nameFontSize = isSmall ? 12 : 14;
    const timeFontSize = isSmall ? 10 : 12;

    return (
        <Pressable style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 }}>
            {/* User Profile Picture */}
            <Pressable
                onPress={() => {
                    if (comment.user_profile) {
                        RootNavigation.navigate("ViewPhoto", { 
                            source: media_url + "/profile_pictures/" + comment.user_profile,
                            title: comment.user_name
                        });
                    }
                }}
                style={{ marginRight: isSmall ? 8 : 10 }}
            >
                {comment.user_profile ? (
                    <FastImage
                        style={{ width: profileSize, height: profileSize, borderRadius: borderRadius }}
                        resizeMode={FastImage.resizeMode.cover}
                        source={{
                            priority: FastImage.priority.normal,
                            cache: 'immutable',
                            uri: media_url + "/profile_pictures/" + comment.user_profile
                        }}
                    />
                ) : (
                    <Image
                        source={require('../../../assets/profile_black.jpg')}
                        style={{
                            width: profileSize,
                            height: profileSize,
                            borderRadius: borderRadius,
                        }}
                        resizeMode="cover"
                    />
                )}
            </Pressable>
            
            {/* Comment Content */}
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isSmall ? 2 : 4 }}>
                    <YambiText 
                        text={comment.user_name || comment.phone_number || ""} 
                        size={isSmall ? "small" : "normal"} 
                        color="default" 
                        bold
                        style={{ fontSize: nameFontSize, marginRight: isSmall ? 6 : 8, flex: 1 }} 
                    />
                    <YambiText 
                        text={moment(comment.createdAt).format('MMM DD, HH:mm')} 
                        size="small" 
                        color="gray" 
                        style={{ fontSize: timeFontSize }} 
                    />
                </View>
                <YambiText 
                    text={comment.comment_text || ""} 
                    size={isSmall ? "small" : "normal"} 
                    color="default" 
                    numberLines={showFullText ? undefined : 2}
                    style={{ fontSize: fontSize, lineHeight: isSmall ? 16 : 20 }} 
                />
            </View>
        </Pressable>
    );
};

export default CommentItem;

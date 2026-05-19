import { View, Pressable } from "react-native";
import { YambiText } from "../../app/Text";
import { IconApp } from "../../app/IconApp";
import FastImage from 'react-native-fast-image';
import { remote_host_server, media_url } from "../../../../GlobalVariables";
import * as RootNavigation from '../../../services/Navigation_ref';
import moment from "moment";
import { memo } from "react";

interface ReactionItemProps {
    reaction: any;
    theme: any;
}

const ReactionItem = ({ reaction, theme }: ReactionItemProps) => {
    return (
        <View style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10
        }}>
            {/* User Profile Picture */}
            <Pressable
                onPress={() => {
                    if (reaction.user_profile) {
                        RootNavigation.navigate("ViewPhoto", { 
                            source: media_url + "/profile_pictures/" + reaction.user_profile,
                            title: reaction.user_name
                        });
                    }
                }}
                style={{ marginRight: 12 }}
            >
                {reaction.user_profile ? (
                    <FastImage
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        resizeMode={FastImage.resizeMode.cover}
                        source={{
                            priority: FastImage.priority.normal,
                            cache: 'immutable',
                            uri: media_url + "/profile_pictures/" + reaction.user_profile
                        }}
                    />
                ) : (
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <IconApp pack="FI" name="user" size={20} color={theme.gray} />
                    </View>
                )}
            </Pressable>
            
            {/* User Name */}
            <View style={{ flex: 1 }}>
                <YambiText 
                    text={reaction.user_name || reaction.phone_number || ""} 
                    size="normal" 
                    color="default" 
                    bold
                    style={{ fontSize: 14 }} 
                />
                <YambiText 
                    text={moment(reaction.createdAt).format('MMM DD, YYYY [at] HH:mm')} 
                    size="small" 
                    color="gray" 
                    style={{ fontSize: 12, marginTop: 2 }} 
                />
            </View>
            
            {/* Like Icon */}
            <IconApp 
                pack="OC" 
                name="heart-fill" 
                size={20} 
                color="#FF0000" 
            />
        </View>
    );
};

export default memo(ReactionItem);

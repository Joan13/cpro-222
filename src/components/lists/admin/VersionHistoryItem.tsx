import React from 'react';
import { View, Pressable } from 'react-native';
import { useAppSelector } from '../../../store/app/hooks';
import { TextNormalYambi, TextSmallYambiGray } from '../../app/Text';
import { IconApp } from '../../app/IconApp';
import { renderDateTime } from '../../../../GlobalVariables';
import { strings } from '../../../lang/lang';
import { TAppData } from '../../../types/types';

interface VersionHistoryItemProps {
    version: TAppData;
    isLatest: boolean;
}

export default function VersionHistoryItem({ version, isLatest }: VersionHistoryItemProps) {
    const app_theme = useAppSelector(state => state.app_theme);

    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 12,
                backgroundColor: isLatest ? app_theme.colors.high_color + '15' : app_theme.colors.border,
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: isLatest ? 1.5 : 1,
                borderColor: isLatest ? app_theme.colors.high_color : app_theme.colors.border,
            }}
        >
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <TextNormalYambi 
                        text={`${version.app_version_name || ''}`} 
                        bold={isLatest}
                        styles={{ marginRight: 8 }}
                    />
                    {isLatest && (
                        <View style={{
                            backgroundColor: app_theme.colors.high_color,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                        }}>
                            <TextSmallYambiGray 
                                text={strings.latest}
                            />
                        </View>
                    )}
                </View>
                <TextSmallYambiGray 
                    text={`${strings.version} Code: ${version.app_version_code || ''}`} 
                    styles={{ marginBottom: 2 }}
                />
                {version.createdAt && (
                    <TextSmallYambiGray 
                        text={renderDateTime(version.createdAt, 3, true)} 
                        styles={{ fontSize: 11 }}
                    />
                )}
            </View>
            <IconApp 
                pack="FA" 
                name={isLatest ? "check-circle" : "circle"} 
                color={isLatest ? app_theme.colors.high_color : app_theme.colors.gray} 
                size={20} 
            />
        </View>
    );
}

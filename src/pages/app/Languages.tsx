/* eslint-disable prettier/prettier */
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import { changeLanguage, strings } from '../../lang/lang';
import { setLanguageApp } from '../../store/reducers/persistedAppSlice';
import StatusBarYambi from '../../components/app/StatusBar';
import RNRestart from 'react-native-restart';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LanguageOption {
    code: string;
    nameKey: string;
    flag: any;
}

const Languages = () => {
    const theme = useAppSelector(state => state.app_theme.colors);
    const dispatch = useAppDispatch();
    const currentLanguage = useAppSelector(state => state.persisted_app.langApp);

    const languages: LanguageOption[] = [
        { code: 'en', nameKey: 'english', flag: require("./../../assets/england_flag.png") },
        { code: 'fr', nameKey: 'french', flag: require("./../../assets/france_flag.jpg") },
        { code: 'sw_drc', nameKey: 'swahili', flag: require("./../../assets/drc_flag.jpg") },
    ];

    const changeLanguageApp = (langKey: string) => {
        changeLanguage(langKey);
        dispatch(setLanguageApp(langKey));

        setTimeout(() => {
            RNRestart.restart();
        }, 120);
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, borderColor: theme.border, borderTopWidth: 1 }}>
            <StatusBarYambi />
            
            <View style={{ flex: 1 }}>
                {/*<View style={{ 
                    paddingHorizontal: 20, 
                    paddingVertical: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border
                }}>
                    <Text style={{ 
                        color: theme.text, 
                        fontSize: 24, 
                        fontWeight: 'bold' 
                    }}>
                        {strings.select_language || 'Select Language'}
                    </Text>
                    <Text style={{ 
                        color: theme.gray, 
                        fontSize: 14, 
                        marginTop: 4 
                    }}>
                        Choose your preferred language
                    </Text>
                </View>

                {/* Language List */}
                <View style={{ flex: 1 }}>
                    {languages.map((lang, index) => {
                        const isSelected = currentLanguage === lang.code;
                        
                        return (
                            <Pressable
                                key={lang.code}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 20,
                                    paddingHorizontal: 20,
                                    backgroundColor: isSelected ? theme.high_color + '15' : 'transparent',
                                    borderBottomWidth: index < languages.length - 1 ? 1 : 0,
                                    borderBottomColor: theme.border,
                                }}
                                onPress={() => changeLanguageApp(lang.code)}
                            >
                                {/* Flag */}
                                <View style={{ marginRight: 16 }}>
                                    <Image 
                                        source={lang.flag} 
                                        style={{ 
                                            width: 36, 
                                            height: 24, 
                                            borderRadius: 4,
                                            borderWidth: 0.5,
                                            borderColor: theme.border
                                        }} 
                                        resizeMode="cover"
                                    />
                                </View>
                                
                                {/* Language Name */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ 
                                        color: theme.text, 
                                        fontSize: 17,
                                        fontWeight: isSelected ? '600' : '400'
                                    }}>
                                        {strings[lang.nameKey]}
                                    </Text>
                                </View>

                                {/* Selection Indicator */}
                                {isSelected ? (
                                    <View style={{ 
                                        width: 24, 
                                        height: 24, 
                                        borderRadius: 12,
                                        backgroundColor: theme.high_color,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginLeft: 12
                                    }}>
                                        <Feather name="check" size={16} color="#FFFFFF" />
                                    </View>
                                ) : (
                                    <Feather 
                                        name="chevron-right" 
                                        size={20} 
                                        color={theme.gray} 
                                        style={{ marginLeft: 12 }}
                                    />
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

export default Languages;

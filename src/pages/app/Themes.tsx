import React from 'react';
import { DefaultTheme } from '@react-navigation/native';
import { View, Pressable, ScrollView, Dimensions, Text, Platform } from 'react-native';
import { strings } from '../../lang/lang';
// import { setRootViewBackgroundColor } from '@pnthach95/react-native-root-view-background';
import { TTheme } from '../../types/types';
import { useAppDispatch, useAppSelector } from '../../store/app/hooks';
import StatusBarYambi from '../../components/app/StatusBar';
import { setTheme } from '../../store/reducers/themeSlice';
import { setThemeSet } from '../../store/reducers/persistedAppSlice';
import { TextBigYambi } from '../../components/app/Text';
import { IconApp } from '../../components/app/IconApp';

// ============================================================================
// BASE THEMES - Well-harmonized color palettes
// ============================================================================

// Base Theme 1: Default (Maroon/Burgundy)
const defaultTheme: TTheme = {
    name: 'default',
    dark: false,
    statusbar: 'light',
    colors: {
        primary: '#780006',
        background: '#FFFFFF',
        card: '#FFFFFF',
        success: '#008000',
        text: '#000000',
        error: '#FF0000',
        border: '#e6e6e6',
        like_border: '#0000000D',
        other: '#FFFFFF',
        notification: '#780006',
        gray: '#808080',
        high_color: '#780006',
        primary_high_color: '#FFA726',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#e67300',
        high_color3: '#ac3973',
        chat_sent: '#FFEBEB',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#000000',
        chat_received_foreground: '#000000',
        header_background_color: '#780006',
        button_background_color: '#780006',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#780006',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#000000',
        bottom_navigation_active: '#000000',
        bottom_navigation_inactive: '#808080',
        modal_background: '#FFFFFF',
        certified_badge: '#1DA1F2'
    },
};

// Base Theme 2: White (Clean/Minimal)
const whiteTheme: TTheme = {
    name: 'white',
    dark: false,
    statusbar: 'dark',
    colors: {
        primary: '#FFFFFF',
        background: '#FFFFFF',
        success: '#008000',
        card: '#FFFFFF',
        text: '#000000',
        error: '#FF0000',
        border: '#e6e6e6',
        like_border: '#0000000D',
        other: '#FFFFFF',
        notification: '#780006',
        gray: '#808080',
        high_color: '#0050b4',
        primary_high_color: '#0050b4',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#e67300',
        high_color3: '#ac3973',
        chat_sent: '#FFEBEB',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#000000',
        chat_received_foreground: '#000000',
        header_background_color: '#FFFFFF',
        button_background_color: '#0050b4',
        header_foreground_color: '#000000',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#0050b4',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#000000',
        bottom_navigation_active: '#000000',
        bottom_navigation_inactive: '#808080',
        modal_background: '#FFFFFF',
        certified_badge: '#0095F6'
    },
};

// Base Theme 3: Dark (Warm Dark)
const darkTheme: TTheme = {
    name: 'dark',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#780006',
        background: '#272525',
        card: '#110E0E',
        success: '#008000',
        text: '#FFFFFF',
        error: '#FF0000',
        border: '#323232',
        like_border: '#FFFFFF0D',
        other: '#FFFFFF',
        notification: '#FFFFFF',
        gray: '#808080',
        high_color: '#08a0cf',
        primary_high_color: '#08a0cf',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#ffa31a',
        high_color3: '#ac3973',
        chat_sent: '#321E1E',
        chat_received: '#171414',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#201515',
        button_background_color: '#FFFFFF',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#780006',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#00B4C8',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#272525',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#FFFFFF',
        bottom_navigation_inactive: '#808080',
        modal_background: '#272525',
        certified_badge: '#1DA1F2'
    },
};

// Base Theme 4: Black (Pure Dark)
const blackTheme: TTheme = {
    name: 'black',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#000000',
        background: '#000000',
        card: '#000000',
        success: '#008000',
        text: '#FFFFFF',
        error: '#FF0000',
        border: '#323232',
        like_border: '#FFFFFF0D',
        other: '#FFFFFF',
        notification: '#FFFFFF',
        gray: '#808080',
        high_color: '#08a0cf',
        primary_high_color: '#08a0cf',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#ffa31a',
        high_color3: '#ac3973',
        chat_sent: '#321E1E',
        chat_received: '#000000',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#000000',
        button_background_color: '#FFFFFF',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#780006',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#00B4C8',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#000000',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#FFFFFF',
        bottom_navigation_inactive: '#808080',
        modal_background: '#272525',
        certified_badge: '#1DA1F2'
    },
};

// ============================================================================
// LIGHT THEME VARIATIONS - Based on base themes
// ============================================================================

// Blue Light Theme
const blueLightTheme: TTheme = {
    name: 'blue-light',
    dark: false,
    statusbar: 'light',
    colors: {
        primary: '#1976D2',
        background: '#FFFFFF',
        card: '#F5F7FA',
        success: '#2E7D32',
        text: '#1A1A1A',
        error: '#C62828',
        border: '#E3F2FD',
        like_border: '#1976D214',
        other: '#FFFFFF',
        notification: '#1976D2',
        gray: '#757575',
        high_color: '#1976D2',
        primary_high_color: '#FFB300',
        primary_high_color_foreground: '#1A1A1A',
        high_color2: '#FF6F00',
        high_color3: '#7B1FA2',
        chat_sent: '#E3F2FD',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#1A1A1A',
        chat_received_foreground: '#1A1A1A',
        header_background_color: '#1976D2',
        button_background_color: '#1976D2',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C62828',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#1976D2',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#424242',
        bottom_navigation_active: '#1976D2',
        bottom_navigation_inactive: '#9E9E9E',
        modal_background: '#FFFFFF',
        certified_badge: '#1976D2'
    },
};

// Green Light Theme
const greenLightTheme: TTheme = {
    name: 'green-light',
    dark: false,
    statusbar: 'light',
    colors: {
        primary: '#2E7D32',
        background: '#FFFFFF',
        card: '#F1F8F4',
        success: '#2E7D32',
        text: '#1A1A1A',
        error: '#C62828',
        border: '#E8F5E9',
        like_border: '#2E7D3214',
        other: '#FFFFFF',
        notification: '#2E7D32',
        gray: '#757575',
        high_color: '#2E7D32',
        primary_high_color: '#FFC107',
        primary_high_color_foreground: '#1A1A1A',
        high_color2: '#F57C00',
        high_color3: '#6A1B9A',
        chat_sent: '#E8F5E9',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#1A1A1A',
        chat_received_foreground: '#1A1A1A',
        header_background_color: '#2E7D32',
        button_background_color: '#2E7D32',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C62828',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#2E7D32',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#424242',
        bottom_navigation_active: '#2E7D32',
        bottom_navigation_inactive: '#9E9E9E',
        modal_background: '#FFFFFF',
        certified_badge: '#2E7D32'
    },
};

// Purple Light Theme
const purpleLightTheme: TTheme = {
    name: 'purple-light',
    dark: false,
    statusbar: 'light',
    colors: {
        primary: '#7B1FA2',
        background: '#FFFFFF',
        card: '#F5F3F7',
        success: '#2E7D32',
        text: '#1A1A1A',
        error: '#C62828',
        border: '#F3E5F5',
        like_border: '#7B1FA214',
        other: '#FFFFFF',
        notification: '#7B1FA2',
        gray: '#757575',
        high_color: '#7B1FA2',
        primary_high_color: '#FFD54F',
        primary_high_color_foreground: '#1A1A1A',
        high_color2: '#E65100',
        high_color3: '#1565C0',
        chat_sent: '#F3E5F5',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#1A1A1A',
        chat_received_foreground: '#1A1A1A',
        header_background_color: '#7B1FA2',
        button_background_color: '#7B1FA2',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C62828',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#7B1FA2',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#424242',
        bottom_navigation_active: '#7B1FA2',
        bottom_navigation_inactive: '#9E9E9E',
        modal_background: '#FFFFFF',
        certified_badge: '#7B1FA2'
    },
};

// Orange Light Theme
const orangeLightTheme: TTheme = {
    name: 'orange-light',
    dark: false,
    statusbar: 'light',
    colors: {
        primary: '#E65100',
        background: '#FFFFFF',
        card: '#FFF8F3',
        success: '#2E7D32',
        text: '#1A1A1A',
        error: '#C62828',
        border: '#FFE0B2',
        like_border: '#E6510014',
        other: '#FFFFFF',
        notification: '#E65100',
        gray: '#757575',
        high_color: '#1565C0',
        primary_high_color: '#FFE082',
        primary_high_color_foreground: '#1A1A1A',
        high_color2: '#E65100',
        high_color3: '#6A1B9A',
        chat_sent: '#FFF3E0',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#1A1A1A',
        chat_received_foreground: '#1A1A1A',
        header_background_color: '#E65100',
        button_background_color: '#E65100',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C62828',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#E65100',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#424242',
        bottom_navigation_active: '#E65100',
        bottom_navigation_inactive: '#9E9E9E',
        modal_background: '#FFFFFF',
        certified_badge: '#E65100'
    },
};

// Teal Light Theme
const tealLightTheme: TTheme = {
    name: 'teal-light',
    dark: false,
    statusbar: 'light',
    colors: {
        primary: '#00695C',
        background: '#FFFFFF',
        card: '#F0F7F6',
        success: '#2E7D32',
        text: '#1A1A1A',
        error: '#C62828',
        border: '#B2DFDB',
        like_border: '#00695C14',
        other: '#FFFFFF',
        notification: '#00695C',
        gray: '#757575',
        high_color: '#00695C',
        primary_high_color: '#FFD54F',
        primary_high_color_foreground: '#1A1A1A',
        high_color2: '#E65100',
        high_color3: '#7B1FA2',
        chat_sent: '#E0F2F1',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#1A1A1A',
        chat_received_foreground: '#1A1A1A',
        header_background_color: '#00695C',
        button_background_color: '#00695C',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C62828',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#00695C',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#424242',
        bottom_navigation_active: '#00695C',
        bottom_navigation_inactive: '#9E9E9E',
        modal_background: '#FFFFFF',
        certified_badge: '#00695C'
    },
};

// ============================================================================
// DARK THEME VARIATIONS - Based on base themes
// ============================================================================

// Blue Dark Theme
const blueDarkTheme: TTheme = {
    name: 'blue-dark',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#1976D2',
        background: '#121212',
        card: '#1E1E2E',
        success: '#4CAF50',
        text: '#FFFFFF',
        error: '#EF5350',
        border: '#2A3A4A',
        like_border: '#1976D226',
        other: '#FFFFFF',
        notification: '#42A5F5',
        gray: '#9E9E9E',
        high_color: '#42A5F5',
        primary_high_color: '#42A5F5',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#FFA726',
        high_color3: '#BA68C8',
        chat_sent: '#1A2A3A',
        chat_received: '#1A1A2A',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#1A2A3A',
        button_background_color: '#FFFFFF',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#1976D2',
        home_badge_background_color: '#EF5350',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#42A5F5',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#121212',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#42A5F5',
        bottom_navigation_inactive: '#757575',
        modal_background: '#1E1E2E',
        certified_badge: '#42A5F5'
    },
};

// Green Dark Theme
const greenDarkTheme: TTheme = {
    name: 'green-dark',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#2E7D32',
        background: '#121212',
        card: '#1E2E1E',
        success: '#4CAF50',
        text: '#FFFFFF',
        error: '#EF5350',
        border: '#2A3A2A',
        like_border: '#2E7D3226',
        other: '#FFFFFF',
        notification: '#66BB6A',
        gray: '#9E9E9E',
        high_color: '#66BB6A',
        primary_high_color: '#66BB6A',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#FFA726',
        high_color3: '#BA68C8',
        chat_sent: '#1A2A1A',
        chat_received: '#1A1A1A',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#1A2A1A',
        button_background_color: '#FFFFFF',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#2E7D32',
        home_badge_background_color: '#EF5350',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#66BB6A',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#121212',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#66BB6A',
        bottom_navigation_inactive: '#757575',
        modal_background: '#1E2E1E',
        certified_badge: '#66BB6A'
    },
};

// Purple Dark Theme
const purpleDarkTheme: TTheme = {
    name: 'purple-dark',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#7B1FA2',
        background: '#121212',
        card: '#2E1E2E',
        success: '#4CAF50',
        text: '#FFFFFF',
        error: '#EF5350',
        border: '#3A2A3A',
        like_border: '#7B1FA226',
        other: '#FFFFFF',
        notification: '#BA68C8',
        gray: '#9E9E9E',
        high_color: '#BA68C8',
        primary_high_color: '#BA68C8',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#FFA726',
        high_color3: '#42A5F5',
        chat_sent: '#2A1A2A',
        chat_received: '#1A1A1A',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#2A1A2A',
        button_background_color: '#FFFFFF',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#7B1FA2',
        home_badge_background_color: '#EF5350',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#BA68C8',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#121212',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#BA68C8',
        bottom_navigation_inactive: '#757575',
        modal_background: '#2E1E2E',
        certified_badge: '#BA68C8'
    },
};

// Orange Dark Theme
const orangeDarkTheme: TTheme = {
    name: 'orange-dark',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#E65100',
        background: '#121212',
        card: '#2E1E1A',
        success: '#4CAF50',
        text: '#FFFFFF',
        error: '#EF5350',
        border: '#3A2A1A',
        like_border: '#E6510026',
        other: '#FFFFFF',
        notification: '#FFA726',
        gray: '#9E9E9E',
        high_color: '#29B6F6',
        primary_high_color: '#FFA726',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#FFA726',
        high_color3: '#BA68C8',
        chat_sent: '#2A1A0A',
        chat_received: '#1A1A1A',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#2A1A0A',
        button_background_color: '#FFFFFF',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#E65100',
        home_badge_background_color: '#EF5350',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#FFA726',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#121212',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#FFA726',
        bottom_navigation_inactive: '#757575',
        modal_background: '#2E1E1A',
        certified_badge: '#FFA726'
    },
};

// Teal Dark Theme
const tealDarkTheme: TTheme = {
    name: 'teal-dark',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#00695C',
        background: '#121212',
        card: '#1E2E2A',
        success: '#4CAF50',
        text: '#FFFFFF',
        error: '#EF5350',
        border: '#2A3A2A',
        like_border: '#00695C26',
        other: '#FFFFFF',
        notification: '#26A69A',
        gray: '#9E9E9E',
        high_color: '#26A69A',
        primary_high_color: '#26A69A',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#FFA726',
        high_color3: '#BA68C8',
        chat_sent: '#1A2A1A',
        chat_received: '#1A1A1A',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#1A2A1A',
        button_background_color: '#FFFFFF',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#00695C',
        home_badge_background_color: '#EF5350',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#26A69A',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#121212',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#26A69A',
        bottom_navigation_inactive: '#757575',
        modal_background: '#1E2E2A',
        certified_badge: '#26A69A'
    },
};

// ============================================================================
// ADDITIONAL WHITE THEMES
// ============================================================================

// White Theme 2 (Green Accents)
const whiteTheme2: TTheme = {
    name: 'white-2',
    dark: false,
    statusbar: 'dark',
    colors: {
        primary: '#FFFFFF',
        background: '#FFFFFF',
        success: '#008000',
        card: '#FFFFFF',
        text: '#000000',
        error: '#FF0000',
        border: '#e6e6e6',
        like_border: '#0000000D',
        other: '#FFFFFF',
        notification: '#2E7D32',
        gray: '#808080',
        high_color: '#2E7D32',
        primary_high_color: '#2E7D32',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#e67300',
        high_color3: '#ac3973',
        chat_sent: '#F0F8F0',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#000000',
        chat_received_foreground: '#000000',
        header_background_color: '#FFFFFF',
        button_background_color: '#2E7D32',
        header_foreground_color: '#000000',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#2E7D32',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#000000',
        bottom_navigation_active: '#2E7D32',
        bottom_navigation_inactive: '#808080',
        modal_background: '#FFFFFF',
        certified_badge: '#2E7D32'
    },
};

// White Theme 3 (Purple Accents)
const whiteTheme3: TTheme = {
    name: 'white-3',
    dark: false,
    statusbar: 'dark',
    colors: {
        primary: '#FFFFFF',
        background: '#FFFFFF',
        success: '#008000',
        card: '#FFFFFF',
        text: '#000000',
        error: '#FF0000',
        border: '#e6e6e6',
        like_border: '#0000000D',
        other: '#FFFFFF',
        notification: '#7B1FA2',
        gray: '#808080',
        high_color: '#7B1FA2',
        primary_high_color: '#7B1FA2',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#e67300',
        high_color3: '#0050b4',
        chat_sent: '#F8F0FF',
        chat_received: '#FFFFFF',
        chat_sent_foreground: '#000000',
        chat_received_foreground: '#000000',
        header_background_color: '#FFFFFF',
        button_background_color: '#7B1FA2',
        header_foreground_color: '#000000',
        button_foreground_color: '#FFFFFF',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#7B1FA2',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#FFFFFF',
        bottom_navigation_text: '#000000',
        bottom_navigation_active: '#7B1FA2',
        bottom_navigation_inactive: '#808080',
        modal_background: '#FFFFFF',
        certified_badge: '#7B1FA2'
    },
};

// ============================================================================
// ADDITIONAL BLACK THEMES
// ============================================================================

// Black Theme 2 (Green Accents)
const blackTheme2: TTheme = {
    name: 'black-2',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#000000',
        background: '#000000',
        card: '#000000',
        success: '#008000',
        text: '#FFFFFF',
        error: '#FF0000',
        border: '#323232',
        like_border: '#FFFFFF0D',
        other: '#FFFFFF',
        notification: '#4CAF50',
        gray: '#808080',
        high_color: '#4CAF50',
        primary_high_color: '#4CAF50',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#ffa31a',
        high_color3: '#ac3973',
        chat_sent: '#142814',
        chat_received: '#000000',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#000000',
        button_background_color: '#4CAF50',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#000000',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#4CAF50',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#000000',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#4CAF50',
        bottom_navigation_inactive: '#808080',
        modal_background: '#272525',
        certified_badge: '#4CAF50'
    },
};

// Black Theme 3 (Purple Accents)
const blackTheme3: TTheme = {
    name: 'black-3',
    dark: true,
    statusbar: 'light',
    colors: {
        primary: '#000000',
        background: '#000000',
        card: '#000000',
        success: '#008000',
        text: '#FFFFFF',
        error: '#FF0000',
        border: '#323232',
        like_border: '#FFFFFF0D',
        other: '#FFFFFF',
        notification: '#BA68C8',
        gray: '#808080',
        high_color: '#BA68C8',
        primary_high_color: '#BA68C8',
        primary_high_color_foreground: '#FFFFFF',
        high_color2: '#ffa31a',
        high_color3: '#08a0cf',
        chat_sent: '#281428',
        chat_received: '#000000',
        chat_sent_foreground: '#FFFFFF',
        chat_received_foreground: '#FFFFFF',
        header_background_color: '#000000',
        button_background_color: '#BA68C8',
        header_foreground_color: '#FFFFFF',
        button_foreground_color: '#000000',
        home_badge_background_color: '#C81414',
        home_badge_color: '#FFFFFF',
        badge_background_color: '#BA68C8',
        badge_color: '#FFFFFF',
        bottom_navigation_background: '#000000',
        bottom_navigation_text: '#FFFFFF',
        bottom_navigation_active: '#BA68C8',
        bottom_navigation_inactive: '#808080',
        modal_background: '#272525',
        certified_badge: '#BA68C8'
    },
};

// ============================================================================
// EXPORT THEME ARRAYS
// ============================================================================

export const lightThemes: Array<TTheme> = [
    whiteTheme,
    defaultTheme,
    whiteTheme2,
    whiteTheme3,
    blueLightTheme,
    greenLightTheme,
    purpleLightTheme,
    orangeLightTheme,
    tealLightTheme,
];

export const darkThemes: Array<TTheme> = [
    darkTheme,
    blackTheme,
    blackTheme2,
    blackTheme3,
    blueDarkTheme,
    greenDarkTheme,
    purpleDarkTheme,
    orangeDarkTheme,
    tealDarkTheme,
];

// Combine all themes for backward compatibility
export const themes: Array<TTheme> = [...lightThemes, ...darkThemes];

/**
 * Checks if a given theme has all required fields populated.
 */
export const isThemeAligned = (theme: TTheme | null | undefined): boolean => {
    if (!theme || typeof theme !== 'object') return false;
    if (!theme.name || typeof theme.dark !== 'boolean' || !theme.statusbar) return false;
    if (!theme.colors || typeof theme.colors !== 'object') return false;

    const requiredColorKeys: Array<keyof TTheme['colors']> = [
        'primary',
        'background',
        'card',
        'success',
        'text',
        'error',
        'border',
        'like_border',
        'other',
        'notification',
        'gray',
        'high_color',
        'primary_high_color',
        'primary_high_color_foreground',
        'high_color2',
        'high_color3',
        'chat_sent',
        'chat_received',
        'chat_sent_foreground',
        'chat_received_foreground',
        'header_background_color',
        'button_background_color',
        'header_foreground_color',
        'button_foreground_color',
        'home_badge_background_color',
        'home_badge_color',
        'badge_background_color',
        'badge_color',
        'bottom_navigation_background',
        'bottom_navigation_text',
        'bottom_navigation_active',
        'bottom_navigation_inactive',
        'modal_background',
        'certified_badge',
    ];

    return requiredColorKeys.every(key => typeof theme.colors[key] === 'string' && theme.colors[key].length > 0);
};

// Theme Preview Component
const ThemePreview = ({ themeItem, isSelected, onPress, cardWidth }: { themeItem: TTheme, isSelected: boolean, onPress: () => void, cardWidth: number }) => {
    const currentTheme = useAppSelector(state => state.app_theme);

    return (
        <Pressable
            onPress={onPress}
            style={{
                width: cardWidth,
                marginBottom: 16,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: isSelected ? themeItem.colors.primary : currentTheme.colors.border,
                backgroundColor: currentTheme.colors.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 3,
            }}
        >
            {/* Phone-like Preview Rectangle */}
            <View style={{ position: 'relative' }}>
                {/* Small top part (header/status bar) */}
                <View
                    style={{
                        height: 24,
                        backgroundColor: themeItem.colors.primary,
                        width: '100%',
                        borderBottomWidth: (themeItem.colors.primary === '#FFFFFF' || themeItem.colors.primary === '#000000') ? 1 : 0,
                        borderBottomColor: themeItem.colors.primary === '#FFFFFF' ? '#e6e6e6' : themeItem.colors.primary === '#000000' ? '#323232' : 'transparent',
                    }}
                />

                {/* Large middle part (background) */}
                <View
                    style={{
                        height: 120,
                        backgroundColor: themeItem.colors.background,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {/* Floating element at bottom-right (high_color) */}
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: themeItem.colors.high_color,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        <IconApp
                            pack="FI"
                            name="star"
                            size={20}
                            color="#FFFFFF"
                        />
                    </View>
                </View>
            </View>

            {/* Theme Name Footer (fixed check row height so selected/unselected cards match) */}
            <View style={{
                padding: 12,
                backgroundColor: themeItem.colors.background,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <View style={{ height: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                    {isSelected ? (
                        <IconApp
                            pack="IO"
                            name="checkmark-circle"
                            size={18}
                            color={themeItem.colors.success}
                        />
                    ) : null}
                </View>
                <Text
                    style={{
                        textAlign: 'center',
                        fontSize: 12,
                        color: themeItem.colors.text,
                    }}
                >
                    {themeItem.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
            </View>
        </Pressable>
    );
};

const Themes = () => {
    const dispatch = useAppDispatch();
    const theme = useAppSelector(state => state.app_theme);

    // Calculate responsive columns and card width
    const screenWidth = Dimensions.get('window').width;
    const padding = 20; // Horizontal padding
    const gap = 12; // Gap between cards
    const availableWidth = screenWidth - (padding * 2);

    // Determine number of columns based on screen width
    let numColumns = 3;
    if (screenWidth >= 768) {
        numColumns = 4; // Tablet or large screen
    } else if (screenWidth >= 480) {
        numColumns = 3; // Medium screen
    } else {
        numColumns = 3; // Small screen
    }

    const cardWidth = (availableWidth - (gap * (numColumns - 1))) / numColumns;

    const set_app_theme = (theme_set: TTheme) => {
        dispatch(setTheme(theme_set));
        dispatch(setThemeSet(true));

        // setRootViewBackgroundColor(theme_set.colors.background);

        // if(Platform.OS === 'android') {
        //     NavigationBar.setBackgroundColorAsync(theme_set.colors.background);
        //     NavigationBar.setButtonStyleAsync(theme_set.dark ? "light" : "dark");
        // }

        let navTheme = DefaultTheme;
        navTheme.colors.background = theme_set.colors.background;
        navTheme.colors.text = theme_set.colors.text;
        navTheme.colors.primary = theme_set.colors.primary;
        navTheme.colors.card = theme_set.colors.card;
        navTheme.colors.border = theme_set.colors.border;
        navTheme.colors.notification = theme_set.colors.notification;
    }

    // Helper function to render theme grid
    const renderThemeGrid = (themes: Array<TTheme>) => {
        const rows: React.ReactElement[] = [];
        for (let i = 0; i < themes.length; i += numColumns) {
            const rowThemes = themes.slice(i, i + numColumns);
            rows.push(
                <View
                    key={`row-${i}`}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: gap,
                    }}
                >
                    {rowThemes.map((themeItem) => (
                        <ThemePreview
                            key={`theme-${themeItem.name}`}
                            themeItem={themeItem}
                            isSelected={theme.name === themeItem.name}
                            onPress={() => set_app_theme(themeItem)}
                            cardWidth={cardWidth}
                        />
                    ))}
                    {/* Fill remaining space if last row has fewer items */}
                    {rowThemes.length < numColumns && (
                        <View style={{ width: cardWidth }} />
                    )}
                </View>
            );
        }
        return rows;
    };

    return (
        <View style={{ backgroundColor: theme.colors.background, flex: 1, borderColor: theme.colors.border, borderTopWidth: 1 }}>
            <StatusBarYambi />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: padding, paddingVertical: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Light Themes Section */}
                <View style={{ marginBottom: 32 }}>
                    <View style={{ marginBottom: 16 }}>
                        <TextBigYambi text={strings.white_themes} />
                    </View>

                    {renderThemeGrid(lightThemes)}
                </View>

                {/* Dark Themes Section */}
                <View style={{ marginBottom: 32 }}>
                    <View style={{ marginBottom: 16 }}>
                        <TextBigYambi text={strings.black_themes} />
                    </View>

                    {renderThemeGrid(darkThemes)}
                </View>
            </ScrollView>
        </View>
    );
}

export default Themes;

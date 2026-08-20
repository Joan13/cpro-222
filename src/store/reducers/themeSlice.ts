import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';
import { TTheme } from '../../types/types';
import { themes } from '../../pages/app/Themes';

const initialState: TTheme = themes[0];

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<TTheme>) => {
            state.dark = action.payload.dark;
            state.name = action.payload.name;
            state.statusbar = action.payload.statusbar;
            state.colors = {
                primary: action.payload.colors.primary,
                like_border: action.payload.colors.like_border,
                background: action.payload.colors.background,
                success: action.payload.colors.success,
                text: action.payload.colors.text,
                border: action.payload.colors.border,
                gray: action.payload.colors.gray,
                error: action.payload.colors.error,
                notification: action.payload.colors.notification,
                card: action.payload.colors.card,
                other: action.payload.colors.other,
                high_color: action.payload.colors.high_color,
                primary_high_color: action.payload.colors.primary_high_color,
                primary_high_color_foreground: action.payload.colors.primary_high_color_foreground || '#FFFFFF',
                high_color2: action.payload.colors.high_color2,
                high_color3: action.payload.colors.high_color3,
                chat_sent: action.payload.colors.chat_sent,
                chat_received: action.payload.colors.chat_received,
                chat_sent_foreground: action.payload.colors.chat_sent_foreground,
                chat_received_foreground: action.payload.colors.chat_received_foreground,
                header_background_color: action.payload.colors.header_background_color,
                button_background_color: action.payload.colors.button_background_color,
                header_foreground_color: action.payload.colors.header_foreground_color,
                button_foreground_color: action.payload.colors.button_foreground_color,
                home_badge_background_color: action.payload.colors.home_badge_background_color,
                home_badge_color: action.payload.colors.home_badge_color,
                badge_color: action.payload.colors.badge_color,
                badge_background_color: action.payload.colors.badge_background_color,
                bottom_navigation_background: action.payload.colors.bottom_navigation_background,
                bottom_navigation_text: action.payload.colors.bottom_navigation_text,
                bottom_navigation_active: action.payload.colors.bottom_navigation_active,
                bottom_navigation_inactive: action.payload.colors.bottom_navigation_inactive,
                modal_background: action.payload.colors.modal_background,
                certified_badge: action.payload.colors.certified_badge || '#1DA1F2'
            }
        }
    }
})

export const { setTheme } = themeSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectTheme = (state: RootState) => state.app_theme;

export default themeSlice.reducer;

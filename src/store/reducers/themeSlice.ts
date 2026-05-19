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
            state.statusbar_tip1 = action.payload.statusbar_tip1;
            state.statusbar_tip2 = action.payload.statusbar_tip2;
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
                high_color2: action.payload.colors.high_color2,
                high_color3: action.payload.colors.high_color3,
                chat_sent: action.payload.colors.chat_sent,
                chat_received: action.payload.colors.chat_received,
                design_tip1: action.payload.colors.design_tip1,
                design_tip2: action.payload.colors.design_tip2,
                text_design1: action.payload.colors.text_design1,
                text_design2: action.payload.colors.text_design2,
                home_badge_background_color: action.payload.colors.home_badge_background_color,
                home_badge_color: action.payload.colors.home_badge_color,
                badge_color: action.payload.colors.badge_color,
                badge_background_color: action.payload.colors.badge_background_color,
                bottom_navigation_background: action.payload.colors.bottom_navigation_background,
                bottom_navigation_text: action.payload.colors.bottom_navigation_text,
                bottom_navigation_active: action.payload.colors.bottom_navigation_active,
                bottom_navigation_inactive: action.payload.colors.bottom_navigation_inactive,
                modal_background: action.payload.colors.modal_background
            }
        }
    }
})

export const { setTheme } = themeSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectTheme = (state: RootState) => state.app_theme;

export default themeSlice.reducer;

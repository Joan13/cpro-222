import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';
import { TUser } from '../../types/types';

const initialState: TUser = {
    user_id: "0",
    user_names: "",
    phone_number: "",
    gender: 0,
    birth_date: "",
    country: "",
    user_profile: "",
    profession: "",
    notification_token: "",
    bio: "",
    user_email: "",
    user_address: "",
    status_information: "",
    user_password: "",
    account_privacy: 0,
    user_level: 0,
    user_active: 1,
    user_verified: 0,
    user_verified_at: "",
    createdAt: "",
    updatedAt: ""
}

export const userSlice = createSlice({
    name: 'user_data',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        updateUser: (state, action: PayloadAction<TUser>) => {
            state.user_id = action.payload.user_id;
            state.user_names = action.payload.user_names;
            state.phone_number = action.payload.phone_number;
            state.gender = action.payload.gender;
            state.country = action.payload.country;
            state.user_profile = action.payload.user_profile;
            state.birth_date = action.payload.birth_date;
            state.user_address = action.payload.user_address;
            state.user_email = action.payload.user_email;
            state.notification_token = action.payload.notification_token;
            state.bio = action.payload.bio;
            state.profession = action.payload.profession;
            state.status_information = action.payload.status_information;
            state.user_password = action.payload.user_password;
            state.user_level = action.payload.user_level || 0;
            state.user_active = action.payload.user_active || 1;
            state.user_verified = action.payload.user_verified || 0;
            state.user_verified_at = action.payload.user_verified_at || "";
            state.account_privacy = action.payload.account_privacy;
            state.createdAt = action.payload.createdAt;
            state.updatedAt = action.payload.updatedAt;
        },
        updateUserProfile: (state, action: PayloadAction<string>) => {
            state.user_profile = action.payload;
        }
    }
})

export const { updateUser, updateUserProfile } = userSlice.actions;
export const selectUser = (state: RootState) => state.user_data;
export default userSlice.reducer;

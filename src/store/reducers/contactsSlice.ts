import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';
import { TUsers } from '../../types/types';

const initialState: TUsers = [];

export const contactsSlice = createSlice({
    name: 'contacts',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        setContacts: (state, action: PayloadAction<TUsers>) => {
            // state.user_id = action.payload.user_id;
            // state.user_names = action.payload.user_names;
            // state.phone_number = action.payload.phone_number;
            // state.gender = action.payload.gender;
            // state.country = action.payload.country;
            // state.user_profile = action.payload.user_profile;
            // state.birth_date = action.payload.birth_date;
            // state.user_address = action.payload.user_address;
            // state.user_email = action.payload.user_email;
            // state.bio = action.payload.bio;
            // state.profession = action.payload.profession;
            // state.status_information = action.payload.status_information;
            // state.user_password = action.payload.user_password;
            // state.account_valid = action.payload.account_valid;
            // state.account_privacy = action.payload.account_privacy;
            // state.createdAt = action.payload.createdAt;
            // state.updatedAt = action.payload.updatedAt;

            action.payload.map((item, index) => (
                state[index] = item
            ));
        }
    }
});

export const { setContacts } = contactsSlice.actions;
export const selectContacts = (state: RootState) => state.contacts;
export default contactsSlice.reducer;

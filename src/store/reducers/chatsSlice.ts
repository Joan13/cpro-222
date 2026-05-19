import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../app/store';
import { TChat, TChats } from '../../types/types';

const initialState: TChats = [];

export const chatsSlice = createSlice({
    name: 'chats',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        addChat: (state, action: PayloadAction<TChat>) => {
            state.push(action.payload);
        }
    }
})

export const { addChat } = chatsSlice.actions;
export const selectChats = (state: RootState) => state.chats;
export default chatsSlice.reducer;



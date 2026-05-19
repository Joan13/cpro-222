// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import type { RootState } from '../app/store';
// import { TDraft, TDrafts, TMessage, TMessages } from '../../types/types';
// import { UsersMessages } from '../database/Models';
// import { RefObject } from 'react';

// const initialState: TDrafts = [];

// export const draftSlice = createSlice({
//     name: 'drafts',
//     // `createSlice` will infer the state type from the `initialState` argument
//     initialState,
//     reducers: {
//         addDraft: (state, action: PayloadAction<TDraft>) => {
//             let draft = state.find(dd => dd.user.phone_number === action.payload.user.phone_number);
//             let index = state.findIndex(dd => dd.user.phone_number === action.payload.user.phone_number);
//             if (draft === undefined) {
//                 state.push(action.payload);
//             } else {
//                 state[index].message_inbox = action.payload.message_inbox;
//             }
//         },
//         setInputMessageRef: (state, action: PayloadAction) => {
//             // action.payload.map((item, index) => (
//             //     state[index] = item
//             // ));
//             // state = action.payload as any;
//         },
//     }
// })

// export const { addDraft, setInputMessageRef } = draftSlice.actions;
// export const selectMessages = (state: RootState) => state.drafts;
// export default draftSlice.reducer;

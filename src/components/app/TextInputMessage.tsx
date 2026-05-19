import { TextInput, BackHandler, Keyboard } from 'react-native';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { TChat, TDraft, TSelection } from '../../types/types';
import { setMessageInbox, setShowCustomKeyboard, setEmoji } from '../../store/reducers/appSlice';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { strings } from '../../lang/lang';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats } from '../../store/database/Models';
const TextInputComponent = ({ user }: { user: string }) => {

    const message_inbox = useAppSelector(state => state.app.message_inbox);
    const inputEmoji = useAppSelector(state => state.app.inputEmoji);
    const app_theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const show_custom_keyboard = useAppSelector(state => state.app.show_custom_keyboard);
    // const drafts = useAppSelector(state => state.drafts);
    // const current_user = useAppSelector(state => state.current_user);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const realm = useRealm();
    const dispatch = useAppDispatch();
    const inputRef = useRef(null);

    // let timeout_id = undefined;
    const [timeout_id, setTimeout_id] = useState(undefined);

    // const draft = useMemo(()=> useObject(UserChats, user),[]);
    const draft = useObject(UserChats, user);

    // const draft = drafts.find(dd => dd.user.phone_number === current_user.phone_number);

    const InsertText = () => {
        if (!inputEmoji) return;
        
        const start = selection.start;
        const end = selection.end;
        const newText = message_inbox.slice(0, start) + inputEmoji + message_inbox.slice(end);
        
        // Dispatch the new text to Redux
        dispatch(setMessageInbox(newText));

        // Update the cursor position after the emoji
        setSelection({
            start: start + inputEmoji.length,
            end: start + inputEmoji.length,
        });
        
        // Clear the emoji from Redux after insertion
        dispatch(setEmoji(""));
    }

    const handleSelectionChange = useCallback((event) => {
        setSelection(event.nativeEvent.selection);
    }, []);

    const handleFocus = () => {
        // When emoji keyboard is open, prevent system keyboard from showing
        if (show_custom_keyboard) {
            Keyboard.dismiss();
            // Don't close emoji keyboard, just keep it open
        }
        // If emoji keyboard was just closed, allow system keyboard to show
    };

    const useDraft = useCallback(() => {
        // if (draft !== null) {
        //     if (draft.draft !== "") {
        //         dispatch(setMessageInbox(draft.draft))
        //     }
        // }
    }, []);

    const quit_and_save = () => {
        // console.log("Quit")
        if (message_inbox !== "") {
            // const draftt = {
            //     _id: draft.phone_number,
            //     phone_number: draft.phone_number,
            //     type_chat: draft.type_chat,
            //     draft: message_inbox,
            //     last_message: draft.last_message,
            //     user: draft.user,
            //     flag: draft.flag,
            //     chat_read: draft.chat_read,
            //     deleted: draft.deleted,
            //     chat_effect: draft.chat_read,
            //     createdAt: draft.createdAt,
            //     updatedAt: draft.updatedAt,
            // }

            // realm.write(() => {
            //     try {
            //         realm.create('UserChats', draftt, true);
            //     } catch (error) {
            //         console.log(error);
            //     }
            // });

            console.log(message_inbox + "::");
        }
    }

    useEffect(() => {
        useDraft();
        if (inputEmoji) {
            InsertText();
            // Don't focus the input after inserting emoji if emoji keyboard is open
            // This prevents system keyboard from appearing
            // if (inputRef.current && !show_custom_keyboard) {
            //     setTimeout(() => {
            //         inputRef.current?.focus();
            //     }, 50);
            // }
        }

        return () => {
            clearTimeout(timeout_id);
        }

    }, [inputEmoji]);

    // Handle emoji keyboard closing - show system keyboard
    useEffect(() => {
        if (!show_custom_keyboard && inputRef.current) {
            // When emoji keyboard closes, focus input to show system keyboard
            // setTimeout(() => {
            //     inputRef.current?.focus();
            // }, 200);
        }
    }, [show_custom_keyboard]);

    const handleChangeText = useCallback((text: string) => {

        // dispatch(addDraft({ message_inbox: text, user: current_user }));
        dispatch(setMessageInbox(text));
        clearTimeout(timeout_id);
        if (draft !== null) {
            // console.log("Ok")
            setTimeout_id(setTimeout(() => {
                if (message_inbox.length !== 0) {
                    const draftt = {
                        _id: draft.phone_number,
                        phone_number: draft.phone_number,
                        type_chat: draft.type_chat,
                        last_message: draft.last_message,
                        user: draft.user,
                        flag: draft.flag,
                        chat_read: draft.chat_read,
                        deleted: draft.deleted,
                        chat_effect: draft.chat_read,
                        createdAt: draft.createdAt,
                        updatedAt: draft.updatedAt,
                    }

                    // realm.write(() => {
                    //     try {
                    //         realm.create('UserChats', draftt, true);
                    //     } catch (error) { }
                    // });

                    // console.log("Can update");
                }
            }, 2000));
        }
    }, []);

    return (
        <>
        <TextInput
            onSelectionChange={handleSelectionChange}
            selection={selection}
            multiline={true}
            ref={inputRef}
            onFocus={handleFocus}
            // showSoftInputOnFocus={!show_custom_keyboard}
            showSoftInputOnFocus={true}
            onBlur={() => {
                // this.props.dispatch({ type: 'SET_SCROLL_TO_END', payload: true });
            }}

            style={{ paddingLeft: 10, paddingTop: 0, minHeight: 50, fontSize: app_description.general_font_size, maxHeight: 150, color: app_theme.colors.text, backgroundColor: app_theme.colors.background, paddingBottom: 2 }}
            placeholder={strings.type_message}
            // value={draft !== null ? draft.draft : null}
            value={message_inbox}
            onChangeText={handleChangeText}
            placeholderTextColor={app_theme.colors.gray}
        />

        
        </>
    );
};

export default TextInputComponent;

import { TextInput, BackHandler, Keyboard } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from "../../store/app/hooks";
import { TChat, TDraft, TSelection } from '../../types/types';
import { setMessageInbox, setResponseTo, setShowCustomKeyboard, setEmoji } from '../../store/reducers/appSlice';
import { saveChatDraft, removeChatDraft } from '../../store/reducers/persistedAppSlice';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { strings } from '../../lang/lang';
import { useObject, useQuery, useRealm } from '@realm/react';
import { UserChats } from '../../store/database/Models';

const TextInputComponent = ({ user }: { user: string }) => {

    const message_inbox = useAppSelector(state => state.app.message_inbox);
    const inputEmoji = useAppSelector(state => state.app.inputEmoji);
    const app_theme = useAppSelector(state => state.app_theme);
    const app_description = useAppSelector(state => state.persisted_app.app_description);
    const chatDrafts = useAppSelector(state => state.persisted_app.chatDrafts || {});
    const show_custom_keyboard = useAppSelector(state => state.app.show_custom_keyboard);
    const response_to = useAppSelector(state => state.app.response_to);

    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const realm = useRealm();
    const dispatch = useAppDispatch();
    const inputRef = useRef<TextInput>(null);
    const isRestoringDraftRef = useRef(false);

    const route = useRoute<any>();
    const routeResponseTo = route?.params?.response_to;

    // Populate or reset draft when opening a chat for user
    useEffect(() => {
        if (!user) return;
        isRestoringDraftRef.current = true;
        const currentDraft = chatDrafts[user];
        if (routeResponseTo) {
            dispatch(setResponseTo(routeResponseTo));
            if (currentDraft?.message) {
                dispatch(setMessageInbox(currentDraft.message));
            }
        } else if (currentDraft) {
            dispatch(setMessageInbox(currentDraft.message || ''));
            dispatch(setResponseTo(currentDraft.responseTo || ''));
        } else {
            dispatch(setMessageInbox(''));
            dispatch(setResponseTo(''));
        }
        const timer = setTimeout(() => {
            isRestoringDraftRef.current = false;
        }, 150);
        return () => clearTimeout(timer);
    }, [user, routeResponseTo]);

    const draftTimerRef = useRef<NodeJS.Timeout | null>(null);

    const saveDraftDebounced = useCallback((targetUser: string, respTo: string, text: string) => {
        if (draftTimerRef.current) {
            clearTimeout(draftTimerRef.current);
        }
        draftTimerRef.current = setTimeout(() => {
            dispatch(saveChatDraft({ user: targetUser, responseTo: respTo, message: text }));
        }, 300);
    }, [dispatch]);

    useEffect(() => {
        return () => {
            if (draftTimerRef.current) {
                clearTimeout(draftTimerRef.current);
            }
        };
    }, []);

    // Save draft whenever response_to changes
    useEffect(() => {
        if (!user || isRestoringDraftRef.current) return;
        saveDraftDebounced(user, response_to || '', message_inbox || '');
    }, [user, response_to, saveDraftDebounced]);

    const InsertText = () => {
        if (!inputEmoji) return;
        
        const start = selection.start;
        const end = selection.end;
        const newText = message_inbox.slice(0, start) + inputEmoji + message_inbox.slice(end);
        
        dispatch(setMessageInbox(newText));
        if (user) {
            saveDraftDebounced(user, response_to || '', newText);
        }

        setSelection({
            start: start + inputEmoji.length,
            end: start + inputEmoji.length,
        });
        
        dispatch(setEmoji(""));
    }

    const handleSelectionChange = useCallback((event: any) => {
        setSelection(event.nativeEvent.selection);
    }, []);

    const handleFocus = () => {
        if (show_custom_keyboard) {
            Keyboard.dismiss();
        }
    };

    useEffect(() => {
        if (inputEmoji) {
            InsertText();
        }
    }, [inputEmoji]);

    // Auto-focus when swipe-to-reply is triggered
    useEffect(() => {
        if (response_to && response_to !== '') {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [response_to]);

    const handleChangeText = useCallback((text: string) => {
        dispatch(setMessageInbox(text));
        if (user) {
            saveDraftDebounced(user, response_to || '', text);
        }
    }, [user, response_to, saveDraftDebounced, dispatch]);

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
